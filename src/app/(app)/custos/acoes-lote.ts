"use server";

import { revalidatePath } from "next/cache";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { formatarBRL } from "@/lib/dinheiro";
import {
  exigirSessao,
  podeLancar,
  setoresVisiveis,
  vePorInteiro,
  type UsuarioSessao,
} from "@/lib/sessao";
import { ROTULOS_PERIODICIDADE, ROTULOS_STATUS } from "@/lib/opcoes";
import { falha, opcaoValida, sucesso, texto, textoOpcional, type Resultado } from "@/lib/acoes";
import type { StatusItem } from "@/generated/prisma/enums";

/**
 * AÇÕES EM LOTE
 *
 * O fechamento mensal é item a item: doze cliques para marcar doze contratos
 * como cancelados, cada um com sua ida e volta. Em lote é um gesto.
 *
 * O que muda de verdade quando a ação vale para muitos registros:
 *
 *  1. **Nada é parcialmente aplicado em silêncio.** Se cinco dos doze não
 *     podem ser alterados, os outros sete mudam e a resposta diz quantos
 *     ficaram de fora e por quê. Recusar os doze por causa de cinco faz a
 *     pessoa recomeçar; aplicar os sete calada faz ela acreditar que foram
 *     doze — e o erro só aparece no relatório.
 *  2. **O desfazer é por item.** Cada custo volta ao SEU estado anterior, não
 *     a um valor comum: doze itens que estavam em cinco situações diferentes
 *     não podem ser "revertidos" para uma só.
 *  3. **O teto é o mesmo da tela.** Duzentos por vez, porque acima disso a
 *     confirmação deixa de ser conferível e vira clique no escuro.
 */

const MAXIMO_LOTE = 200;

const STATUS = [
  "ATIVO",
  "EM_ANALISE",
  "CANCELAMENTO_SOLICITADO",
  "CANCELADO",
  "SUBSTITUIDO",
  "PENDENTE_APURACAO",
] as const;

