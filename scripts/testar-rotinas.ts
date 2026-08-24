import { ehTarefa, tokenAutorizado, TAREFAS } from "../src/lib/rotinas";
import { configuracaoSmtp, escapar } from "../src/lib/email";

/**
 * O guarda das rotinas e a leitura do SMTP.
 *
 * Roda sem banco e sem rede. São as duas peças em que um engano não aparece na
 * tela: um token mal comparado abre uma rota de escrita na internet, e uma
 * configuração de e-mail lida errado faz o sistema achar que manda mensagem
 * quando não manda.
 */
let falhas = 0;
function ok(nome: string, condicao: boolean, extra = "") {
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
  if (!condicao) falhas++;
}

const guardar = { ...process.env };
function comAmbiente(vars: Record<string, string | undefined>, corpo: () => void) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  corpo();
  process.env = { ...guardar };
}

console.log("\n— O token da rotina —");
// Liberar quando não há token deixaria a rota aberta na internet por
// esquecimento, que é como esse tipo de endpoint costuma vazar.
comAmbiente({ ROTINAS_TOKEN: undefined }, () => {
  ok("sem token definido, nada é autorizado", tokenAutorizado("Bearer qualquer") === false);
  ok("nem uma chamada sem token nenhum", tokenAutorizado(null) === false);
});

comAmbiente({ ROTINAS_TOKEN: "curto" }, () => {
  ok("token curto demais não vale", tokenAutorizado("Bearer curto") === false, "5 caracteres");
});

const SEGREDO = "um-token-longo-o-bastante-para-valer";
comAmbiente({ ROTINAS_TOKEN: SEGREDO }, () => {
  ok("o token certo passa", tokenAutorizado(`Bearer ${SEGREDO}`) === true);
  ok("com espaços em volta também", tokenAutorizado(`Bearer   ${SEGREDO}   `) === true);
  ok("sem o prefixo Bearer também", tokenAutorizado(SEGREDO) === true);
  ok("bearer minúsculo também", tokenAutorizado(`bearer ${SEGREDO}`) === true);
  ok("um token errado do mesmo tamanho não passa", tokenAutorizado(`Bearer ${"x".repeat(SEGREDO.length)}`) === false);
  ok("um prefixo do token certo não passa", tokenAutorizado(`Bearer ${SEGREDO.slice(0, -1)}`) === false);
  ok("cabeçalho ausente não passa", tokenAutorizado(null) === false);
  ok("cabeçalho vazio não passa", tokenAutorizado("Bearer ") === false);
});

console.log("\n— As tarefas que existem —");
ok("alertas é tarefa", ehTarefa("alertas"));
ok("resumo é tarefa", ehTarefa("resumo"));
ok("expurgo não é (ainda)", ehTarefa("expurgo") === false);
ok("string vazia não é", ehTarefa("") === false);
ok("são exatamente duas", TAREFAS.length === 2, TAREFAS.join(", "));

console.log("\n— A configuração de e-mail —");
comAmbiente({ SMTP_HOST: undefined, SMTP_USUARIO: undefined, SMTP_SENHA: undefined }, () => {
  ok("sem variáveis, não há configuração", configuracaoSmtp() === null);
});

comAmbiente(
  { SMTP_HOST: "smtp.exemplo.com", SMTP_USUARIO: "custos@fmp.com.br", SMTP_SENHA: "x" },
  () => {
    const cfg = configuracaoSmtp();
    ok("com o essencial, há configuração", cfg !== null);
    ok("porta padrão é 587", cfg?.porta === 587, String(cfg?.porta));
    ok("587 usa STARTTLS, não TLS implícito", cfg?.seguro === false);
    ok(
      "usuário que é endereço vira remetente",
      cfg?.remetente === "Custos FMP <custos@fmp.com.br>",
      cfg?.remetente ?? "—",
    );
  },
);

comAmbiente(
  { SMTP_HOST: "smtp.exemplo.com", SMTP_USUARIO: "custos@fmp.com.br", SMTP_SENHA: "x", SMTP_PORTA: "465" },
  () => {
    ok("465 usa TLS implícito", configuracaoSmtp()?.seguro === true);
  },
);

// O defeito real: em muitos provedores o usuário do SMTP não é um endereço, e o
// padrão produzia `Custos FMP <custos01>` — recusado com "bad sender address
// syntax" no primeiro envio de verdade, depois de tudo parecer configurado.
comAmbiente(
  { SMTP_HOST: "smtp.exemplo.com", SMTP_USUARIO: "custos01", SMTP_SENHA: "x", SMTP_REMETENTE: undefined },
  () => {
    ok("usuário que NÃO é endereço não vira remetente", configuracaoSmtp()?.remetente === null);
  },
);

comAmbiente(
  {
    SMTP_HOST: "smtp.exemplo.com",
    SMTP_USUARIO: "custos01",
    SMTP_SENHA: "x",
    SMTP_REMETENTE: "Custos FMP <custos@fmp.com.br>",
  },
  () => {
    ok(
      "e aí o SMTP_REMETENTE declarado resolve",
      configuracaoSmtp()?.remetente === "Custos FMP <custos@fmp.com.br>",
    );
  },
);

console.log("\n— Escape do HTML do e-mail —");
// Uma descrição de custo com "<" viraria tag no cliente de e-mail.
ok(
  "sinais de tag são escapados",
  escapar('Contrato <Microsoft> & "Adobe"') === "Contrato &lt;Microsoft&gt; &amp; &quot;Adobe&quot;",
  escapar('Contrato <Microsoft> & "Adobe"'),
);
ok("o & vem primeiro, senão escaparia o próprio escape", escapar("&lt;") === "&amp;lt;");

console.log(falhas === 0 ? "\nTudo certo.\n" : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
