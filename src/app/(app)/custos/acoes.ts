"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { derivados, precisaDeCambio } from "@/lib/dinheiro";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { NATUREZAS as OPCOES_NATUREZA } from "@/lib/opcoes";
import { normalizar } from "@/lib/fornecedores";
import {
  cambio,
  dataOpcional,
  dinheiro,
  falha,
  inteiroOpcional,
  opcaoValida,
  sucesso,
  texto,
  textoOpcional,
  valoresDigitados,
  type Resultado,
} from "@/lib/acoes";
import type {
  ComportamentoCusto,
  Moeda,
  Natureza,
  Periodicidade,
  StatusItem,
} from "@/generated/prisma/enums";

/** Setor que o usuário pode usar no lançamento. Gestor só lança para o próprio. */
async function setorDoLancamento(
  papel: Parameters<typeof vePorInteiro>[0],
  setorDoUsuario: string | null,
  setorEscolhido: string | null,
): Promise<string | null> {
  if (vePorInteiro(papel)) return setorEscolhido ?? setorDoUsuario;
  return setorDoUsuario;
}

/**
 * Reaproveita o fornecedor pelo nome, ou cria — sem obrigar cadastro prévio.
 *
 * Duas passadas antes de criar: nome igual ignorando caixa, e nome igual
 * depois de normalizado (sem acento, sem pontuação, sem LTDA/S.A.). A segunda
 * é a rede embaixo do aviso que o formulário dá: importação, requisição
 * montada à mão e um espaço sobrando no fim não passam por tela nenhuma, e
 * cada duplicata silenciosa corrói o gráfico de concentração por fornecedor.
 *
 * O que não se faz aqui é fundir nomes só parecidos. "Microsoft" e "Microsoft
 * Brasil" podem ser dois contratos distintos; juntá-los sozinho seria estragar
 * na direção oposta. A semelhança vira aviso na tela, nunca decisão do servidor.
 */
async function acharOuCriarFornecedor(nome: string): Promise<string> {
  const exato = await prisma.fornecedor.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (exato) return exato.id;

  const alvo = normalizar(nome);
  if (alvo) {
    const candidatos = await prisma.fornecedor.findMany({ select: { id: true, nome: true } });
    const mesmo = candidatos.find((f) => normalizar(f.nome) === alvo);
    if (mesmo) return mesmo.id;
  }

  const criado = await prisma.fornecedor.create({ data: { nome }, select: { id: true } });
  return criado.id;
}

type Campos = {
  descricao: string;
  fornecedor: string;
  categoriaId: string | null;
  natureza: Natureza;
  periodicidade: Periodicidade;
  comportamento: ComportamentoCusto;
  moeda: Moeda;
  cambio: string | null;
  status: StatusItem;
  valorPeriodo: string | null;
  quantidade: number | null;
  valorUnitario: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  observacoes: string | null;
  setorId: string | null;
};

/**
 * A lista que valida é derivada da lista que a tela exibe. Enquanto eram duas
 * constantes independentes, elas divergiram — e a divergência reclassificava
 * itens CAPEX como RECORRENTE sem ninguém perceber. Divergir agora é impossível.
 */
const NATUREZAS = OPCOES_NATUREZA.map((n) => n.valor) as unknown as readonly Natureza[];
const PERIODICIDADES = [
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "UNICO",
  "SOB_DEMANDA",
] as const;
const COMPORTAMENTOS = ["FIXO", "VARIAVEL"] as const;
const MOEDAS = ["BRL", "USD", "EUR"] as const;
const STATUS = [
  "ATIVO",
  "EM_ANALISE",
  "CANCELAMENTO_SOLICITADO",
  "CANCELADO",
  "SUBSTITUIDO",
  "PENDENTE_APURACAO",
] as const;

/**
 * Valores de enum são validados contra a lista, nunca cast direto: um FormData
 * forjado com valor fora do enum estouraria dentro do Prisma como erro 500 —
 * e uma periodicidade inválida chegaria antes ao cálculo do valor mensal.
 */
