"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { derivados, formatarBRL } from "@/lib/dinheiro";
import { exigirSessao, podeLancar, vePorInteiro, type UsuarioSessao } from "@/lib/sessao";
import { ROTULOS_STATUS } from "@/lib/opcoes";
import {
  cambio,
  dataOpcional,
  dinheiro,
  falha,
  opcaoValida,
  sucesso,
  texto,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import type { StatusItem } from "@/generated/prisma/enums";

/**
 * Ações de campo único, chamadas direto da linha da lista.
 *
 * Existem por causa de um defeito concreto: `salvarCusto` reescreve os catorze
 * campos do item a cada gravação. Quem só queria marcar um contrato como
 * cancelado acabava reenviando natureza, moeda e comportamento junto — e um
 * item CAPEX voltava classificado como RECORRENTE porque o `<select>` da tela
 * não oferecia CAPEX e caía na primeira opção. Mudar a situação passa a
 * atualizar a situação. Nada além disso.
 *
 * Todas seguem o mesmo contrato: devolvem `Resultado`, nunca redirecionam, e
 * carregam `desfazer` quando a operação é reversível.
 */

const STATUS = [
  "ATIVO",
  "EM_ANALISE",
  "CANCELAMENTO_SOLICITADO",
  "CANCELADO",
  "SUBSTITUIDO",
  "PENDENTE_APURACAO",
] as const;

/** Campos que o Desfazer sabe restaurar. Qualquer outro é recusado. */
const CAMPOS_REVERSIVEIS = ["status", "dataFim", "valorPeriodo", "semPrazoDeterminado"] as const;
type CampoReversivel = (typeof CAMPOS_REVERSIVEIS)[number];

function atualizarListas(itemId: string) {
  revalidatePath("/custos");
  revalidatePath(`/custos/${itemId}`);
  revalidatePath("/");
}

/**
 * Um custo compartilhado entre setores não é mexido pelo gestor de um deles:
 * alterar o valor mexeria na fatia dos outros. Quem enxerga por inteiro pode.
 *
 * Devolve o item quando permitido, ou a frase que explica a recusa — o texto
 * fica aqui, junto da regra, para a tela nunca ter que adivinhar o motivo.
 */
async function itemQuePosseMexer(
  usuario: UsuarioSessao,
  id: string,
): Promise<
  | { ok: true; item: { descricao: string; status: StatusItem; excluidoEm: Date | null } }
  | { ok: false; erro: string }
> {
  if (!podeLancar(usuario.papel)) {
    return { ok: false, erro: "Seu perfil permite consultar, não alterar." };
  }

  const item = await prisma.itemCusto.findUnique({
    where: { id },
    select: {
      descricao: true,
      status: true,
      excluidoEm: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { setorId: true, percentual: true },
      },
    },
  });
  if (!item) return { ok: false, erro: "Este custo não existe mais." };

  if (!vePorInteiro(usuario.papel)) {
    const soDoMeuSetor =
      item.rateios.length === 1 &&
      item.rateios[0].setorId === usuario.setorId &&
      Number(item.rateios[0].percentual) === 100;
    if (!soDoMeuSetor) {
      return {
        ok: false,
        erro: "Custo compartilhado entre setores — alterações passam pela Controladoria.",
      };
    }
  }

  return { ok: true, item };
}

/** Registra a alteração com o antes e o depois, para o histórico do item. */
async function registrar(
  usuarioId: string,
  itemId: string,
  antes: Record<string, unknown>,
  depois: Record<string, unknown>,
) {
  await prisma.auditoria.create({
    data: {
      tabela: "item_custo",
      registroId: itemId,
      acao: "ALTERACAO",
      usuarioId,
      diff: { antes, depois } as never,
    },
  });
}

/** Serializa um valor de campo para caber no payload de desfazer. */
function paraTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor);
}

// ---------------------------------------------------------------------------

