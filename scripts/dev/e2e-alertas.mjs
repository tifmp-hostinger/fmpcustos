import { chromium } from "playwright";

/**
 * Teste de ponta a ponta dos alertas.
 *
 * A pergunta que originou tudo isto: **o sistema avisa, ou espera que alguém
 * lembre de olhar?** Até aqui esperava — o modelo `Alerta` existia desde o
 * primeiro esquema e nunca teve uma linha.
 *
 * O que se verifica: os alertas nascem da varredura e não de um clique; cada um
 * carrega o dinheiro que está em jogo; a lista respeita o escopo de setor; a
 * urgência sobe conforme a data se aproxima; reconhecer não é resolver; e o
 * alerta some sozinho quando o dado que faltava é preenchido — que é a única
 * coisa que impede a lista de virar cemitério.
 *
 * Também cobre o guarda da rota de rotina, que é a peça que ninguém olha até
 * vazar: sem token, com token errado e com token certo.
 */
const URL = process.env.E2E_URL ?? "http://127.0.0.1:3000";
const TOKEN = process.env.E2E_ROTINAS_TOKEN ?? "";
const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao, extra });
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
}

const navegador = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));
p.on("console", (m) => {
  if (m.type() === "error" && !/404|favicon/.test(m.text())) erros.push(m.text());
});

const texto = (s) => s.replace(/ | /g, " ");

async function entrar(email) {
  await ctx.clearCookies();
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 10000 });
}

async function proximoAviso(timeout = 8000) {
  await p.waitForSelector('[role="status"]', { timeout });
  await p.waitForTimeout(250);
  return texto((await p.locator('[role="status"]').first().innerText()).trim());
}

console.log("\n═══ A ROTA DA ROTINA É FECHADA ═══");
const semToken = await fetch(`${URL}/api/rotinas/alertas`, { method: "POST" });
ok("sem token, 401", semToken.status === 401, String(semToken.status));

const tokenErrado = await fetch(`${URL}/api/rotinas/alertas`, {
  method: "POST",
  headers: { authorization: "Bearer nao-e-o-token-certo-mas-tem-tamanho" },
});
ok("token errado, 401", tokenErrado.status === 401, String(tokenErrado.status));

const porGet = await fetch(`${URL}/api/rotinas/alertas`, {
  method: "GET",
  headers: { authorization: `Bearer ${TOKEN}` },
});
// GET não pode escrever no banco: qualquer pré-carregamento de link ou robô que
// passe pela URL dispararia a rotina.
ok("GET não roda a rotina", porGet.status === 405 || porGet.status === 404, String(porGet.status));

const comToken = await fetch(`${URL}/api/rotinas/alertas`, {
  method: "POST",
  headers: { authorization: `Bearer ${TOKEN}` },
});
const varredura = await comToken.json();
ok("com o token certo, a varredura roda", comToken.status === 200, String(comToken.status));
ok(
  "e devolve o que fez",
  typeof varredura.detalhe?.criados === "number",
  JSON.stringify(varredura.detalhe),
);
ok(
  "criou alertas na base recém-semeada",
  varredura.detalhe.criados > 0,
  `${varredura.detalhe.criados}`,
);

console.log("\n  → rodar de novo não duplica");
const segunda = await fetch(`${URL}/api/rotinas/alertas`, {
  method: "POST",
  headers: { authorization: `Bearer ${TOKEN}` },
});
const repetida = await segunda.json();
// A rotina roda todo dia. Trinta dias de execução não podem virar trinta
// alertas iguais para o mesmo contrato.
ok(
  "segunda varredura não cria nada",
  repetida.detalhe.criados === 0,
  `${repetida.detalhe.criados}`,
);