function lerCampos(dados: FormData): Campos | null {
  const natureza = opcaoValida<Natureza>(dados, "natureza", NATUREZAS, "RECORRENTE");
  const periodicidade = opcaoValida<Periodicidade>(
    dados,
    "periodicidade",
    PERIODICIDADES,
    "MENSAL",
  );
  const comportamento = opcaoValida<ComportamentoCusto>(
    dados,
    "comportamento",
    COMPORTAMENTOS,
    "FIXO",
  );
  const moeda = opcaoValida<Moeda>(dados, "moeda", MOEDAS, "BRL");
  const status = opcaoValida<StatusItem>(dados, "status", STATUS, "ATIVO");
  if (!natureza || !periodicidade || !comportamento || !moeda || !status) return null;

  return {
    descricao: texto(dados, "descricao").slice(0, 300),
    fornecedor: texto(dados, "fornecedor").slice(0, 150),
    categoriaId: textoOpcional(dados, "categoriaId"),
    natureza,
    periodicidade,
    comportamento,
    moeda,
    // Câmbio só existe quando a moeda é estrangeira. Guardar uma taxa junto de
    // um valor em real deixaria o item com duas verdades sobre o mesmo número.
    cambio: moeda === "BRL" ? null : cambio(dados, "cambio"),
    status,
    valorPeriodo: dinheiro(dados, "valorPeriodo"),
    quantidade: inteiroOpcional(dados, "quantidade"),
    valorUnitario: dinheiro(dados, "valorUnitario"),
    dataInicio: dataOpcional(dados, "dataInicio"),
    dataFim: dataOpcional(dados, "dataFim"),
    observacoes: textoOpcional(dados, "observacoes")?.slice(0, 2000) ?? null,
    setorId: textoOpcional(dados, "setorId"),
  };
}

/**
 * Além da frase, devolve QUAL campo recusou: o formulário foca nele em vez de
 * deixar a pessoa caçar o erro entre catorze campos.
 */
function validar(
  campos: Campos,
  valorDigitado: string,
  cambioDigitado: string,
): { erro: string; campo: string } | null {
  if (!campos.descricao) return { erro: "Descreva o custo.", campo: "descricao" };
  if (!campos.fornecedor) return { erro: "Informe o fornecedor.", campo: "fornecedor" };

  // Recusar aqui é o que impede US$ 500 de entrar no total como R$ 500. O item
  // seria salvo do mesmo jeito — só que fora de toda soma, e ninguém cadastra
  // um custo para que ele não seja contado.
  if (precisaDeCambio(campos.moeda, campos.cambio)) {
    return {
      erro: cambioDigitado
        ? `Não consegui ler «${cambioDigitado}» como cotação. Escreva no formato 5,4321.`
        : `Informe a cotação do ${campos.moeda === "USD" ? "dólar" : "euro"} usada neste custo — sem ela o valor não entra nos totais em real.`,
      campo: "cambio",
    };
  }

  if (campos.valorPeriodo === null && campos.status !== "PENDENTE_APURACAO") {
    // Campo em branco e campo ilegível são erros diferentes, e dizer "informe o
    // valor" para quem visivelmente digitou algo faz a pessoa duvidar da tela.
    return {
      erro: valorDigitado
        ? `Não consegui ler «${valorDigitado}» como valor. Escreva no formato 1.234,56.`
        : "Informe o valor, ou marque a situação como “Valor a apurar”.",
      campo: "valorPeriodo",
    };
  }
  if (campos.dataInicio && campos.dataFim && campos.dataFim < campos.dataInicio) {
    return { erro: "A data de término é anterior à de início.", campo: "dataFim" };
  }
  return null;
}

/**
 * A data da cotação vem escondida do formulário, preenchida pela própria tela
 * quando ela sugere a taxa. Se a pessoa digitou a taxa à mão, a data é hoje —
 * é o que ela de fato afirmou ao digitar.
 */
function dataDaCotacao(dados: FormData): Date {
  const informada = dataOpcional(dados, "cambioEm");
  if (informada) return informada;
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  return hoje;
}

