import { lerValorDigitado } from "@/lib/dinheiro";

/**
 * Resultado padrão de uma server action de formulário.
 *
 * `valores` devolve o que a pessoa digitou, para o formulário reexibir em caso
 * de erro. Sem isso, um erro de validação apaga o que já foi preenchido — o que
 * é irritante num login e inaceitável num formulário de vinte campos.
 * Nunca inclua senha aqui.
 *
 * `campo` diz QUAL campo recusou, para o formulário focar nele em vez de deixar
 * a pessoa caçar o erro num formulário de quatorze campos.
 */

/** Os campos de um item, serializados, como estavam antes da alteração. */
export type EstadoAnterior = Record<string, string | null>;

/**
 * O que o aviso de sucesso precisa carregar para o "Desfazer" existir de fato.
 *
 * União discriminada em vez de um objeto com campos opcionais: cada forma de
 * desfazer precisa de coisas diferentes, e `id` opcional num tipo só permitia
 * montar um pedido sem o que reverter. Um botão Desfazer que não sabe o que
 * reverter é enfeite.
 */
export type Desfazer =
  | { acao: "restaurarCusto"; id: string }
  | { acao: "reverterCampo"; id: string; antes: EstadoAnterior }
  /** Alteração em lote: cada item volta ao SEU valor anterior, não a um comum. */
  | { acao: "reverterLote"; itens: Array<{ id: string; antes: EstadoAnterior }> };

/**
 * Uma senha temporária recém-gerada.
 *
 * Vem separada da mensagem porque precisa de tratamento próprio na tela: fonte
 * monoespaçada, botão de copiar e permanência até quem gerou dizer que já
 * repassou. Enfiada no meio de uma frase de aviso que some em oito segundos,
 * ela se perde — e a pessoa fica sem acesso até alguém gerar outra.
 */
export type SenhaTemporaria = { nome: string; email: string; senha: string };

export type Resultado =
  | {
      ok: true;
      mensagem?: string;
      senhaTemporaria?: SenhaTemporaria;
      /** Segunda linha do aviso: o delta, o total, o motivo. Nunca mais que uma. */
      detalhe?: string;
      /** Linha a destacar na lista depois da gravação — "foi esta que mudou". */
      destaqueId?: string;
      desfazer?: Desfazer;
      /** Para onde ir depois do sucesso. Ausente = fica onde está. */
      irPara?: string;
      /** Milissegundos do aviso. Destrutivo e em lote ganham mais leitura. */
      duracao?: number;
    }
  | { ok: false; erro: string; valores?: Record<string, string>; campo?: string };

export const falha = (
  erro: string,
  valores?: Record<string, string>,
  campo?: string,
): Resultado => ({ ok: false, erro, valores, campo });

export const sucesso = (
  mensagem?: string,
  extras?: {
    detalhe?: string;
    destaqueId?: string;
    desfazer?: Desfazer;
    irPara?: string;
    duracao?: number;
    senhaTemporaria?: SenhaTemporaria;
  },
): Resultado => ({ ok: true, mensagem, ...extras });

/**
 * Recolhe o FormData inteiro em texto, para devolver ao formulário quando a
 * validação recusa. Campos de senha nunca voltam — devolver senha ao HTML é
 * como escrevê-la no papel de parede.
 */
export function valoresDigitados(dados: FormData): Record<string, string> {
  const fora = /senha|password|token|secret/i;
  const valores: Record<string, string> = {};
  for (const [chave, valor] of dados.entries()) {
    if (typeof valor === "string" && !fora.test(chave)) valores[chave] = valor;
  }
  return valores;
}

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

/** Lê um campo monetário do FormData. A regra de leitura mora em `dinheiro.ts`. */
export function dinheiro(dados: FormData, campo: string): string | null {
  return lerValorDigitado(texto(dados, campo));
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
