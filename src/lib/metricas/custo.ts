import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { arredondar, somar } from "@/lib/dinheiro";
import {
  competenciasNoIntervalo,
  type CompletudeSetor,
  type Competencia,
  type FiltroMetrica,
  type SerieMensal,
  type ValorPorChave,
} from "./tipos";

/** Realizado quando existe; previsto como fallback. */
function valorDoLancamento(l: {
  valorRealizado: unknown;
  valorPrevisto: unknown;
}): Decimal {
  const realizado = l.valorRealizado as { toString(): string } | null;
  const previsto = l.valorPrevisto as { toString(): string } | null;
  if (realizado !== null && realizado !== undefined) return new Decimal(realizado.toString());
  if (previsto !== null && previsto !== undefined) return new Decimal(previsto.toString());
  return new Decimal(0);
}

function participacoes(itens: Array<{ chave: string; rotulo: string; valor: Decimal }>): ValorPorChave[] {
  const total = somar(itens.map((i) => i.valor));
  return itens
    .map((i) => ({
      ...i,
      participacao: total.isZero()
        ? new Decimal(0)
        : arredondar(i.valor.div(total).mul(100)),
    }))
    .sort((a, b) => b.valor.comparedTo(a.valor));
}

async function competenciaIds(de: Competencia, ate: Competencia): Promise<string[]> {
  const alvo = competenciasNoIntervalo(de, ate);
  const registros = await prisma.competencia.findMany({
    where: { OR: alvo.map(({ ano, mes }) => ({ ano, mes })) },
    select: { id: true },
  });
  return registros.map((r) => r.id);
}

/**
 * Custo total do período, por natureza explícita.
 * Não existe versão desta função sem o parâmetro `naturezas`.
 */
export async function custoTotal(filtro: FiltroMetrica): Promise<Decimal> {
  const ids = await competenciaIds(filtro.de, filtro.ate);
  if (ids.length === 0) return new Decimal(0);

  const lancamentos = await prisma.lancamentoCusto.findMany({
    where: {
      competenciaId: { in: ids },
      natureza: { in: filtro.naturezas },
      ...(filtro.categoriaIds?.length
        ? { itemCusto: { categoriaId: { in: filtro.categoriaIds } } }
        : {}),
    },
    select: { valorRealizado: true, valorPrevisto: true },
  });

  return arredondar(somar(lancamentos.map(valorDoLancamento)));
}

/** Custo do período agrupado por fornecedor. */
export async function custoPorFornecedor(filtro: FiltroMetrica): Promise<ValorPorChave[]> {
  const ids = await competenciaIds(filtro.de, filtro.ate);
  if (ids.length === 0) return [];

  const lancamentos = await prisma.lancamentoCusto.findMany({
    where: { competenciaId: { in: ids }, natureza: { in: filtro.naturezas } },
    select: {
      valorRealizado: true,
      valorPrevisto: true,
      itemCusto: {
        select: { contrato: { select: { fornecedor: { select: { id: true, nome: true } } } } },
      },
    },
  });

  const acumulado = new Map<string, { rotulo: string; valor: Decimal }>();
  for (const l of lancamentos) {
    const f = l.itemCusto.contrato?.fornecedor;
    const chave = f?.id ?? "sem-fornecedor";
    const rotulo = f?.nome ?? "Sem fornecedor";
    const atual = acumulado.get(chave) ?? { rotulo, valor: new Decimal(0) };
    atual.valor = atual.valor.plus(valorDoLancamento(l));
    acumulado.set(chave, atual);
  }

  return participacoes([...acumulado].map(([chave, v]) => ({ chave, ...v })));
}

/** Custo do período agrupado por categoria. */
export async function custoPorCategoria(filtro: FiltroMetrica): Promise<ValorPorChave[]> {
  const ids = await competenciaIds(filtro.de, filtro.ate);
  if (ids.length === 0) return [];

  const lancamentos = await prisma.lancamentoCusto.findMany({
    where: { competenciaId: { in: ids }, natureza: { in: filtro.naturezas } },
    select: {
      valorRealizado: true,
      valorPrevisto: true,
      itemCusto: { select: { categoria: { select: { id: true, nome: true } } } },
    },
  });

  const acumulado = new Map<string, { rotulo: string; valor: Decimal }>();
  for (const l of lancamentos) {
    const c = l.itemCusto.categoria;
    const chave = c?.id ?? "sem-categoria";
    const rotulo = c?.nome ?? "Sem categoria";
    const atual = acumulado.get(chave) ?? { rotulo, valor: new Decimal(0) };
    atual.valor = atual.valor.plus(valorDoLancamento(l));
    acumulado.set(chave, atual);
  }

  return participacoes([...acumulado].map(([chave, v]) => ({ chave, ...v })));
}

/**
 * Custo por setor — aplica o rateio.
 *
 * É a métrica que a planilha não conseguia produzir, e a razão de a coluna
 * "Centro Custo" ter ficado 100% vazia nela. Um lançamento sem rateio não é
 * distribuído nem descartado: cai em "Não rateado", para ficar visível.
 */
