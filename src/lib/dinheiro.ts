import { Decimal } from "decimal.js";
import type { Periodicidade } from "@/generated/prisma/enums";

/**
 * Normalização de periodicidade.
 *
 * Este módulo existe por causa do problema nº 01 do diagnóstico: a planilha
 * somava valores mensais, trimestrais, semestrais e anuais na mesma coluna e
 * chamava o resultado de "Total Geral" de contas mensais.
 *
 * Aqui o valor mensal comparável é sempre DERIVADO. Nunca é digitado.
 */

/** Quantas vezes por ano cada periodicidade é cobrada. */
const OCORRENCIAS_POR_ANO: Record<Periodicidade, number | null> = {
  MENSAL: 12,
  BIMESTRAL: 6,
  TRIMESTRAL: 4,
  SEMESTRAL: 2,
  ANUAL: 1,
  // Pagamento único não tem equivalente mensal recorrente.
  UNICO: null,
  // Consumo variável só é conhecido no lançamento da competência.
  SOB_DEMANDA: null,
};

/**
 * Converte o valor de um período para o equivalente mensal.
 * Retorna null quando a conversão não faz sentido (pagamento único, consumo).
 */
export function valorMensalNormalizado(
  valorPeriodo: Decimal.Value | null | undefined,
  periodicidade: Periodicidade,
): Decimal | null {
  if (valorPeriodo === null || valorPeriodo === undefined) return null;

  const ocorrencias = OCORRENCIAS_POR_ANO[periodicidade];
  if (ocorrencias === null) return null;

  const anual = new Decimal(valorPeriodo).mul(ocorrencias);
  return arredondar(anual.div(12));
}

/** Equivalente anual do valor de um período. */
export function valorAnualNormalizado(
  valorPeriodo: Decimal.Value | null | undefined,
  periodicidade: Periodicidade,
): Decimal | null {
  if (valorPeriodo === null || valorPeriodo === undefined) return null;
  const ocorrencias = OCORRENCIAS_POR_ANO[periodicidade];
  if (ocorrencias === null) return null;
  return arredondar(new Decimal(valorPeriodo).mul(ocorrencias));
}

/** Arredonda para 2 casas, meio-para-cima — o padrão contábil brasileiro. */
export function arredondar(valor: Decimal.Value): Decimal {
  return new Decimal(valor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function somar(valores: Array<Decimal.Value | null | undefined>): Decimal {
  return valores.reduce<Decimal>(
    (total, v) => (v === null || v === undefined ? total : total.plus(v)),
    new Decimal(0),
  );
}

/** Formata em Real brasileiro. */
export function formatarBRL(valor: Decimal.Value | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(new Decimal(valor).toNumber());
}

export function formatarPercentual(valor: Decimal.Value | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${new Decimal(valor).toDecimalPlaces(1).toString().replace(".", ",")}%`;
}

/**
 * Valida que os percentuais de um rateio somam exatamente 100%.
 * Tolerância de 0,01 para absorver arredondamento de divisões como 1/3.
 */
export function rateioFecha(percentuais: Decimal.Value[]): boolean {
  return somar(percentuais).minus(100).abs().lessThanOrEqualTo(new Decimal("0.01"));
}
