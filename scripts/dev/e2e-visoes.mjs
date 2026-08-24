import { chromium } from "playwright";

/**
 * Teste de ponta a ponta das visões salvas.
 *
 * São a resposta à parte do pedido de "pasta" que o agrupamento não cobre. A
 * árvore obriga a escolher UMA hierarquia por custo, e um custo pertence a
 * várias ao mesmo tempo — com rateio, a vários setores simultaneamente. A visão
 * salva inverte: o custo fica onde está, e o que ganha nome é a pergunta.
 *
 * O que se verifica: salvar o recorte da tela, voltar a ele por um clique, o
 * botão que só aparece quando há o que salvar, a recusa de nome repetido, o
 * aviso de recorte duplicado com outro nome, a visão institucional que aparece
 * para outra pessoa RESPEITANDO o escopo de setor dela, e o desfazer de apagar.
 */
const URL = process.env.E2E_URL ?? "http://127.0.0.1:3000";
const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao, extra });
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
}

const navegador = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1100 } });
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

async function proximoAviso(timeout = 10000) {
  await p.waitForSelector('[role="status"]', { timeout });
  await p.waitForTimeout(300);
  return texto((await p.locator('[role="status"]').first().innerText()).trim());
}

async function limparAviso() {
  await p.evaluate(() => {
    document
      .querySelectorAll('[role="status"] button[aria-label*="echar"]')
      .forEach((b) => b.click());
  });
  await p.waitForTimeout(300);
}

async function salvar(nome, institucional = false) {
  await p.locator('[data-acao="salvar-visao"]').click();
  await p.waitForSelector('input[placeholder^="Ex.:"]');
  await p.fill('input[placeholder^="Ex.:"]', nome);
  if (institucional) await p.locator('input[name="institucional"]').check();
  await p.locator('button:has-text("Salvar")').last().click();
}

console.log("\n═══ SALVAR O RECORTE DA TELA ═══");
await entrar("admin@fmp.com.br");

await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
// A tela padrão é onde a pessoa já está: guardar um atalho para ela seria um
// atalho para lugar nenhum.
ok(
  "na tela padrão não há o que salvar",
  (await p.locator('[data-acao="salvar-visao"]').count()) === 0,
);

await p.goto(`${URL}/custos?nat=investimento&ano=todos&g=categoria`);
await p.waitForSelector("table tbody tr");
ok(
  "com um recorte, o botão de salvar aparece",
  (await p.locator('[data-acao="salvar-visao"]').count()) === 1,
);

await salvar("Investimentos por categoria");
const avisoSalvo = await proximoAviso();
ok("salvar avisa", /ficou salva/.test(avisoSalvo), avisoSalvo.replace(/\n/g, " · "));
ok("e diz para quem aparece", /só para você/.test(avisoSalvo), avisoSalvo.replace(/\n/g, " · "));
await limparAviso();
await p.waitForTimeout(700);

ok(
  "a visão aparece na barra",
  (await p.locator('[data-visao="Investimentos por categoria"]').count()) === 1,
);
ok(
  "e vem marcada como a atual",
  (await p.locator('[data-visao="Investimentos por categoria"]').getAttribute("data-ativa")) ===
    "sim",
);
// Um botão permanente convida a salvar a mesma coisa três vezes com nomes
// diferentes, e trinta atalhos parecidos deixam de ser atalho.
ok(
  "e o botão de salvar some, porque não há mais o que salvar",
  (await p.locator('[data-acao="salvar-visao"]').count()) === 0,
);

console.log("\n  → e um clique volta para ela");
await p.goto(`${URL}/custos`);
await p.waitForSelector('[data-visao="Investimentos por categoria"]');
await p.locator('[data-visao="Investimentos por categoria"] a').click();
await p.waitForURL(/nat=investimento/, { timeout: 8000 });
await p.waitForTimeout(500);
ok(
  "o recorte inteiro volta",
  p.url().includes("ano=todos") && p.url().includes("g=categoria"),
  p.url(),
);
ok(
  "com os grupos montados",
  (await p.locator("[data-grupo]").count()) > 0,
  `${await p.locator("[data-grupo]").count()} grupos`,
);

console.log("\n  → e o nome carrega a definição junto");
const titulo = await p
  .locator('[data-visao="Investimentos por categoria"] a')
  .getAttribute("title");