export async function custoPorSetor(filtro: FiltroMetrica): Promise<ValorPorChave[]> {
  const ids = await competenciaIds(filtro.de, filtro.ate);
  if (ids.length === 0) return [];

  const lancamentos = await prisma.lancamentoCusto.findMany({
    where: { competenciaId: { in: ids }, natureza: { in: filtro.naturezas } },
    select: {
      valorRealizado: true,
      valorPrevisto: true,
      rateios: { select: { percentual: true, valor: true, setor: { select: { id: true, nome: true } } } },
      itemCusto: {
        select: {
          rateios: {
            select: { percentual: true, valor: true, setor: { select: { id: true, nome: true } } },
          },
        },
      },
    },
  });

  const acumulado = new Map<string, { rotulo: string; valor: Decimal }>();
  const somaEm = (chave: string, rotulo: string, valor: Decimal) => {
    const atual = acumulado.get(chave) ?? { rotulo, valor: new Decimal(0) };
    atual.valor = atual.valor.plus(valor);
    acumulado.set(chave, atual);
  };

  for (const l of lancamentos) {
    const total = valorDoLancamento(l);
    // Rateio do lançamento é exceção pontual e vence o rateio padrão do item.
    const regras = l.rateios.length > 0 ? l.rateios : l.itemCusto.rateios;

    if (regras.length === 0) {
      somaEm("nao-rateado", "Não rateado", total);
      continue;
    }

    for (const r of regras) {
      const percentual = r.percentual as { toString(): string } | null;
      const valorFixo = r.valor as { toString(): string } | null;
      const parcela = percentual
        ? total.mul(new Decimal(percentual.toString())).div(100)
        : valorFixo
          ? new Decimal(valorFixo.toString())
          : new Decimal(0);
      somaEm(r.setor.id, r.setor.nome, parcela);
    }
  }

  return participacoes(
    [...acumulado].map(([chave, v]) => ({ chave, rotulo: v.rotulo, valor: arredondar(v.valor) })),
  );
}

/** Série mensal do custo — base de "quais custos aumentaram nos últimos meses". */
export async function serieMensal(filtro: FiltroMetrica): Promise<SerieMensal[]> {
  const alvo = competenciasNoIntervalo(filtro.de, filtro.ate);
  const registros = await prisma.competencia.findMany({
    where: { OR: alvo.map(({ ano, mes }) => ({ ano, mes })) },
    select: {
      ano: true,
      mes: true,
      lancamentos: {
        where: { natureza: { in: filtro.naturezas } },
        select: { valorRealizado: true, valorPrevisto: true },
      },
    },
    orderBy: [{ ano: "asc" }, { mes: "asc" }],
  });

  return registros.map((c) => ({
    competencia: { ano: c.ano, mes: c.mes },
    valor: arredondar(somar(c.lancamentos.map(valorDoLancamento))),
  }));
}

/** Contratos que vencem dentro de N dias e ainda não foram encerrados. */
export async function renovacoesEmAberto(dias = 90) {
  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + dias);

  return prisma.contrato.findMany({
    where: {
      status: { in: ["ATIVO", "EM_RENOVACAO", "EM_ANALISE"] },
      dataFim: { not: null, gte: hoje, lte: limite },
    },
    select: {
      id: true,
      objeto: true,
      numero: true,
      dataFim: true,
      renovacaoAutomatica: true,
      avisoPrevioDias: true,
      fornecedor: { select: { nome: true } },
      setorGestor: { select: { nome: true } },
    },
    orderBy: { dataFim: "asc" },
  });
}

/**
 * Completude por setor.
 *
 * Existe para impedir o pior modo de falha desta plataforma: exibir um total
 * consolidado com 1 setor preenchido e 12 vazios, e alguém ler aquilo como
 * "o custo da FMP". Nenhuma tela consolidada deve ser renderizada sem isto.
 */
export async function completudePorSetor(competencia: Competencia): Promise<CompletudeSetor[]> {
  const setores = await prisma.setor.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const registro = await prisma.competencia.findUnique({
    where: { ano_mes: { ano: competencia.ano, mes: competencia.mes } },
    select: { id: true },
  });

  return Promise.all(
    setores.map(async (setor) => {
      const itens = await prisma.itemCusto.findMany({
        where: {
          status: { in: ["ATIVO", "EM_ANALISE", "PENDENTE_APURACAO"] },
          rateios: { some: { setorId: setor.id } },
        },
        select: { id: true, valorPeriodo: true, rateios: { select: { id: true } } },
      });

      const contratosSemVigencia = await prisma.contrato.count({
        where: { setorGestorId: setor.id, status: "ATIVO", dataFim: null },
      });

      const reportou =
        registro !== null &&
        (await prisma.lancamentoCusto.count({
          where: {
            competenciaId: registro.id,
            OR: [
              { rateios: { some: { setorId: setor.id } } },
              { itemCusto: { rateios: { some: { setorId: setor.id } } } },
            ],
          },
        })) > 0;

      return {
        setorId: setor.id,
        setorNome: setor.nome,
        itensAtivos: itens.length,
        itensSemValor: itens.filter((i) => i.valorPeriodo === null).length,
        itensSemRateio: itens.filter((i) => i.rateios.length === 0).length,
        contratosSemVigencia,
        reportouCompetencia: reportou,
      };
    }),
  );
}
