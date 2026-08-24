import { Decimal } from "decimal.js";
import type { Moeda, Periodicidade } from "@/generated/prisma/enums";

/**
 * Normalização de periodicidade E DE MOEDA.
 *
 * Este módulo existe por causa do problema nº 01 do diagnóstico: a planilha
 * somava valores mensais, trimestrais, semestrais e anuais na mesma coluna e
 * chamava o resultado de "Total Geral" de contas mensais.
 *
 * Havia um segundo eixo do mesmo erro, e ele sobreviveu mais tempo: a moeda.
 * O sistema deixava escolher dólar e euro no cadastro e depois somava tudo como
 * se fosse real — um contrato de US$ 500/mês entrava no total da FMP como
 * R$ 500. Comparável em periodicidade, cego em moeda.
 *
 * Duas regras fecham os dois eixos:
 *  - o valor mensal comparável é sempre DERIVADO, nunca digitado;
 *  - ele é sempre EM REAL, e a taxa que o produziu fica gravada no item.
 *
 * O que NÃO se faz aqui é converter na hora da soma pela cotação de hoje. O
 * total de junho ficaria diferente a cada vez que alguém abrisse a tela, e um
 * relatório impresso na sexta não bateria com o mesmo relatório na segunda.
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
 * Converte o valor de um período para o equivalente mensal, NA MOEDA DO ITEM.
 *
 * Retorna null quando a conversão não faz sentido (pagamento único, consumo).
 * Serve para exibir "US$ 500,00/mês" ao lado do real convertido — nunca para
 * alimentar soma nenhuma: dois itens em moedas diferentes não se somam por
 * aqui. Quem grava e quem soma usa `valorMensalEmReais`.
 */
export function valorMensalNaMoeda(
  valorPeriodo: Decimal.Value | null | undefined,
  periodicidade: Periodicidade,
): Decimal | null {
  if (valorPeriodo === null || valorPeriodo === undefined) return null;

  const ocorrencias = OCORRENCIAS_POR_ANO[periodicidade];
  if (ocorrencias === null) return null;

  const anual = new Decimal(valorPeriodo).mul(ocorrencias);
  return arredondar(anual.div(12));
}

/**
 * Converte um valor para real pela taxa informada.
 *
 * Devolve null — e não o valor original — quando a moeda é estrangeira e a taxa
 * está faltando. É a decisão central deste módulo: **na dúvida, o número sai da
 * conta**. Tratar câmbio ausente como 1,00 é exatamente o defeito que se está
 * corrigindo, e ele é pior que um buraco porque não aparece em lugar nenhum. O
 * buraco aparece: o item cai na fila de pendências com link direto.
 */
export function emReais(
  valor: Decimal.Value | null | undefined,
  moeda: Moeda,
  cambio: Decimal.Value | null | undefined,
): Decimal | null {
  if (valor === null || valor === undefined) return null;
  if (moeda === "BRL") return arredondar(valor);

  if (cambio === null || cambio === undefined) return null;
  const taxa = new Decimal(cambio);
  if (!taxa.isFinite() || taxa.lessThanOrEqualTo(0)) return null;

  return arredondar(new Decimal(valor).mul(taxa));
}

/**
 * O número que vai para o banco e para todas as somas: equivalente mensal, em
 * real, seja qual for a moeda do item.
 *
 * A ordem importa. Converte-se primeiro para real e só depois divide-se pelos
 * meses — o inverso arredondaria duas vezes e produziria um centavo de
 * diferença entre o total do painel e a soma das linhas da lista.
 */
export function valorMensalEmReais(
  valorPeriodo: Decimal.Value | null | undefined,
  periodicidade: Periodicidade,
  moeda: Moeda,
  cambio: Decimal.Value | null | undefined,
): Decimal | null {
  const ocorrencias = OCORRENCIAS_POR_ANO[periodicidade];
  if (ocorrencias === null) return null;

  const reais = emReais(valorPeriodo, moeda, cambio);
  if (reais === null) return null;

  return arredondar(reais.mul(ocorrencias).div(12));
}

/** Equivalente anual em real. Mesma regra de conversão. */
export function valorAnualEmReais(
  valorPeriodo: Decimal.Value | null | undefined,
  periodicidade: Periodicidade,
  moeda: Moeda,
  cambio: Decimal.Value | null | undefined,
): Decimal | null {
  const ocorrencias = OCORRENCIAS_POR_ANO[periodicidade];
  if (ocorrencias === null) return null;

  const reais = emReais(valorPeriodo, moeda, cambio);
  return reais === null ? null : arredondar(reais.mul(ocorrencias));
}

/**
 * Os dois campos derivados do item, calculados juntos.
 *
 * `valorMensalNormalizado` e `valorEmReais` respondem a perguntas diferentes —
 * "quanto por mês" e "quanto custou esta cobrança" — e são gravados nos mesmos
 * sete lugares. Calculá-los separadamente é garantir que um dia alguém atualize
 * um e esqueça o outro, e aí a lista de recorrentes e a de compras passam a
 * discordar sobre o mesmo item sem que nenhuma pareça errada.
 *
 * Devolve texto pronto para o banco: `Decimal` com duas casas, ou nulo quando a
 * conversão não é possível.
 */
