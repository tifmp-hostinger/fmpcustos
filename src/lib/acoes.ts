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
 * "1.234,56", "1234,56", "1234.56", "R$ 1.234,56".
 */
export function dinheiro(dados: FormData, campo: string): string | null {
  const bruto = texto(dados, campo).replace(/[^\d.,-]/g, "");
  if (bruto === "") return null;

  // Se tem vírgula, ela é o separador decimal e o ponto é de milhar.
  const normalizado = bruto.includes(",")
    ? bruto.replace(/\./g, "").replace(",", ".")
    : bruto;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero.toFixed(2) : null;
}

export function inteiroOpcional(dados: FormData, campo: string): number | null {
  const valor = texto(dados, campo);
  if (valor === "") return null;
  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

export function dataOpcional(dados: FormData, campo: string): Date | null {
  const valor = texto(dados, campo);
  if (valor === "") return null;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}
