import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { arredondar } from "@/lib/dinheiro";
import type { Natureza } from "@/generated/prisma/enums";

/**
 * MÉTRICAS DE CUSTO CORRENTE
 *
 * Lêem o cadastro (item de custo + rateio) e não a série de competências.
 * Enquanto não houver fechamento mensal, este é o número honesto: o
 * *run-rate* declarado — quanto a FMP se comprometeu a pagar por mês com o
 * que está cadastrado hoje.
 *
 * Duas regras que valem para todas as funções aqui:
 *  - só entram itens ATIVO e EM_ANALISE; cancelado e substituído ficam de fora
 *    do corrente e permanecem no histórico;
 *  - `naturezas` é parâmetro obrigatório. Consolidar recorrente com pontual é
 *    sempre um ato explícito de quem chama.
 */

const STATUS_CORRENTE = ["ATIVO", "EM_ANALISE"] as const;

export type Fatia = {
  chave: string;
  rotulo: string;
  valor: Decimal;
  participacao: Decimal;
};

type Escopo = { setorIds: string[] | null };

function filtroBase(escopo: Escopo, naturezas: Natureza[]) {
  return {
    status: { in: [...STATUS_CORRENTE] },
    natureza: { in: naturezas },
    valorMensalNormalizado: { not: null },
    ...(escopo.setorIds === null
      ? {}
      : { rateios: { some: { setorId: { in: escopo.setorIds } } } }),
  };
}

function ordenarComParticipacao(
  bruto: Map<string, { rotulo: string; valor: Decimal }>,
): Fatia[] {
  const total = [...bruto.values()].reduce((s, v) => s.plus(v.valor), new Decimal(0));
  return [...bruto]
    .map(([chave, v]) => ({
      chave,
      rotulo: v.rotulo,
      valor: arredondar(v.valor),
      participacao: total.isZero() ? new Decimal(0) : arredondar(v.valor.div(total).mul(100)),
    }))
    .sort((a, b) => b.valor.comparedTo(a.valor));
}

const paraDecimal = (v: unknown): Decimal =>
  v === null || v === undefined ? new Decimal(0) : new Decimal(String(v));

/** Soma do equivalente mensal dos itens correntes. */
export async function custoMensalCorrente(
  escopo: Escopo,
  naturezas: Natureza[],
): Promise<Decimal> {
  const itens = await prisma.itemCusto.findMany({
    where: filtroBase(escopo, naturezas),
    select: { valorMensalNormalizado: true },
  });
  return arredondar(
    itens.reduce((s, i) => s.plus(paraDecimal(i.valorMensalNormalizado)), new Decimal(0)),
  );
}

/**
 * Custo mensal por setor, aplicando o rateio percentual.
 * Item sem rateio cai em "Não rateado" — visível, nunca descartado.
 */
export async function custoPorSetor(escopo: Escopo, naturezas: Natureza[]): Promise<Fatia[]> {
  const itens = await prisma.itemCusto.findMany({
    where: filtroBase(escopo, naturezas),
    select: {
      valorMensalNormalizado: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { percentual: true, setor: { select: { id: true, nome: true } } },
      },
    },
  });

  const acumulado = new Map<string, { rotulo: string; valor: Decimal }>();
  const somar = (chave: string, rotulo: string, valor: Decimal) => {
    const atual = acumulado.get(chave) ?? { rotulo, valor: new Decimal(0) };
    atual.valor = atual.valor.plus(valor);
    acumulado.set(chave, atual);
  };

  for (const item of itens) {
    const total = paraDecimal(item.valorMensalNormalizado);
    if (item.rateios.length === 0) {
      somar("nao-rateado", "Não rateado", total);
      continue;
    }
    for (const r of item.rateios) {
      const pct = paraDecimal(r.percentual);
      somar(r.setor.id, r.setor.nome, total.mul(pct).div(100));
    }
  }

  return ordenarComParticipacao(acumulado);
}

async function agruparPor(
  escopo: Escopo,
  naturezas: Natureza[],
  campo: "categoria" | "fornecedor",
  rotuloVazio: string,
): Promise<Fatia[]> {
  const itens = await prisma.itemCusto.findMany({
    where: filtroBase(escopo, naturezas),
    select: {
      valorMensalNormalizado: true,
      categoria: campo === "categoria" ? { select: { id: true, nome: true } } : false,
      fornecedor: campo === "fornecedor" ? { select: { id: true, nome: true } } : false,
    },
  });

  const acumulado = new Map<string, { rotulo: string; valor: Decimal }>();
  for (const item of itens) {
    const alvo = campo === "categoria" ? item.categoria : item.fornecedor;
    const chave = alvo?.id ?? `sem-${campo}`;
    const rotulo = alvo?.nome ?? rotuloVazio;
    const atual = acumulado.get(chave) ?? { rotulo, valor: new Decimal(0) };
    atual.valor = atual.valor.plus(paraDecimal(item.valorMensalNormalizado));
    acumulado.set(chave, atual);
  }
  return ordenarComParticipacao(acumulado);
}