export async function alterarSituacao(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  const status = opcaoValida<StatusItem>(dados, "status", STATUS);
  if (!id || !status) return falha("Situação inválida.");

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);
  const anterior = permissao.item.status;
  if (anterior === status) return sucesso();

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({ where: { id }, data: { status } });
    await registrar(usuario.id, id, { status: anterior }, { status });
  });

  atualizarListas(id);
  return sucesso(`${permissao.item.descricao}: ${ROTULOS_STATUS[status].toLowerCase()}.`, {
    destaqueId: id,
    desfazer: { acao: "reverterCampo", id, antes: { status: anterior } },
  });
}

export async function definirDataFim(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const bruto = texto(dados, "dataFim");
  const dataFim = dataOpcional(dados, "dataFim");
  // Campo preenchido que não vira data é erro de digitação, não "sem data":
  // gravar null aqui apagaria em silêncio o que a pessoa tentou informar.
  if (bruto !== "" && dataFim === null) {
    return falha("Não consegui ler essa data.", undefined, "dataFim");
  }

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const antes = await prisma.itemCusto.findUnique({
    where: { id },
    select: { dataFim: true, dataInicio: true },
  });
  if (!antes) return falha("Este custo não existe mais.");
  if (dataFim && antes.dataInicio && dataFim < antes.dataInicio) {
    return falha("A data de término é anterior à de início.", undefined, "dataFim");
  }

  await prisma.$transaction(async (tx) => {
    // Informar a data de renovação encerra a pendência "sem prazo": as duas
    // marcações não podem valer ao mesmo tempo sem tornar a fila mentirosa.
    await tx.itemCusto.update({
      where: { id },
      data: { dataFim, ...(dataFim ? { semPrazoDeterminado: false } : {}) },
    });
    await registrar(
      usuario.id,
      id,
      { dataFim: paraTexto(antes.dataFim) },
      { dataFim: paraTexto(dataFim) },
    );
  });

  atualizarListas(id);
  return sucesso(
    dataFim
      ? `${permissao.item.descricao} renova em ${dataFim.toLocaleDateString("pt-BR", { timeZone: "UTC" })}.`
      : `${permissao.item.descricao} ficou sem data de renovação.`,
    {
      destaqueId: id,
      desfazer: { acao: "reverterCampo", id, antes: { dataFim: paraTexto(antes.dataFim) } },
    },
  );
}

export async function marcarSemPrazo(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const antes = await prisma.itemCusto.findUnique({
    where: { id },
    select: { semPrazoDeterminado: true, dataFim: true },
  });
  if (!antes) return falha("Este custo não existe mais.");

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({
      where: { id },
      data: { semPrazoDeterminado: true, dataFim: null },
    });
    await registrar(
      usuario.id,
      id,
      { semPrazoDeterminado: antes.semPrazoDeterminado, dataFim: paraTexto(antes.dataFim) },
      { semPrazoDeterminado: true, dataFim: null },
    );
  });

  atualizarListas(id);
  return sucesso(`${permissao.item.descricao} não tem prazo determinado.`, {
    destaqueId: id,
    desfazer: {
      acao: "reverterCampo",
      id,
      antes: { semPrazoDeterminado: "false", dataFim: paraTexto(antes.dataFim) },
    },
  });
}

/**
 * Informa a cotação de um custo em moeda estrangeira.
 *
 * É o atalho que tira o item do limbo: até existir uma taxa, o valor está
 * preenchido na tela e o custo não entra em soma nenhuma. Informar a taxa
 * recalcula o mensal em real na mesma transação — não existe um instante em que
 * o item tenha câmbio e continue fora do total.
 *
 * Não muda a moeda. Trocar dólar por euro é reescrever o que o contrato diz, e
 * isso é edição, com histórico e leitura do valor inteiro.
 */
