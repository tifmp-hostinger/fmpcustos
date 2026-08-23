"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { valorMensalNormalizado } from "@/lib/dinheiro";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import {
  dataOpcional,
  dinheiro,
  falha,
  inteiroOpcional,
  opcaoValida,
  texto,
  textoOpcional,
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

/** Reaproveita o fornecedor pelo nome, ou cria — sem obrigar cadastro prévio. */
async function acharOuCriarFornecedor(nome: string): Promise<string> {
  const existente = await prisma.fornecedor.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (existente) return existente.id;

  const criado = await prisma.fornecedor.create({
    data: { nome },
    select: { id: true },
  });
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
  status: StatusItem;
  valorPeriodo: string | null;
  quantidade: number | null;
  valorUnitario: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  observacoes: string | null;
  setorId: string | null;
};

const NATUREZAS = ["RECORRENTE", "PONTUAL", "CAPEX", "PESSOAL"] as const;
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
  const periodicidade = opcaoValida<Periodicidade>(dados, "periodicidade", PERIODICIDADES, "MENSAL");
  const comportamento = opcaoValida<ComportamentoCusto>(dados, "comportamento", COMPORTAMENTOS, "FIXO");
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

function validar(campos: Campos): string | null {
  if (!campos.descricao) return "Descreva o custo.";
  if (!campos.fornecedor) return "Informe o fornecedor.";
  if (campos.valorPeriodo === null && campos.status !== "PENDENTE_APURACAO") {
    return "Informe o valor, ou marque o status como “Valor a apurar”.";
  }
  if (campos.dataInicio && campos.dataFim && campos.dataFim < campos.dataInicio) {
    return "A data de término é anterior à de início.";
  }
  return null;
}

export async function salvarCusto(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) return falha("Seu perfil não permite lançar custos.");

  const id = textoOpcional(dados, "id");
  const campos = lerCampos(dados);
  if (!campos) return falha("Um dos campos de seleção veio com valor inválido.");

  const problema = validar(campos);
  if (problema) return falha(problema);

  const setorId = await setorDoLancamento(usuario.papel, usuario.setorId, campos.setorId);
  if (!setorId) {
    return falha("Seu usuário não está vinculado a um setor. Peça ao administrador.");
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
      );
    }
  }

  const fornecedorId = await acharOuCriarFornecedor(campos.fornecedor);
  const mensal = valorMensalNormalizado(campos.valorPeriodo, campos.periodicidade);

  const comuns = {
    descricao: campos.descricao,
    fornecedorId,
    categoriaId: campos.categoriaId,
    natureza: campos.natureza,
    periodicidade: campos.periodicidade,
    comportamento: campos.comportamento,
    moeda: campos.moeda,
    status: campos.status,
    valorPeriodo: campos.valorPeriodo,
    quantidade: campos.quantidade,
    valorUnitario: campos.valorUnitario,
    valorMensalNormalizado: mensal ? mensal.toFixed(2) : null,
    dataInicio: campos.dataInicio,
    dataFim: campos.dataFim,
    observacoes: campos.observacoes,
  };

  const anterior = id ? await prisma.itemCusto.findUnique({ where: { id } }) : null;
  if (id && !anterior) return falha("Este custo não existe mais.");

  // Item, rateio e auditoria numa transação só: falhar no meio deixaria um
  // item sem rateio — invisível para todo mundo, inclusive para quem o criou.
  await prisma.$transaction(async (tx) => {
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
  });

  revalidatePath("/custos");
  revalidatePath("/");
  redirect("/custos");
}

export async function excluirCusto(dados: FormData): Promise<void> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!podeLancar(usuario.papel) || !id) redirect("/custos");

  if (!vePorInteiro(usuario.papel)) {
    const permitido = await prisma.itemCusto.count({
      where: {
        id,
        rateios: {
          some: { setorId: usuario.setorId ?? "", vigenciaFim: null, percentual: 100 },
        },
      },
    });
    if (permitido === 0) redirect("/custos");
  }

  // Excluir apagaria em cascata a série mensal inteira (lançamentos e rateios)
  // — histórico contábil não se destrói com um clique. Com histórico, o caminho
  // é cancelar; excluir fica reservado a cadastros errados ainda sem série.
  const comHistorico = await prisma.lancamentoCusto.count({ where: { itemCustoId: id } });
  if (comHistorico > 0) {
    redirect(`/custos/${id}?erro=tem-historico`);
  }

  const anterior = await prisma.itemCusto.findUnique({ where: { id } });
  if (!anterior) redirect("/custos");

  await prisma.$transaction(async (tx) => {
    await tx.itemCusto.delete({ where: { id } });
    await tx.auditoria.create({
      data: {
        tabela: "item_custo",
        registroId: id,
        acao: "EXCLUSAO",
        usuarioId: usuario.id,
        diff: { antes: JSON.parse(JSON.stringify(anterior)), depois: null },
      },
    });
  });

  revalidatePath("/custos");
  revalidatePath("/");
  redirect("/custos");
}
