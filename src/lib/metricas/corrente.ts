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
 *  - item na lixeira (`excluidoEm`) nunca entra em métrica: ele já sumiu da
 *    lista para quem o excluiu, e continuar somando no painel faria os dois
 *    números divergirem sem explicação;
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
    excluidoEm: null,
    status: { in: [...STATUS_CORRENTE] },
    natureza: { in: naturezas },
    valorMensalNormalizado: { not: null },
    ...(escopo.setorIds === null
      ? {}
      : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } }),
  };
}

function ordenarComParticipacao(bruto: Map<string, { rotulo: string; valor: Decimal }>): Fatia[] {
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

/**
 * Soma do equivalente mensal dos itens correntes.
 *
 * Com escopo setorial, cada item entra pela FRAÇÃO rateada ao setor — não pelo
 * valor cheio. Sem isso, um item 50% TI / 50% RH contaria inteiro nas duas
 * casas e a soma dos setores excederia o total corporativo, quebrando a regra
 * "o mesmo número em todo lugar".
 */
export async function custoMensalCorrente(escopo: Escopo, naturezas: Natureza[]): Promise<Decimal> {
  const itens = await prisma.itemCusto.findMany({
    where: filtroBase(escopo, naturezas),
    select: {
      valorMensalNormalizado: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { percentual: true, setorId: true },
      },
    },
  });

  let total = new Decimal(0);
  for (const item of itens) {
    const valor = paraDecimal(item.valorMensalNormalizado);
    if (escopo.setorIds === null) {
      total = total.plus(valor);
      continue;
    }
    const fracao = item.rateios
      .filter((r) => escopo.setorIds!.includes(r.setorId))
      .reduce((s, r) => s.plus(paraDecimal(r.percentual)), new Decimal(0));
    total = total.plus(valor.mul(fracao).div(100));
  }
  return arredondar(total);
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
  // Truncado para o início do dia (UTC): dataFim é @db.Date (meia-noite UTC),
  // e comparar com o horário corrente faria a renovação sumir do alerta
  // exatamente no dia em que ela vence.
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const limite = new Date(hoje);
  limite.setUTCDate(limite.getUTCDate() + dias);

  return prisma.itemCusto.findMany({
    where: {
      excluidoEm: null,
      status: { in: [...STATUS_CORRENTE] },
      dataFim: { not: null, gte: hoje, lte: limite },
      ...(escopo.setorIds === null
        ? {}
        : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } }),
    },
    select: {
      id: true,
      descricao: true,
      dataFim: true,
      valorMensalNormalizado: true,
      fornecedor: { select: { nome: true } },
      rateios: {
        where: { vigenciaFim: null },
        select: { setor: { select: { nome: true } } },
        take: 1,
      },
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
        excluidoEm: null,
        status: { in: [...STATUS_CORRENTE, "PENDENTE_APURACAO"] },
        valorPeriodo: null,
        ...(escopo.setorIds === null
          ? {}
          : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } }),
      },
    }),
    prisma.itemCusto.count({
      where: {
        excluidoEm: null,
        status: { in: [...STATUS_CORRENTE] },
        categoriaId: null,
        ...(escopo.setorIds === null
          ? {}
          : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } }),
      },
    }),
    prisma.itemCusto.count({
      where: {
        excluidoEm: null,
        status: { in: [...STATUS_CORRENTE] },
        dataFim: null,
        semPrazoDeterminado: false,
        ...(escopo.setorIds === null
          ? {}
          : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } }),
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
  const escopoRateio =
    escopo.setorIds === null
      ? {}
      : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } };
  const selecao = {
    id: true,
    descricao: true,
    fornecedor: { select: { nome: true } },
  } as const;

  const [semValor, semVigencia] = await Promise.all([
    // "Sem valor" = valorPeriodo vazio. O sistema marca esses itens como
    // PENDENTE_APURACAO, então esse status ENTRA aqui — era o furo que
    // escondia os "CALCULAR" importados. E a base é valorPeriodo, não o
    // normalizado: item por consumo tem valor preenchido e normalizado nulo
    // por design, e não é pendência.
    prisma.itemCusto.findMany({
      where: {
        excluidoEm: null,
        status: { in: [...STATUS_CORRENTE, "PENDENTE_APURACAO"] },
        valorPeriodo: null,
        ...escopoRateio,
      },
      select: selecao,
      orderBy: { atualizadoEm: "desc" },
      take: limite,
    }),
    prisma.itemCusto.findMany({
      where: {
        excluidoEm: null,
        status: { in: [...STATUS_CORRENTE] },
        dataFim: null,
        semPrazoDeterminado: false,
        valorMensalNormalizado: { not: null },
        ...escopoRateio,
      },
      select: selecao,
      orderBy: { valorMensalNormalizado: "desc" },
      take: limite,
    }),
  ]);
  return { semValor, semVigencia };
}

/**
 * Os maiores custos do escopo — o resumo que um gestor quer ver primeiro.
 * Com escopo setorial, o valor exibido é a fração rateada ao setor.
 */
export async function maioresItens(escopo: Escopo, naturezas: Natureza[], limite = 5) {
  const itens = await prisma.itemCusto.findMany({
    where: filtroBase(escopo, naturezas),
    select: {
      id: true,
      descricao: true,
      valorMensalNormalizado: true,
      fornecedor: { select: { nome: true } },
      rateios: { where: { vigenciaFim: null }, select: { percentual: true, setorId: true } },
    },
    orderBy: { valorMensalNormalizado: { sort: "desc", nulls: "last" } },
    take: limite * 3,
  });

  return itens
    .map((item) => {
      const cheio = paraDecimal(item.valorMensalNormalizado);
      const fracao =
        escopo.setorIds === null
          ? new Decimal(100)
          : item.rateios
              .filter((r) => escopo.setorIds!.includes(r.setorId))
              .reduce((s, r) => s.plus(paraDecimal(r.percentual)), new Decimal(0));
      return {
        id: item.id,
        descricao: item.descricao,
        fornecedor: item.fornecedor,
        valorMensalDoEscopo: arredondar(cheio.mul(fracao).div(100)),
      };
    })
    .sort((a, b) => b.valorMensalDoEscopo.comparedTo(a.valorMensalDoEscopo))
    .slice(0, limite);
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