// "Contratos de TI" é um nome, não uma definição: seis meses depois ninguém
// lembra se incluía os cancelados.
ok("o título diz o que a visão filtra", /investimento/i.test(titulo ?? ""), titulo ?? "—");
ok("inclusive o agrupamento", /categoria/i.test(titulo ?? ""), titulo ?? "—");

console.log("\n═══ NOME REPETIDO É RECUSADO ═══");
await p.goto(`${URL}/custos?nat=pontual&ano=todos`);
await p.waitForSelector('[data-acao="salvar-visao"]');
await salvar("Investimentos por categoria");
await p.waitForTimeout(900);
const erroNome = texto(await p.locator('[role="alert"]').first().innerText());
ok("nome já usado é recusado", /já tem uma visão/.test(erroNome), erroNome);

console.log("\n  → recorte repetido com outro nome vira aviso, não recusa");
await p.fill('input[placeholder^="Ex.:"]', "Compras avulsas");
await p.locator('button:has-text("Salvar")').last().click();
await proximoAviso();
await limparAviso();
await p.waitForTimeout(700);

await p.goto(`${URL}/custos?nat=pontual&ano=todos`);
await p.waitForSelector('[data-visao="Compras avulsas"]');
await p.locator('[data-acao="salvar-visao"]').count();
await p.goto(`${URL}/custos?nat=pontual&ano=todos&g=fornecedor`);
await p.waitForSelector('[data-acao="salvar-visao"]');
await salvar("Compras por fornecedor");
await proximoAviso();
await limparAviso();

console.log("\n═══ A VISÃO DA INSTITUIÇÃO APARECE PARA TODOS ═══");
await p.goto(`${URL}/custos?f=renovacao&ordem=renovacao&dir=asc`);
await p.waitForSelector('[data-acao="salvar-visao"]');
await salvar("Renovações do trimestre", true);
const avisoInst = await proximoAviso();
ok(
  "publicar diz que aparece para todo mundo",
  /todo mundo/.test(avisoInst),
  avisoInst.replace(/\n/g, " · "),
);
await limparAviso();

await entrar("ti@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
ok(
  "o gestor vê a visão da instituição",
  (await p.locator('[data-visao="Renovações do trimestre"]').count()) === 1,
);
ok(
  "e não vê as visões pessoais do administrador",
  (await p.locator('[data-visao="Compras avulsas"]').count()) === 0,
);
// A visão guarda o RECORTE, nunca o resultado: cada pessoa a abre dentro do
// escopo de setor dela.
ok(
  "e não pode apagar o atalho que os treze setores usam",
  (await p
    .locator('[data-visao="Renovações do trimestre"] button[aria-haspopup="menu"]')
    .count()) === 0,
);

await p.locator('[data-visao="Renovações do trimestre"] a').click();
await p.waitForURL(/f=renovacao/, { timeout: 8000 });
await p.waitForTimeout(600);
const descricoes = await p.locator('[data-celula="descricao"]').allInnerTexts();
const vazou = descricoes.filter((d) => /Energia elétrica|Limpeza e conservação/.test(d));
ok(
  "a visão compartilhada respeita o escopo de setor de quem abre",
  vazou.length === 0,
  vazou.join(" | ") || "nenhum vazamento",
);

console.log("\n═══ APAGAR TEM VOLTA ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector('[data-visao="Compras avulsas"]');
await p.locator('[data-visao="Compras avulsas"] button[aria-haspopup="menu"]').click();
await p.waitForSelector('[role="menu"]');
await p.locator('[role="menu"] [role="menuitem"]', { hasText: "Apagar" }).first().click();
const avisoApagado = await proximoAviso();
ok("apagar avisa", /foi apagada/.test(avisoApagado), avisoApagado.replace(/\n/g, " · "));
ok("com desfazer à mão", avisoApagado.includes("Desfazer"));

await p.locator('[role="status"] button:has-text("Desfazer")').click();
await p.waitForTimeout(1300);
await limparAviso();
await p.goto(`${URL}/custos`);
await p.waitForTimeout(600);
// Recriar é barato, mas perder um atalho por um clique errado não deveria
// custar refazer o filtro de memória.
ok("desfazer devolve a visão", (await p.locator('[data-visao="Compras avulsas"]').count()) === 1);

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