export async function definirCambio(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const bruto = texto(dados, "cambio");
  const taxa = cambio(dados, "cambio");
  if (taxa === null) {
    return falha(
      bruto
        ? `Não consegui ler «${bruto}» como cotação. Escreva no formato 5,4321.`
        : "Informe a cotação.",
      undefined,
      "cambio",
    );
  }

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const antes = await prisma.itemCusto.findUnique({
    where: { id },
    select: {
      moeda: true,
      cambio: true,
      cambioEm: true,
      valorPeriodo: true,
      periodicidade: true,
    },
  });
  if (!antes) return falha("Este custo não existe mais.");
  if (antes.moeda === "BRL") {
    return falha("Este custo já está em real — não há o que converter.");
  }

  const quando = dataOpcional(dados, "cambioEm") ?? hojeUTC();
  const valores = derivados(antes.valorPeriodo, antes.periodicidade, antes.moeda, taxa);

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({
      where: { id },
      data: {
        cambio: taxa,
        cambioEm: quando,
        ...valores,
      },
    });
    await registrar(
      usuario.id,
      id,
      { cambio: paraTexto(antes.cambio), cambioEm: paraTexto(antes.cambioEm) },
      { cambio: taxa, cambioEm: quando.toISOString().slice(0, 10) },
    );
  });

  atualizarListas(id);

  // A frase muda com a natureza do que foi convertido: um contrato mensal ganha
  // um "/mês", uma compra única ganha o total. Anunciar "/mês" para um pagamento
  // único seria inventar uma recorrência que não existe.
  return sucesso(
    valores.valorMensalNormalizado
      ? `${permissao.item.descricao}: ${formatarBRL(valores.valorMensalNormalizado)}/mês.`
      : valores.valorEmReais
        ? `${permissao.item.descricao}: ${formatarBRL(valores.valorEmReais)}.`
        : `Cotação de ${permissao.item.descricao} registrada.`,
    {
      destaqueId: id,
      detalhe: valores.valorEmReais ? "Agora entra nos totais." : undefined,
    },
  );
}

function hojeUTC(): Date {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  return hoje;
}

export async function alterarValor(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const bruto = texto(dados, "valorPeriodo");
  const valorPeriodo = dinheiro(dados, "valorPeriodo");
  if (bruto !== "" && valorPeriodo === null) {
    return falha(
      `Não consegui ler «${bruto}» como valor. Escreva no formato 1.234,56.`,
      undefined,
      "valorPeriodo",
    );
  }

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const antes = await prisma.itemCusto.findUnique({
    where: { id },
    select: {
      valorPeriodo: true,
      periodicidade: true,
      status: true,
      moeda: true,
      cambio: true,
    },
  });
  if (!antes) return falha("Este custo não existe mais.");

  // O atalho da lista muda o valor, nunca a moeda: a conversão usa a taxa que o
  // item já tem. Um item em dólar sem câmbio continua fora do total — corrigir
  // isso é edição, não atalho, porque exige decidir uma cotação.
  const valores = derivados(valorPeriodo, antes.periodicidade, antes.moeda, antes.cambio);

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({
      where: { id },
      data: {
        valorPeriodo,
        ...valores,
        // Informar o valor resolve a pendência de apuração por si só; manter o
        // status "a apurar" com valor preenchido deixa a fila mentindo.
        ...(valorPeriodo !== null && antes.status === "PENDENTE_APURACAO"
          ? { status: "ATIVO" as const }
          : {}),
      },
    });
    await registrar(
      usuario.id,
      id,
      { valorPeriodo: paraTexto(antes.valorPeriodo) },
      { valorPeriodo },
    );
  });

  atualizarListas(id);

  // O delta é a informação que impede a alteração silenciosa: "mudou" não diz
  // nada, "de R$ 1.240,00 para R$ 1.490,00 · +20%" diz se foi o que se queria.
  const de = antes.valorPeriodo ? Number(antes.valorPeriodo) : null;
  const para = valorPeriodo !== null ? Number(valorPeriodo) : null;
  const variacao =
    de !== null && para !== null && de > 0
      ? ` · ${para >= de ? "+" : ""}${(((para - de) / de) * 100).toFixed(0)}%`
      : "";

  return sucesso(`Valor de ${permissao.item.descricao} atualizado.`, {
    destaqueId: id,
    detalhe: `de ${formatarBRL(antes.valorPeriodo)} para ${formatarBRL(valorPeriodo)}${variacao}`,
    desfazer: {
      acao: "reverterCampo",
      id,
      antes: { valorPeriodo: paraTexto(antes.valorPeriodo) },
    },
  });
}

