/**
 * Limitador de tentativas em memória.
 *
 * Suficiente para a topologia real (um container): sobrevive entre requisições
 * porque o módulo é singleton, e zera num restart — o que é aceitável para
 * conter força bruta online contra o login. Se um dia houver múltiplas
 * réplicas, isto precisa migrar para o Postgres.
 */

type Janela = { tentativas: number; inicioMs: number };

const janelas = new Map<string, Janela>();

const LIMITE = 10;
const JANELA_MS = 15 * 60 * 1000;

export function tentativaPermitida(chave: string): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);

  if (!atual || agora - atual.inicioMs > JANELA_MS) {
    janelas.set(chave, { tentativas: 1, inicioMs: agora });
    return true;
  }

  atual.tentativas += 1;

  // Poda oportunista para a estrutura não crescer sem limite.
  if (janelas.size > 10_000) {
    for (const [k, j] of janelas) {
      if (agora - j.inicioMs > JANELA_MS) janelas.delete(k);
    }
  }

  return atual.tentativas <= LIMITE;
}

export function limparTentativas(chave: string): void {
  janelas.delete(chave);
}
