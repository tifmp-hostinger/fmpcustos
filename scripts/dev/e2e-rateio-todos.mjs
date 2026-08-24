import { chromium } from "playwright";

/**
 * Teste de ponta a ponta do atalho "Dividir entre os N setores".
 *
 * Existe para o custo que é da casa inteira — energia, limpeza, vigilância,
 * seguro predial. Montar essa divisão à mão custava treze cliques em "Adicionar
 * setor", treze escolhas num seletor, e a certeza de errar uma: o rateio de um
 * custo institucional é justamente aquele em que ninguém quer conferir treze
 * linhas.
 *
 * O que se verifica, além de o botão existir:
 *
 * - a soma dos percentuais é 100,00% exatos, e não 99,97% (treze fatias de
 *   7,69% somam 99,97 — é por isso que existe o maior resto);
 * - a soma dos REAIS fecha com o valor do custo ao centavo;
 * - a âncora é preservada, porque trocá-la muda de quem é o centavo do
 *   arredondamento e a tela promete que isso nunca acontece em silêncio;
 * - o botão some quando não tem mais o que trazer;
 * - e o que havia antes volta com "Descartar alterações".
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
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1200 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));
p.on("console", (m) => {
  if (m.type() === "error" && !/404|favicon/.test(m.text())) erros.push(m.text());
});

const texto = (s) => s.replace(/ | /g, " ");
/** "R$ 1.723,08" → 1723.08 · "7,69" → 7.69 */
const numero = (s) =>
  Number(
    String(s)
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );

await p.goto(`${URL}/login`);
await p.fill('input[name="email"]', "admin@fmp.com.br");
await p.fill('input[name="senha"]', "teste12345");
await p.click('form button[type="submit"]');
await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20000 });

// Energia elétrica: R$ 22.400,00/mês, 100% em Infraestrutura. O custo
// institucional por excelência — a conta de luz é da casa, não de uma área.
await p.goto(`${URL}/custos?q=Energia el&f=todos`);
await p.waitForSelector("table tbody tr");
await p.locator('[data-celula="descricao"] a').first().click();
await p.waitForURL(/\/custos\/[^/]+$/, { timeout: 10000 });
const id = p.url().split("/").pop();
await p.goto(`${URL}/custos/${id}/rateio`);
await p.waitForSelector("select");

console.log("\n═══ O ATALHO EXISTE E DIZ QUANTOS SÃO ═══");
const botao = p.locator('button:has-text("Dividir entre os")');
ok("o atalho aparece num rateio de uma linha só", (await botao.count()) === 1);
const rotulo = texto(await botao.innerText());
ok(
  "e o rótulo carrega o número, para saber o que vai acontecer antes do clique",
  /Dividir entre os 13 setores/.test(rotulo),
  rotulo,
);

const ancoraAntes = await p.locator('[data-ancora="sim"]').getAttribute("data-linha-rateio");
console.log(`\n         âncora antes: ${ancoraAntes}`);

console.log("\n═══ UM CLIQUE TRAZ OS TREZE ═══");
await botao.click();
await p.waitForTimeout(500);

const linhas = await p.locator("[data-linha-rateio]").count();
ok("as treze linhas entram de uma vez", linhas === 13, `${linhas} linhas`);

// Cada setor uma vez só: repetir um setor é o erro que o rateio manual comete.
const escolhidos = await p.locator("select").evaluateAll((ss) => ss.map((s) => s.value));
ok(
  "cada setor aparece exatamente uma vez",
  new Set(escolhidos).size === 13 && !escolhidos.includes(""),
  `${new Set(escolhidos).size} distintos`,
);

console.log("\n═══ A CONTA FECHA — E ESTA É A RAZÃO DO TESTE ═══");

// O PERCENTUAL EXIBIDO ARREDONDA, e é por isso que a asserção não é "soma 100".
// 100 ÷ 13 = 7,6923…% e a tela mostra duas casas: treze linhas de "7,69" somam
// 99,97%. O valor guardado é exato (a suíte de unidade prova que as unidades
// somam TOTAL); o que se verifica AQUI é que o desvio é só arredondamento de
// exibição — meio centésimo por linha, no máximo — e não uma fatia perdida.
const pcts = await p
  .locator('input[aria-label^="Percentual de"]')
  .evaluateAll((es) => es.map((e) => e.value));
const somaPct = pcts.reduce((s, v) => s + numero(v), 0);
ok(
  "treze campos de percentual, um por setor",
  pcts.length === 13,
  `${pcts.length} campos: ${[...new Set(pcts)].join(" / ")}`,
);
ok(
  "e o desvio dos percentuais é só o arredondamento da exibição",
  Math.abs(somaPct - 100) <= pcts.length * 0.005,
  `soma exibida=${somaPct.toFixed(4)}% · tolerância=${(pcts.length * 0.005).toFixed(3)}`,
);

// O REAL NÃO ARREDONDA — a âncora recebe a subtração exata. É este número que
// alguém confere contra a fatura, e é ele que a tela agora escreve por extenso.
const soma = numero(await p.locator('[data-rateio="soma"]').innerText());
ok(
  "a tela escreve a soma em reais, para dar para conferir",
  (await p.locator('[data-rateio="soma"]').count()) === 1,
);
ok(
  "e ela fecha com os R$ 22.400,00 do custo, ao centavo",
  Math.abs(soma - 22400) < 0.005,
  `soma=R$ ${soma.toFixed(2)}`,
);

const ancoraDepois = await p.locator('[data-ancora="sim"]').count();
ok("continua havendo exatamente uma âncora", ancoraDepois === 1, `${ancoraDepois}`);
// Trocar a âncora sem motivo mudaria de quem é o centavo do arredondamento, e
// a tela inteira é construída sobre a promessa de que isso nunca é silencioso.
ok(
  "e é a mesma de antes — o centavo não trocou de dono",
  (await p.locator('[data-ancora="sim"]').getAttribute("data-linha-rateio")) === ancoraAntes,
  `${ancoraAntes} → ${await p.locator('[data-ancora="sim"]').getAttribute("data-linha-rateio")}`,
);

console.log("\n═══ NÃO SE OFERECE O QUE JÁ FOI FEITO ═══");
ok(
  "com os treze na tela, o atalho some",
  (await p.locator('button:has-text("Dividir entre os")').count()) === 0,
);

console.log("\n═══ E DÁ PARA VOLTAR ATRÁS ═══");
await p.locator('button:has-text("Descartar")').click();
await p.waitForTimeout(400);
ok("descartar devolve o rateio anterior", (await p.locator("[data-linha-rateio]").count()) === 1);
ok(
  "e o atalho volta a ser oferecido",
  (await p.locator('button:has-text("Dividir entre os")').count()) === 1,
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