/**
 * Exclusão reversível.
 *
 * Item com série mensal lançada nunca é excluído nem aqui nem em lugar nenhum:
 * apagá-lo levaria junto o histórico contábil. Para esse caso o caminho é
 * encerrar, que é uma ação com outro nome porque faz outra coisa.
 */
export async function excluirItem(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);
  if (permissao.item.excluidoEm) return falha("Este custo já está na lixeira.");

  const lancamentos = await prisma.lancamentoCusto.count({ where: { itemCustoId: id } });
  if (lancamentos > 0) {
    return falha(
      `${permissao.item.descricao} tem ${lancamentos} ${lancamentos === 1 ? "lançamento" : "lançamentos"} de competência. Excluir apagaria o histórico contábil — encerre o custo em vez disso.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({
      where: { id },
      data: { excluidoEm: new Date(), excluidoPorId: usuario.id },
    });
    await registrar(usuario.id, id, { excluidoEm: null }, { excluidoEm: "agora" });
  });

  atualizarListas(id);
  return sucesso(`${permissao.item.descricao} foi excluído.`, {
    desfazer: { acao: "restaurarCusto", id },
  });
}

export async function restaurarItem(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");
  if (!podeLancar(usuario.papel)) return falha("Seu perfil permite consultar, não alterar.");

  const item = await prisma.itemCusto.findUnique({
    where: { id },
    select: {
      descricao: true,
      excluidoEm: true,
      rateios: { where: { vigenciaFim: null }, select: { setorId: true, percentual: true } },
    },
  });
  if (!item) return falha("Este custo não existe mais.");
  if (!item.excluidoEm) return sucesso(`${item.descricao} já está na lista.`, { destaqueId: id });

  // O item excluído está fora do escopo das consultas normais, então a
  // verificação de setor é refeita aqui em vez de reaproveitar o helper.
  if (!vePorInteiro(usuario.papel)) {
    const meu =
      item.rateios.length === 1 &&
      item.rateios[0].setorId === usuario.setorId &&
      Number(item.rateios[0].percentual) === 100;
    if (!meu) return falha("Este custo não é da sua área.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({
      where: { id },
      data: { excluidoEm: null, excluidoPorId: null },
    });
    await registrar(usuario.id, id, { excluidoEm: "excluído" }, { excluidoEm: null });
  });

  atualizarListas(id);
  return sucesso(`${item.descricao} voltou para a lista.`, { destaqueId: id });
}

/** Desfaz uma alteração de campo único, restaurando exatamente o valor anterior. */
export async function reverterCampo(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  const bruto = textoOpcional(dados, "antes");
  if (!id || !bruto) return falha("Não há o que desfazer.");

  let antes: Record<string, string | null>;
  try {
    const lido: unknown = JSON.parse(bruto);
    if (typeof lido !== "object" || lido === null || Array.isArray(lido)) throw new Error();
    antes = lido as Record<string, string | null>;
  } catch {
    return falha("Não consegui ler o estado anterior.");
  }

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const atual = await prisma.itemCusto.findUnique({
    where: { id },
    select: {
      periodicidade: true,
      status: true,
      dataFim: true,
      valorPeriodo: true,
      moeda: true,
      cambio: true,
      semPrazoDeterminado: true,
    },
  });
  if (!atual) return falha("Este custo não existe mais.");

  const data: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(antes)) {
    if (!(CAMPOS_REVERSIVEIS as readonly string[]).includes(campo)) continue;
    switch (campo as CampoReversivel) {
      case "status":
        if (valor && (STATUS as readonly string[]).includes(valor)) data.status = valor;
        break;
      case "dataFim":
        data.dataFim = valor ? new Date(`${valor}T00:00:00Z`) : null;
        break;
      case "semPrazoDeterminado":
        data.semPrazoDeterminado = valor === "true";
        break;
      case "valorPeriodo": {
        data.valorPeriodo = valor;
        // O valor mensal é sempre derivado, nunca restaurado de um payload:
        // guardá-lo no desfazer permitiria voltar a um par valor/mensal que
        // não fecha entre si.
        const valores = derivados(valor, atual.periodicidade, atual.moeda, atual.cambio);
        data.valorMensalNormalizado = valores.valorMensalNormalizado;
        data.valorEmReais = valores.valorEmReais;
        break;
      }
    }
  }
  if (Object.keys(data).length === 0) return falha("Não há o que desfazer.");

  // O histórico do desfazer registra os valores REAIS de antes e de depois.
  // Gravar apenas "desfeito: true" fazia a linha do histórico aparecer como
  // "Situação: — → Ativo", como se o campo não tivesse valor anterior — e o
  // histórico é justamente o lugar onde não se pode mentir sobre o passado.
  const estadoAnterior: Record<string, unknown> = {};
  for (const campo of Object.keys(data)) {
    if (campo in atual) estadoAnterior[campo] = paraTexto(atual[campo as keyof typeof atual]);
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({ where: { id }, data });
    await registrar(usuario.id, id, estadoAnterior, data as Record<string, unknown>);
  });

  atualizarListas(id);
  return sucesso("Alteração desfeita.", { destaqueId: id });
}

/**
 * Duplicar: quem cadastra trinta custos cadastra em blocos parecidos — doze
 * licenças do mesmo fornecedor mudam só a descrição. A cópia nasce em análise,
 * porque um custo criado por engano ativo já entra somando no total da área.
 */
export async function duplicarItem(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const origem = await prisma.itemCusto.findUnique({
    where: { id },
    select: {
      descricao: true,
      natureza: true,
      fornecedorId: true,
      categoriaId: true,
      contratoId: true,
      modeloCobranca: true,
      comportamento: true,
      quantidade: true,
      unidade: true,
      valorUnitario: true,
      moeda: true,
      cambio: true,
      cambioEm: true,
      periodicidade: true,
      valorPeriodo: true,
      valorMensalNormalizado: true,
      dataInicio: true,
      dataFim: true,
      semPrazoDeterminado: true,
      observacoes: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { setorId: true, percentual: true, metodo: true, centroCustoId: true },
      },
    },
  });
  if (!origem) return falha("Este custo não existe mais.");

  const { rateios, ...campos } = origem;

  const copia = await prisma.$transaction(async (tx) => {
    const item = await tx.itemCusto.create({
      data: {
        ...campos,
        descricao: `${campos.descricao} (cópia)`.slice(0, 300),
        status: "EM_ANALISE",
        criadoPorId: usuario.id,
      },
      select: { id: true, descricao: true },
    });

    // A cópia herda o rateio da origem: um custo sem rateio é invisível para
    // todo mundo, inclusive para quem acabou de criá-lo.
    const hoje = new Date();
    for (const r of rateios) {
      await tx.rateio.create({
        data: {
          itemCustoId: item.id,
          setorId: r.setorId,
          metodo: r.metodo,
          percentual: r.percentual,
          centroCustoId: r.centroCustoId,
          vigenciaInicio: hoje,
        },
      });
    }

    await tx.auditoria.create({
      data: {
        tabela: "item_custo",
        registroId: item.id,
        acao: "CRIACAO",
        usuarioId: usuario.id,
        diff: { depois: { copiadoDe: id } },
      },
    });
    return item;
  });

  atualizarListas(copia.id);
  return sucesso(`Cópia criada em análise: ${copia.descricao}.`, {
    destaqueId: copia.id,
    irPara: `/custos/${copia.id}`,
  });
}

export async function alterarCategoria(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Custo não informado.");

  const categoriaId = textoOpcional(dados, "categoriaId");
  const permissao = await itemQuePosseMexer(usuario, id);
  if (!permissao.ok) return falha(permissao.erro);

  const antes = await prisma.itemCusto.findUnique({
    where: { id },
    select: { categoriaId: true },
  });
  if (!antes) return falha("Este custo não existe mais.");

  if (categoriaId) {
    const existe = await prisma.categoria.count({ where: { id: categoriaId } });
    if (existe === 0) return falha("Categoria inválida.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.update({ where: { id }, data: { categoriaId } });
    await registrar(usuario.id, id, { categoriaId: antes.categoriaId }, { categoriaId });
  });

  atualizarListas(id);
  return sucesso(`Categoria de ${permissao.item.descricao} definida.`, { destaqueId: id });
}