console.log("\n═══ A LISTA DE ALERTAS ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/alertas`);
await p.waitForSelector("[data-alerta]");

const total = await p.locator("[data-alerta]").count();
ok("os alertas aparecem na tela", total > 0, `${total} alertas`);

// `:visible` e não `.first()`: a navegação existe duas vezes no HTML — a
// barra do topo e a do rodapé do telefone — e o CSS mostra uma de cada vez.
// Contar posições aqui daria certo hoje e quebraria no dia em que a ordem
// mudasse; o que se quer afirmar é sobre o contador que a pessoa ENXERGA.
const contador = await p
  .locator('nav a[href="/alertas"] span[aria-label$="pendentes"]:visible')
  .innerText();
ok("o menu mostra quantos esperam decisão", Number(contador) > 0, contador);

const renovacao = p.locator('[data-alerta="RENOVACAO_PROXIMA"]').first();
const textoRenovacao = texto(await renovacao.innerText());
ok(
  "o alerta de renovação diz em quantos dias",
  /renova em \d+ dias|vence hoje/.test(textoRenovacao),
  textoRenovacao.split("\n").find((l) => /renova|vence/.test(l)) ?? "—",
);
// O dinheiro é o que faz alguém parar: "vence" é aviso, "R$ 45.600,00 no ano" é
// decisão.
ok(
  "e quanto custa deixar passar",
  /R\$\s*[\d.]+,\d\d\s+no ano/.test(textoRenovacao),
  textoRenovacao.split("\n").find((l) => l.includes("R$")) ?? "—",
);

const semCotacao = p.locator('[data-alerta="CAMBIO_AUSENTE"]').first();
ok("o custo em dólar sem cotação virou alerta", (await semCotacao.count()) === 1);
ok(
  "e o alerta diz a consequência, não só o fato",
  texto(await semCotacao.innerText()).includes("não entra em nenhum total"),
);

console.log("\n  → ordenado por urgência, não por data");
const severidades = await p.evaluate(() =>
  [...document.querySelectorAll("[data-alerta]")].map((e) =>
    e.className.includes("--accent)]/40") ? 1 : 0,
  ),
);
const primeiroFraco = severidades.indexOf(0);
const ultimoForte = severidades.lastIndexOf(1);
ok(
  "os urgentes vêm todos antes dos demais",
  primeiroFraco === -1 || ultimoForte === -1 || ultimoForte < primeiroFraco,
  `urgentes até ${ultimoForte}, primeiro comum em ${primeiroFraco}`,
);

console.log("\n═══ RECONHECER NÃO É RESOLVER ═══");
const antes = await p.locator('[data-status="ABERTO"]').count();
await p
  .locator('[data-status="ABERTO"]')
  .first()
  .locator('button:has-text("Marcar como visto")')
  .click();
const avisoVisto = await proximoAviso();
ok("marcar como visto avisa", /visto/i.test(avisoVisto), avisoVisto.replace(/\n/g, " · "));

await p.waitForTimeout(900);
const depois = await p.locator('[data-status="ABERTO"]').count();
ok("saiu da fila do dia", depois === antes - 1, `${antes} → ${depois}`);
// Continua na tela, apagado: quem reconheceu por engano precisa achar de volta.
ok("mas continua visível, marcado", (await p.locator('[data-status="RECONHECIDO"]').count()) >= 1);
ok(
  "e diz que está em andamento, não resolvido",
  texto(await p.locator('[data-status="RECONHECIDO"]').first().innerText()).includes(
    "visto, em andamento",
  ),
);

console.log("\n  → e não existe botão de “resolvido”");
const botoes = (await p.locator("[data-alerta] button").allInnerTexts()).map((t) =>
  t.toLowerCase(),
);
ok(
  "nenhum botão diz resolver",
  !botoes.some((b) => b.includes("resolv")),
  botoes.slice(0, 4).join(" | "),
);

console.log("\n═══ IGNORAR SAI DA LISTA, MAS NÃO SOME ═══");
await p
  .locator('[data-status="ABERTO"]')
  .first()
  .locator('button:has-text("Não se aplica")')
  .click();
await proximoAviso();
await p.waitForTimeout(900);
const linkIgnorados = p.locator('a[href*="v=ignorados"]');
ok("a tela conta quantos foram ignorados", (await linkIgnorados.count()) === 1);
await linkIgnorados.click();
await p.waitForURL(/v=ignorados/, { timeout: 8000 });
await p.waitForSelector("[data-alerta]");
ok("e eles têm tela própria", (await p.locator('[data-status="IGNORADO"]').count()) >= 1);
ok("com botão de reabrir", (await p.locator('button:has-text("Reabrir")').count()) >= 1);

console.log("\n═══ RESOLVER O CUSTO APAGA O ALERTA ═══");
await p.goto(`${URL}/alertas`);
await p.waitForSelector('[data-alerta="CAMBIO_AUSENTE"]');
const alvo = p.locator('[data-alerta="CAMBIO_AUSENTE"]').first();
await alvo.locator("a").first().click();
await p.waitForURL(/\/custos\//, { timeout: 10000 });
await p.waitForSelector('input[name="cambio"]');
ok(
  "o alerta leva direto ao custo que o causou",
  (await p.locator('input[name="cambio"]').count()) === 1,
);

await p.fill('input[name="cambio"]', "5,4321");
await p.click('button:has-text("Salvar alterações")');
await p.waitForURL(/\/custos(\?|$)/, { timeout: 12000 });

const revarrer = await fetch(`${URL}/api/rotinas/alertas`, {
  method: "POST",
  headers: { authorization: `Bearer ${TOKEN}` },
});
const apos = await revarrer.json();
// Sem isto a lista vira cemitério: acumula o que já foi resolvido, as pessoas
// param de ler, e o alerta que importava passa junto com o lixo.
ok(
  "a varredura resolve o que deixou de ser verdade",
  apos.detalhe.resolvidos >= 1,
  `${apos.detalhe.resolvidos}`,
);

await p.goto(`${URL}/alertas`);
await p.waitForTimeout(700);
ok(
  "e o alerta sumiu da lista sozinho",
  (await p.locator('[data-alerta="CAMBIO_AUSENTE"]').count()) === 0,
);

console.log("\n═══ CADA UM VÊ OS SEUS ═══");
await entrar("ti@fmp.com.br");
await p.goto(`${URL}/alertas`);
await p.waitForTimeout(700);
const setoresVistos = await p.evaluate(() =>
  [...document.querySelectorAll("[data-alerta]")].map((e) => e.innerText.split("\n")[0]),
);
const vazou = setoresVistos.filter((t) => t.includes("Financeiro") || t.includes("Jurídico"));
ok(
  "o gestor de TI não vê alerta de outro setor",
  vazou.length === 0,
  vazou.slice(0, 2).join(" | "),
);
ok("mas vê os da própria área", setoresVistos.length > 0, `${setoresVistos.length} alertas`);

console.log("\n═══ O RESUMO SEMANAL PODE SER DESLIGADO ═══");
const caixa = p.locator('input[name="resumoSemanal"]');
ok("a opção fica ao alcance de quem acabou de ler os alertas", (await caixa.count()) === 1);
ok("e vem ligada para quem pode agir", await caixa.isChecked());
await caixa.uncheck();
const avisoResumo = await proximoAviso();
ok(
  "desligar diz o que continua funcionando",
  /alertas continuam nesta tela/i.test(avisoResumo),
  avisoResumo.replace(/\n/g, " · "),
);

console.log("\n═══ ERROS DE CONSOLE ═══");
ok("nenhum erro de JavaScript", erros.length === 0, erros.slice(0, 2).join(" | "));

const falhas = registro.filter((r) => !r.condicao);
console.log(
  `\n${falhas.length === 0 ? "✓" : "✗"} ${registro.length - falhas.length}/${registro.length} verificações passaram`,
);
if (falhas.length)
  falhas.forEach((f) => console.log(`   ✗ ${f.nome}${f.extra ? " → " + f.extra : ""}`));
await navegador.close();
process.exit(falhas.length === 0 ? 0 : 1);
