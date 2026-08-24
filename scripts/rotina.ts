import "dotenv/config";
import { ehTarefa, executar, TAREFAS } from "../src/lib/rotinas";
import { testarSmtp } from "../src/lib/email";

/**
 * As rotinas pela linha de comando.
 *
 *   npm run rotina alertas   — varre o cadastro e sincroniza os alertas
 *   npm run rotina resumo    — manda o resumo semanal para quem deve receber
 *   npm run rotina smtp      — só testa a conexão, sem mandar nada
 *
 * Chama exatamente as mesmas funções que o cron chama pela rota HTTP. Uma rotina
 * que se comporta diferente no terminal e no agendador é uma rotina que só se
 * depura em produção.
 */
async function main(): Promise<number> {
  const pedido = process.argv[2];

  if (pedido === "smtp") {
    const r = await testarSmtp();
    console.log(r.ok ? "SMTP responde." : `SMTP indisponível: ${r.motivo}`);
    return r.ok ? 0 : 1;
  }

  if (!pedido || !ehTarefa(pedido)) {
    console.error(`Tarefa desconhecida. Disponíveis: ${TAREFAS.join(", ")}, smtp`);
    return 2;
  }

  const resultado = await executar(pedido);
  console.log(`${resultado.tarefa} · ${resultado.duracaoMs}ms`);
  for (const [chave, valor] of Object.entries(resultado.detalhe)) {
    console.log(`  ${chave}: ${typeof valor === "object" ? JSON.stringify(valor) : valor}`);
  }
  return resultado.ok ? 0 : 1;
}

main().then(
  (codigo) => process.exit(codigo),
  (erro) => {
    console.error(erro);
    process.exit(1);
  },
);
