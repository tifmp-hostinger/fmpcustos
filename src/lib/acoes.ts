/**
 * Resultado padrão de uma server action de formulário.
 *
 * `valores` devolve o que a pessoa digitou, para o formulário reexibir em caso
 * de erro. Sem isso, um erro de validação apaga o que já foi preenchido — o que
 * é irritante num login e inaceitável num formulário de vinte campos.
 * Nunca inclua senha aqui.
 */
export type Resultado =
  | { ok: true; mensagem?: string }
  | { ok: false; erro: string; valores?: Record<string, string> };

export const falha = (erro: string, valores?: Record<string, string>): Resultado => ({
  ok: false,
  erro,
  valores,
});
export const sucesso = (mensagem?: string): Resultado => ({ ok: true, mensagem });

/** Lê um campo de texto obrigatório do FormData. */
export function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Lê um campo opcional; string vazia vira null. */
export function textoOpcional(dados: FormData, campo: string): string | null {
  const valor = texto(dados, campo);
  return valor === "" ? null : valor;
}

/**
 * Lê um valor monetário aceitando os formatos que as pessoas realmente digitam:
 * "1.234,56", "1234,56", "1234.56", "R$ 1.234,56", "1.234", "1.234.567".
 *
 * Retorna a string decimal, ou null quando vazio/ilegível. Nunca aceita
 * negativo: custo negativo não existe neste domínio, e um sinal de menos
 * digitado por engano distorceria os totais de toda a organização.
 */
export function dinheiro(dados: FormData, campo: string): string | null {
  const original = texto(dados, campo);
  // Sinal de menos é rejeitado, não removido: apagar o "-" em silêncio
  // transformaria um estorno digitado por engano num custo positivo.
  if (original.includes("-")) return null;
  const bruto = original.replace(/[^\d.,]/g, "");
  if (bruto === "") return null;

  let normalizado: string;
  if (bruto.includes(",")) {
    // Vírgula presente: ela é o decimal, ponto é milhar. "1.234,56" -> 1234.56
    normalizado = bruto.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(bruto)) {
    // Só pontos, em grupos de 3: é milhar no formato brasileiro.
    // "1.234" é mil e duzentos e trinta e quatro — não R$ 1,23.
    normalizado = bruto.replace(/\./g, "");
  } else {
    // "1234.56" (decimal com ponto) ou "1234" (inteiro).
    normalizado = bruto;
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero < 0 || numero >= 1e12) return null;
  return numero.toFixed(2);
}

export function inteiroOpcional(dados: FormData, campo: string): number | null {
  const valor = texto(dados, campo);
  if (valor === "") return null;
  const numero = Number(valor.replace(",", "."));
  // Limites do Decimal(14,4) do banco; negativo não faz sentido para quantidade.
  if (!Number.isFinite(numero) || numero < 0 || numero >= 1e10) return null;
  return numero;
}

/** Valida um valor de FormData contra a lista de um enum; null quando inválido. */
export function opcaoValida<T extends string>(
  dados: FormData,
  campo: string,
  opcoes: readonly T[],
  padrao?: T,
): T | null {
  const valor = texto(dados, campo);
  if (valor === "" && padrao !== undefined) return padrao;
  return (opcoes as readonly string[]).includes(valor) ? (valor as T) : null;
}

export function dataOpcional(dados: FormData, campo: string): Date | null {
  const valor = texto(dados, campo);
  if (valor === "") return null;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}