export function derivados(
  valorPeriodo: Decimal.Value | null | undefined,
  periodicidade: Periodicidade,
  moeda: Moeda,
  cambio: Decimal.Value | null | undefined,
): { valorMensalNormalizado: string | null; valorEmReais: string | null } {
  const mensal = valorMensalEmReais(valorPeriodo, periodicidade, moeda, cambio);
  const cheio = emReais(valorPeriodo, moeda, cambio);
  return {
    valorMensalNormalizado: mensal ? mensal.toFixed(2) : null,
    valorEmReais: cheio ? cheio.toFixed(2) : null,
  };
}

/**
 * Um item em moeda estrangeira precisa de taxa. Esta é a pergunta que a tela,
 * a action e a fila de pendências fazem — as três com a mesma resposta.
 */
export function precisaDeCambio(moeda: Moeda, cambio: Decimal.Value | null | undefined): boolean {
  if (moeda === "BRL") return false;
  if (cambio === null || cambio === undefined) return true;
  const taxa = new Decimal(cambio);
  return !taxa.isFinite() || taxa.lessThanOrEqualTo(0);
}

/**
 * Lê um valor monetário como as pessoas realmente digitam:
 * "1.234,56", "1234,56", "1234.56", "R$ 1.234,56", "1.234", "1.234.567".
 *
 * Devolve a string decimal, ou null quando vazio ou ilegível. Nunca aceita
 * negativo: custo negativo não existe neste domínio, e um sinal de menos
 * digitado por engano distorceria os totais de toda a organização.
 *
 * Mora aqui, e não junto do `FormData`, porque três lugares precisam da MESMA
 * leitura: a action que grava, a prévia do equivalente mensal que aparece
 * enquanto se digita e o importador de planilha. Três cópias da regra viram
 * três interpretações diferentes de "1.234" na primeira divergência.
 */
export function lerValorDigitado(entrada: string): string | null {
  // Sinal de menos é rejeitado, não removido: apagar o "-" em silêncio
  // transformaria um estorno digitado por engano num custo positivo.
  if (entrada.includes("-")) return null;
  const bruto = entrada.replace(/[^\d.,]/g, "");
  if (bruto === "") return null;

  let normalizado: string;
  if (bruto.includes(",")) {
    // Vírgula presente: ela é o decimal, ponto é milhar. "1.234,56" -> 1234.56
    normalizado = bruto.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(bruto)) {
    // Só pontos, em grupos de 3: é milhar no formato brasileiro.
    // "1.234" é mil duzentos e trinta e quatro — não R$ 1,23.
    normalizado = bruto.replace(/\./g, "");
  } else {
    // "1234.56" (decimal com ponto) ou "1234" (inteiro).
    normalizado = bruto;
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero < 0 || numero >= 1e12) return null;
  return numero.toFixed(2);
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
  return formatarMoeda(valor, "BRL");
}

/**
 * Formata na moeda do item: "R$ 1.234,56", "US$ 500,00", "€ 90,00".
 *
 * Sempre com o símbolo, sempre com a localidade brasileira. Mostrar "500,00"
 * sem símbolo ao lado de valores em real é como o defeito começou.
 */
export function formatarMoeda(
  valor: Decimal.Value | null | undefined,
  moeda: Moeda | string,
): string {
  if (valor === null || valor === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
  }).format(new Decimal(valor).toNumber());
}

/**
 * Lê uma taxa de câmbio como as pessoas digitam: "5,4321", "5.4321", "5".
 *
 * Não reaproveita `lerValorDigitado` porque as duas leituras discordam de
 * propósito. Dinheiro tem duas casas e "1.234" é mil duzentos e trinta e
 * quatro; câmbio tem seis casas e "5.4321" é cinco vírgula quatro mil trezentos
 * e vinte e um — passar isso pela regra do milhar brasileiro daria 54.321, e um
 * dólar a cinquenta e quatro mil reais multiplicaria o total da FMP por dez mil.
 *
 * A faixa aceita (0,01 a 1.000) não é purismo: ela recusa o zero à esquerda
 * esquecido e o dedo que escorregou para o teclado numérico.
 */
export function lerCambioDigitado(entrada: string): string | null {
  const bruto = entrada.trim().replace(/[^\d.,]/g, "");
  if (bruto === "") return null;

  // Vírgula e ponto são ambos separador decimal aqui — não há milhar num câmbio.
  const partes = bruto.replace(/,/g, ".").split(".");
  if (partes.length > 2) return null;

  const numero = Number(partes.join("."));
  if (!Number.isFinite(numero) || numero < 0.01 || numero > 1000) return null;
  return new Decimal(numero).toDecimalPlaces(6).toFixed(6);
}

/** "5,4321" — a taxa como ela é lida, sem zeros decorativos no fim. */
export function formatarCambio(valor: Decimal.Value | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  const texto = new Decimal(valor).toDecimalPlaces(6).toString();
  return texto.replace(".", ",");
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