export const custoPorCategoria = (e: Escopo, n: Natureza[]) =>
  agruparPor(e, n, "categoria", "Sem categoria");

export const custoPorFornecedor = (e: Escopo, n: Natureza[]) =>
  agruparPor(e, n, "fornecedor", "Sem fornecedor");

/** Itens que vencem ou renovam dentro de N dias. */
export async function renovacoesProximas(escopo: Escopo, dias = 90) {
  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + dias);

  return prisma.itemCusto.findMany({
    where: {
      status: { in: [...STATUS_CORRENTE] },
      dataFim: { not: null, gte: hoje, lte: limite },
      ...(escopo.setorIds === null
        ? {}
        : { rateios: { some: { setorId: { in: escopo.setorIds } } } }),
    },
    select: {
      id: true,
      descricao: true,
      dataFim: true,
      valorMensalNormalizado: true,
      fornecedor: { select: { nome: true } },
      rateios: { where: { vigenciaFim: null }, select: { setor: { select: { nome: true } } }, take: 1 },
    },
    orderBy: { dataFim: "asc" },
    take: 20,
  });
}

/** Itens cadastrados sem valor — o que impede o total de estar completo. */
export async function pendenciasDeDado(escopo: Escopo) {
  const [semValor, semCategoria, semVigencia] = await Promise.all([
    prisma.itemCusto.count({
      where: {
        status: { in: [...STATUS_CORRENTE] },
        valorMensalNormalizado: null,
        ...(escopo.setorIds === null ? {} : { rateios: { some: { setorId: { in: escopo.setorIds } } } }),
      },
    }),
    prisma.itemCusto.count({
      where: {
        status: { in: [...STATUS_CORRENTE] },
        categoriaId: null,
        ...(escopo.setorIds === null ? {} : { rateios: { some: { setorId: { in: escopo.setorIds } } } }),
      },
    }),
    prisma.itemCusto.count({
      where: {
        status: { in: [...STATUS_CORRENTE] },
        dataFim: null,
        ...(escopo.setorIds === null ? {} : { rateios: { some: { setorId: { in: escopo.setorIds } } } }),
      },
    }),
  ]);
  return { semValor, semCategoria, semVigencia };
}

/**
 * Pendências com identidade: quais itens estão incompletos, com link direto.
 * A contagem diz que algo falta; a lista diz ONDE clicar para resolver.
 */
export async function itensComPendencia(escopo: Escopo, limite = 5) {
  const base = {
    status: { in: [...STATUS_CORRENTE] },
    ...(escopo.setorIds === null
      ? {}
      : { rateios: { some: { setorId: { in: escopo.setorIds } } } }),
  };
  const selecao = {
    id: true,
    descricao: true,
    fornecedor: { select: { nome: true } },
  } as const;

  const [semValor, semVigencia] = await Promise.all([
    prisma.itemCusto.findMany({
      where: { ...base, valorMensalNormalizado: null },
      select: selecao,
      orderBy: { atualizadoEm: "desc" },
      take: limite,
    }),
    prisma.itemCusto.findMany({
      where: { ...base, dataFim: null, valorMensalNormalizado: { not: null } },
      select: selecao,
      orderBy: { valorMensalNormalizado: "desc" },
      take: limite,
    }),
  ]);
  return { semValor, semVigencia };
}

/** Os maiores custos do escopo — o resumo que um gestor quer ver primeiro. */
export async function maioresItens(escopo: Escopo, naturezas: Natureza[], limite = 5) {
  return prisma.itemCusto.findMany({
    where: filtroBase(escopo, naturezas),
    select: {
      id: true,
      descricao: true,
      valorMensalNormalizado: true,
      fornecedor: { select: { nome: true } },
    },
    orderBy: { valorMensalNormalizado: "desc" },
    take: limite,
  });
}

/** Quais setores já lançaram alguma coisa. Impede ler um parcial como total. */
export async function setoresQueLancaram() {
  const setores = await prisma.setor.findMany({
    where: { ativo: true },
    select: {
      id: true,
      nome: true,
      _count: { select: { rateios: true } },
    },
    orderBy: { nome: "asc" },
  });
  return setores.map((s) => ({
    id: s.id,
    nome: s.nome,
    lancou: s._count.rateios > 0,
  }));
}