export async function salvarCusto(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  const digitado = valoresDigitados(dados);
  if (!podeLancar(usuario.papel)) return falha("Seu perfil não permite lançar custos.");

  const id = textoOpcional(dados, "id");
  const campos = lerCampos(dados);
  if (!campos) return falha("Um dos campos de seleção veio com valor inválido.", digitado);

  const problema = validar(campos, texto(dados, "valorPeriodo"), texto(dados, "cambio"));
  if (problema) return falha(problema.erro, digitado, problema.campo);

  const setorId = await setorDoLancamento(usuario.papel, usuario.setorId, campos.setorId);
  if (!setorId) {
    return falha("Seu usuário não está vinculado a um setor. Peça ao administrador.", digitado);
  }

  // Quem não vê por inteiro só mexe no que é INTEIRAMENTE do próprio setor:
  // rateio vigente (não uma alocação histórica já encerrada) e de 100% — num
  // custo compartilhado, editar o valor mexeria na fatia dos outros setores,
  // e isso é decisão de quem enxerga por inteiro.
  if (id && !vePorInteiro(usuario.papel)) {
    const permitido = await prisma.itemCusto.count({
      where: {
        id,
        rateios: { some: { setorId, vigenciaFim: null, percentual: 100 } },
      },
    });
    if (permitido === 0) {
      return falha(
        "Este custo não é (ou não é só) da sua área. Alterações em custos compartilhados são feitas pela Controladoria ou pelo administrador.",
        digitado,
      );
    }
  }

  const fornecedorId = await acharOuCriarFornecedor(campos.fornecedor);
  const valores = derivados(campos.valorPeriodo, campos.periodicidade, campos.moeda, campos.cambio);

  const comuns = {
    descricao: campos.descricao,
    fornecedorId,
    categoriaId: campos.categoriaId,
    natureza: campos.natureza,
    periodicidade: campos.periodicidade,
    comportamento: campos.comportamento,
    moeda: campos.moeda,
    cambio: campos.cambio,
    // A data da cotação é o que permite dizer "convertido a 5,4321 de 22/08"
    // em vez de mostrar um real sem procedência. Quando a taxa sai, ela sai junto.
    cambioEm: campos.cambio ? dataDaCotacao(dados) : null,
    status: campos.status,
    valorPeriodo: campos.valorPeriodo,
    quantidade: campos.quantidade,
    valorUnitario: campos.valorUnitario,
    ...valores,
    dataInicio: campos.dataInicio,
    dataFim: campos.dataFim,
    observacoes: campos.observacoes,
  };

  const anterior = id ? await prisma.itemCusto.findUnique({ where: { id } }) : null;
  if (id && !anterior) return falha("Este custo não existe mais.", digitado);

  // Item, rateio e auditoria numa transação só: falhar no meio deixaria um
  // item sem rateio — invisível para todo mundo, inclusive para quem o criou.
  const salvo = await prisma.$transaction(async (tx) => {
    const item = id
      ? await tx.itemCusto.update({ where: { id }, data: comuns })
      : await tx.itemCusto.create({ data: { ...comuns, criadoPorId: usuario.id } });

    // Rateio: 100% no setor responsável — o custo nunca fica sem dono.
    // Só a regra simples (rateio único e vigente) é gerida por esta tela; um
    // item com rateio composto (ajustado pela Controladoria) não é tocado aqui,
    // para o formulário não desmontar uma alocação feita com critério.
    const vigentes = await tx.rateio.findMany({
      where: { itemCustoId: item.id, vigenciaFim: null },
      orderBy: { criadoEm: "asc" },
    });
    if (vigentes.length === 0) {
      await tx.rateio.create({
        data: {
          itemCustoId: item.id,
          setorId,
          metodo: "PERCENTUAL",
          percentual: "100",
          vigenciaInicio: campos.dataInicio ?? new Date(),
        },
      });
    } else if (
      vigentes.length === 1 &&
      vigentes[0].setorId !== setorId &&
      vePorInteiro(usuario.papel)
    ) {
      await tx.rateio.update({ where: { id: vigentes[0].id }, data: { setorId } });
    }

    await tx.auditoria.create({
      data: {
        tabela: "item_custo",
        registroId: item.id,
        acao: id ? "ALTERACAO" : "CRIACAO",
        usuarioId: usuario.id,
        diff: {
          antes: anterior ? JSON.parse(JSON.stringify(anterior)) : null,
          depois: JSON.parse(JSON.stringify(item)),
        },
      },
    });
    return item;
  });

  revalidatePath("/custos");
  revalidatePath(`/custos/${salvo.id}`);
  revalidatePath("/");

  // Sem redirect. Redirecionar lança NEXT_REDIRECT, o `Resultado` é descartado
  // no meio do caminho e a tela de destino chega sem nenhuma notícia do que
  // acabou de acontecer — era por isso que cadastrar, editar e cancelar
  // produziam exatamente a mesma tela muda. Quem chamou decide para onde ir.
  return sucesso(
    id ? `${campos.descricao} foi atualizado.` : `${campos.descricao} foi cadastrado.`,
    { destaqueId: salvo.id },
  );
}

/**
 * Expurgo físico dos itens que passaram dos 30 dias na lixeira.
 *
 * A exclusão do dia a dia é reversível (`excluirItem`, em acoes-rapidas.ts).
 * Este é o único caminho que apaga de verdade, e ele não é uma ação de tela:
 * roda por rotina, sobre o que já esperou um mês para ser resgatado.
 */
export async function expurgarLixeira(diasDeGuarda = 30): Promise<number> {
  const usuario = await exigirSessao();
  if (!vePorInteiro(usuario.papel)) return 0;

  const corte = new Date();
  corte.setUTCDate(corte.getUTCDate() - diasDeGuarda);

  const vencidos = await prisma.itemCusto.findMany({
    where: { excluidoEm: { not: null, lt: corte } },
    select: { id: true, descricao: true },
  });

  for (const item of vencidos) {
    await prisma.$transaction(async (tx) => {
      await tx.itemCusto.delete({ where: { id: item.id } });
      await tx.auditoria.create({
        data: {
          tabela: "item_custo",
          registroId: item.id,
          acao: "EXCLUSAO",
          usuarioId: usuario.id,
          diff: { antes: { descricao: item.descricao }, depois: null },
        },
      });
    });
  }

  if (vencidos.length > 0) {
    revalidatePath("/custos");
    revalidatePath("/");
  }
  return vencidos.length;
}