/** Lê a lista de ids, sem repetições e com teto. */
function lerIds(dados: FormData): string[] | null {
  const bruto = texto(dados, "ids");
  if (!bruto) return null;
  const ids = [
    ...new Set(
      bruto
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  if (ids.length === 0 || ids.length > MAXIMO_LOTE) return null;
  return ids;
}

type Permitido = {
  id: string;
  descricao: string;
  status: StatusItem;
  dataFim: Date | null;
  semPrazoDeterminado: boolean;
};

/**
 * Separa o que a pessoa pode alterar do que não pode, numa consulta só.
 *
 * A regra é a mesma de sempre — quem não vê por inteiro só mexe no que é
 * inteiramente do próprio setor — mas aqui ela é aplicada em bloco, para não
 * disparar uma consulta por item num lote de duzentos.
 */
async function separarPermitidos(
  usuario: UsuarioSessao,
  ids: string[],
): Promise<{ permitidos: Permitido[]; negados: number }> {
  const itens = await prisma.itemCusto.findMany({
    where: { id: { in: ids }, excluidoEm: null },
    select: {
      id: true,
      descricao: true,
      status: true,
      dataFim: true,
      semPrazoDeterminado: true,
      rateios: { where: { vigenciaFim: null }, select: { setorId: true, percentual: true } },
    },
  });

  if (vePorInteiro(usuario.papel)) {
    return { permitidos: itens, negados: ids.length - itens.length };
  }

  const permitidos = itens.filter(
    (i) =>
      i.rateios.length === 1 &&
      i.rateios[0].setorId === usuario.setorId &&
      Number(i.rateios[0].percentual) === 100,
  );
  return { permitidos, negados: ids.length - permitidos.length };
}

/** A frase que declara o que ficou de fora. Silêncio aqui é o pior desfecho. */
function notaDeRecusa(negados: number): string | null {
  if (negados === 0) return null;
  return negados === 1
    ? "1 ficou de fora: compartilhado entre setores, excluído ou fora do seu escopo"
    : `${negados} ficaram de fora: compartilhados entre setores, excluídos ou fora do seu escopo`;
}

async function registrarLote(
  usuarioId: string,
  ids: string[],
  acao: string,
  depois: Record<string, unknown>,
) {
  await prisma.auditoria.createMany({
    data: ids.map((id) => ({
      tabela: "item_custo",
      registroId: id,
      acao: "ALTERACAO" as const,
      usuarioId,
      diff: { depois: { ...depois, emLote: acao } } as never,
    })),
  });
}

// ---------------------------------------------------------------------------

export async function alterarSituacaoEmLote(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) return falha("Seu perfil permite consultar, não alterar.");

  const ids = lerIds(dados);
  const status = opcaoValida<StatusItem>(dados, "status", STATUS);
  if (!ids) return falha(`Selecione entre 1 e ${MAXIMO_LOTE} custos.`);
  if (!status) return falha("Situação inválida.");

  const { permitidos, negados } = await separarPermitidos(usuario, ids);
  const mudam = permitidos.filter((i) => i.status !== status);
  if (mudam.length === 0) {
    return falha(
      negados > 0
        ? "Nenhum dos custos selecionados pode ser alterado por você."
        : `Todos os selecionados já estão em “${ROTULOS_STATUS[status]}”.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.updateMany({
      where: { id: { in: mudam.map((i) => i.id) } },
      data: { status },
    });
  });
  await registrarLote(
    usuario.id,
    mudam.map((i) => i.id),
    "situacao",
    { status },
  );

  revalidatePath("/custos");
  revalidatePath("/");

  const naoMudaram = permitidos.length - mudam.length;
  const notas = [notaDeRecusa(negados)];
  if (naoMudaram > 0)
    notas.push(`${naoMudaram} já estava${naoMudaram > 1 ? "m" : ""} nessa situação`);

  return sucesso(
    `${mudam.length} ${mudam.length === 1 ? "custo" : "custos"} em “${ROTULOS_STATUS[status]}”.`,
    {
      detalhe: notas.filter(Boolean).join(" · ") || undefined,
      duracao: 10_000,
      desfazer: {
        acao: "reverterLote",
        itens: mudam.map((i) => ({ id: i.id, antes: { status: i.status } })),
      },
    },
  );
}

/**
 * Transfere a responsabilidade de vários custos para outro setor.
 *
 * Só quem enxerga por inteiro faz isso: mover um custo para fora da própria
 * área seria tirá-lo do próprio total sem que ninguém do outro lado soubesse.
 * Só o rateio simples (um setor, 100%) é movido — um custo já dividido entre
 * áreas tem critério por trás, e um lote não é lugar de desmontar critério.
 */
export async function alterarSetorEmLote(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!vePorInteiro(usuario.papel)) {
    return falha("Transferir custos entre setores é da Controladoria ou do administrador.");
  }

  const ids = lerIds(dados);
  const setorId = textoOpcional(dados, "setorId");
  if (!ids) return falha(`Selecione entre 1 e ${MAXIMO_LOTE} custos.`);
  if (!setorId) return falha("Escolha o setor de destino.");

  const setor = await prisma.setor.findFirst({
    where: { id: setorId, ativo: true },
    select: { nome: true },
  });
  if (!setor) return falha("Setor inválido.");

  const rateios = await prisma.rateio.findMany({
    where: { itemCustoId: { in: ids }, vigenciaFim: null },
    select: { id: true, itemCustoId: true, setorId: true, percentual: true },
  });

  const porItem = new Map<string, typeof rateios>();
  for (const r of rateios) {
    porItem.set(r.itemCustoId!, [...(porItem.get(r.itemCustoId!) ?? []), r]);
  }

  const moviveis: Array<{ rateioId: string; itemId: string; setorAnterior: string }> = [];
  let compartilhados = 0;
  for (const [itemId, lista] of porItem) {
    if (lista.length !== 1 || Number(lista[0].percentual) !== 100) {
      compartilhados++;
      continue;
    }
    if (lista[0].setorId === setorId) continue;
    moviveis.push({ rateioId: lista[0].id, itemId, setorAnterior: lista[0].setorId });
  }

  if (moviveis.length === 0) {
    return falha(
      compartilhados > 0
        ? "Os custos selecionados são compartilhados entre setores — altere o rateio de cada um."
        : "Os custos selecionados já são deste setor.",
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const m of moviveis) {
      await tx.rateio.update({ where: { id: m.rateioId }, data: { setorId } });
    }
  });
  await registrarLote(
    usuario.id,
    moviveis.map((m) => m.itemId),
    "setor",
    { setorId },
  );

  revalidatePath("/custos");
  revalidatePath("/");

  const notas: Array<string | null> = [];
  if (compartilhados > 0) {
    notas.push(
      `${compartilhados} ${compartilhados === 1 ? "é compartilhado" : "são compartilhados"} entre setores e não foi movido`,
    );
  }
  notas.push(notaDeRecusa(ids.length - porItem.size));

  return sucesso(
    `${moviveis.length} ${moviveis.length === 1 ? "custo passou" : "custos passaram"} para ${setor.nome}.`,
    { detalhe: notas.filter(Boolean).join(" · ") || undefined, duracao: 10_000 },
  );
}

/**
 * Marca vários custos como sem prazo determinado.
 *
 * É a saída honesta da fila de pendências: contrato sem prazo é diferente de
 * contrato cuja data ninguém preencheu, e sem esta marcação sair da fila
 * exigiria inventar uma data.
 */
export async function marcarSemPrazoEmLote(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) return falha("Seu perfil permite consultar, não alterar.");

  const ids = lerIds(dados);
  if (!ids) return falha(`Selecione entre 1 e ${MAXIMO_LOTE} custos.`);

  const { permitidos, negados } = await separarPermitidos(usuario, ids);
  // Item COM data não é tocado: marcar "sem prazo" apagaria a data que alguém
  // preencheu, e num lote isso desapareceria no meio da contagem.
  const alvos = permitidos.filter((i) => i.dataFim === null && !i.semPrazoDeterminado);
  if (alvos.length === 0) {
    return falha("Nenhum dos selecionados está sem data — nada a marcar.");
  }

  await prisma.itemCusto.updateMany({
    where: { id: { in: alvos.map((i) => i.id) } },
    data: { semPrazoDeterminado: true },
  });
  await registrarLote(
    usuario.id,
    alvos.map((i) => i.id),
    "semPrazo",
    { semPrazoDeterminado: true },
  );

  revalidatePath("/custos");
  revalidatePath("/");

  const comData = permitidos.length - alvos.length;
  const notas = [notaDeRecusa(negados)];
  if (comData > 0) notas.push(`${comData} já tinha${comData > 1 ? "m" : ""} data e não foi tocado`);

  return sucesso(
    `${alvos.length} ${alvos.length === 1 ? "custo marcado" : "custos marcados"} como sem prazo determinado.`,
    {
      detalhe: notas.filter(Boolean).join(" · ") || undefined,
      duracao: 10_000,
      desfazer: {
        acao: "reverterLote",
        itens: alvos.map((i) => ({ id: i.id, antes: { semPrazoDeterminado: "false" } })),
      },
    },
  );
}

/** Desfaz uma alteração em lote, devolvendo cada item ao SEU valor anterior. */
export async function reverterLote(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) return falha("Seu perfil permite consultar, não alterar.");

  let itens: Array<{ id: string; antes: Record<string, string | null> }>;
  try {
    const lido: unknown = JSON.parse(texto(dados, "itens") || "[]");
    if (!Array.isArray(lido) || lido.length === 0 || lido.length > MAXIMO_LOTE) throw new Error();
    itens = lido as typeof itens;
  } catch {
    return falha("Não consegui ler o que precisa ser desfeito.");
  }

  const { permitidos } = await separarPermitidos(
    usuario,
    itens.map((i) => i.id),
  );
  const podem = new Set(permitidos.map((i) => i.id));

  let revertidos = 0;
  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      if (!podem.has(item.id)) continue;
      const data: Record<string, unknown> = {};
      if (
        typeof item.antes.status === "string" &&
        (STATUS as readonly string[]).includes(item.antes.status)
      ) {
        data.status = item.antes.status;
      }
      if (item.antes.semPrazoDeterminado !== undefined) {
        data.semPrazoDeterminado = item.antes.semPrazoDeterminado === "true";
      }
      if (Object.keys(data).length === 0) continue;
      await tx.itemCusto.update({ where: { id: item.id }, data });
      revertidos++;
    }
  });

  if (revertidos === 0) return falha("Nada foi desfeito.");
  await registrarLote(
    usuario.id,
    itens.filter((i) => podem.has(i.id)).map((i) => i.id),
    "desfazer",
    { desfeito: true },
  );

  revalidatePath("/custos");
  revalidatePath("/");
  return sucesso(
    `${revertidos} ${revertidos === 1 ? "alteração desfeita" : "alterações desfeitas"}.`,
  );
}

/**
 * Soma dos selecionados, para a barra de seleção e para a confirmação.
 *
 * Vem do servidor, não do que a tela tem em memória: a confirmação de uma ação
 * sobre catorze contratos precisa dizer um número que veio do banco, e não a
 * soma de linhas que podem estar defasadas desde o último carregamento.
 */
export async function somarSelecao(
  ids: string[],
): Promise<{ quantidade: number; mensal: string; descricoes: string[] }> {
  const usuario = await exigirSessao();
  if (ids.length === 0 || ids.length > MAXIMO_LOTE) {
    return { quantidade: 0, mensal: "0", descricoes: [] };
  }

  const { permitidos } = await separarPermitidos(usuario, ids);
  const itens = await prisma.itemCusto.findMany({
    where: { id: { in: permitidos.map((i) => i.id) } },
    select: { descricao: true, valorMensalNormalizado: true, status: true },
    orderBy: { valorMensalNormalizado: { sort: "desc", nulls: "last" } },
  });

  const mensal = itens.reduce(
    (soma, i) =>
      i.valorMensalNormalizado && (i.status === "ATIVO" || i.status === "EM_ANALISE")
        ? soma.plus(i.valorMensalNormalizado.toString())
        : soma,
    new Decimal(0),
  );

  return {
    quantidade: itens.length,
    mensal: formatarBRL(mensal),
    descricoes: itens.slice(0, 5).map((i) => i.descricao),
  };
}

/**
 * Devolve os custos selecionados prontos para virar planilha.
 *
 * A exportação vai buscar os dados de novo em vez de reaproveitar o que a
 * barra tinha em mãos: a barra guarda só as cinco primeiras descrições para
 * caber na confirmação, e exportar cinco linhas de uma seleção de catorze —
 * sem dizer nada — é o tipo de corte silencioso que faz alguém conferir a
 * planilha errada por um mês.
 *
 * As colunas são as mesmas que o importador de colagem lê, na mesma ordem:
 * o arquivo exportado volta para dentro do sistema sem tradução.
 */
export async function exportarSelecao(ids: string[]): Promise<string[][]> {
  const usuario = await exigirSessao();
  if (ids.length === 0 || ids.length > MAXIMO_LOTE) return [];

  const setores = setoresVisiveis(usuario);
  const itens = await prisma.itemCusto.findMany({
    where: {
      id: { in: ids },
      ...(setores === null
        ? {}
        : { rateios: { some: { setorId: { in: setores }, vigenciaFim: null } } }),
    },
    select: {
      descricao: true,
      valorPeriodo: true,
      moeda: true,
      cambio: true,
      valorMensalNormalizado: true,
      periodicidade: true,
      dataFim: true,
      quantidade: true,
      status: true,
      observacoes: true,
      fornecedor: { select: { nome: true } },
      categoria: { select: { nome: true } },
      rateios: {
        where: { vigenciaFim: null },
        select: { percentual: true, setor: { select: { nome: true } } },
        orderBy: { percentual: "desc" },
      },
    },
    orderBy: { valorMensalNormalizado: { sort: "desc", nulls: "last" } },
  });

  const dinheiro = (v: unknown) =>
    v === null || v === undefined ? "" : new Decimal(String(v)).toFixed(2).replace(".", ",");

  return [
    [
      "Descrição",
      "Fornecedor",
      "Valor",
      // A moeda vai junto do valor porque sem ela a planilha exportada repete o
      // defeito que este sistema corrigiu: uma coluna de números em três moedas
      // diferentes, somável por qualquer um que abra o arquivo.
      "Moeda",
      "Cotação",
      "Valor mensal em real",
      "Periodicidade",
      "Categoria",
      "Renova em",
      "Quantidade",
      "Situação",
      "Setores",
      "Observações",
    ],
    ...itens.map((i) => [
      i.descricao,
      i.fornecedor?.nome ?? "",
      dinheiro(i.valorPeriodo),
      i.moeda,
      i.cambio ? new Decimal(String(i.cambio)).toFixed(6).replace(".", ",") : "",
      dinheiro(i.valorMensalNormalizado),
      ROTULOS_PERIODICIDADE[i.periodicidade] ?? i.periodicidade,
      i.categoria?.nome ?? "",
      i.dataFim ? i.dataFim.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "",
      i.quantidade ? String(Number(i.quantidade)) : "",
      ROTULOS_STATUS[i.status] ?? i.status,
      i.rateios
        .map((r) => `${r.setor.nome} ${Number(r.percentual).toFixed(2).replace(".", ",")}%`)
        .join(" | "),
      i.observacoes ?? "",
    ]),
  ];
}
