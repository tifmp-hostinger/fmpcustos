import { timingSafeEqual } from "node:crypto";

/**
 * ROTINAS
 *
 * O que precisa acontecer sem ninguém abrir o sistema. São chamadas por cron —
 * no EasyPanel, uma tarefa agendada; num servidor, um `curl` no crontab — e pela
 * linha de comando (`npm run rotina alertas`).
 *
 * As duas formas chamam ESTAS funções, e não caminhos paralelos: uma rotina que
 * se comporta diferente no cron e no terminal é uma rotina que só se depura em
 * produção.
 */

export const TAREFAS = ["alertas", "resumo"] as const;
export type Tarefa = (typeof TAREFAS)[number];

export type Execucao = {
  tarefa: Tarefa;
  ok: boolean;
  duracaoMs: number;
  detalhe: Record<string, unknown>;
};

/**
 * As rotinas são carregadas na hora de rodar, e não no topo do arquivo.
 *
 * Assim este módulo continua puro: decidir se uma requisição está autorizada não
 * precisa arrastar o Prisma, o nodemailer e as métricas para dentro do grafo. O
 * ganho concreto é que o guarda de token pode ser testado sem banco — e um
 * guarda de token sem teste é a peça que ninguém confere até vazar.
 */
export async function executar(tarefa: Tarefa): Promise<Execucao> {
  const inicio = Date.now();
  try {
    if (tarefa === "alertas") {
      const { varrerAlertas } = await import("@/lib/alertas");
      const r = await varrerAlertas();
      return { tarefa, ok: true, duracaoMs: Date.now() - inicio, detalhe: { ...r } };
    }
    const { enviarResumos } = await import("@/lib/resumo");
    const r = await enviarResumos();
    return {
      tarefa,
      ok: r.falhas.length === 0,
      duracaoMs: Date.now() - inicio,
      detalhe: { ...r },
    };
  } catch (erro) {
    return {
      tarefa,
      ok: false,
      duracaoMs: Date.now() - inicio,
      detalhe: { erro: erro instanceof Error ? erro.message : String(erro) },
    };
  }
}

export function ehTarefa(valor: string): valor is Tarefa {
  return (TAREFAS as readonly string[]).includes(valor);
}

/**
 * Confere o token da rotina.
 *
 * Sem `ROTINAS_TOKEN` definido, NADA é autorizado. A alternativa — liberar
 * quando não há token — deixaria a rotina aberta na internet por esquecimento,
 * que é justamente como esse tipo de endpoint costuma vazar.
 *
 * A comparação é de tempo constante. O ganho é pequeno num token longo, mas o
 * custo de fazer certo também é, e `===` num segredo é o tipo de coisa que só se
 * lembra depois.
 */
export function tokenAutorizado(cabecalho: string | null): boolean {
  const esperado = process.env.ROTINAS_TOKEN;
  if (!esperado || esperado.length < 16) return false;

  const recebido = (cabecalho ?? "").replace(/^Bearer\s+/i, "").trim();
  if (recebido.length === 0) return false;

  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  // `timingSafeEqual` exige tamanhos iguais; comparar antes já vaza o tamanho,
  // que é informação sem valor prático para quem estiver adivinhando.
  return a.length === b.length && timingSafeEqual(a, b);
}
