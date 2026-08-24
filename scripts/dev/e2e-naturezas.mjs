import { chromium } from "playwright";
import { SEMENTE } from "./semente.mjs";

/**
 * Teste de ponta a ponta da divisão por natureza e do agrupamento.
 *
 * A pergunta que originou tudo isto: a tela de custos vai poluir com o tempo? O
 * diagnóstico foi que ela já estava poluída com 27 itens, porque respondia a
 * quatro perguntas numa coluna só — e o rodapé chegava a pedir desculpa por
 * divergir do painel.
 *
 * O que se verifica: cada aba mede na sua unidade; a aba padrão fecha com o
 * número do painel (a promessa de que todo número é uma porta); colunas que não
 * fazem sentido somem em vez de virar coluna de travessão; filtros que só
 * poderiam devolver vazio não são oferecidos; o exercício recorta o que se mede
 * por período; e o agrupamento fecha com o total.
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
/** "R$ 138.629,78" → 138629.78 */
const emNumero = (s) =>
  Number((s.match(/R\$\s*([\d.]+,\d\d)/)?.[1] ?? "0").replace(/\./g, "").replace(",", "."));

async function entrar(email) {
  await ctx.clearCookies();
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 10000 });
}

/**
 * Os rótulos das colunas, um por linha.
 *
 * O `<th>` ordenável carrega o triângulo da ordenação no mesmo nó, então o
 * texto vem como "TOTAL\n▼" — comparar com `includes("TOTAL")` numa lista
 * dessas falha por causa de um glifo, não por causa da coluna.
 */
const cabecalhos = async () =>
  (await p.locator("thead th").allInnerTexts()).map((c) => c.split("\n")[0].trim());

console.log("\n═══ CADA ABA MEDE NA SUA UNIDADE ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");

ok(
  "a lista abre em Recorrente, não em tudo misturado",
  (await p.locator('[data-aba="recorrente"]').getAttribute("aria-current")) === "page",
);

const tituloRecorrente = texto(await p.locator("main").innerText());
ok(
  "o total vem com /mês",
  /R\$\s*[\d.]+,\d\d\s*\/mês/.test(tituloRecorrente),
  tituloRecorrente.split("\n")[3],
);
// A projeção não é um segundo total: é o mesmo número na escala em que
// contratos são decididos.
ok("e com a projeção de 12 meses", /em 12 meses/.test(tituloRecorrente));

await p.goto(`${URL}/custos?nat=investimento`);
await p.waitForSelector("table tbody tr");
const tituloCapex = texto(await p.locator("main").innerText());
ok(
  "investimento mede período, não mês",
  !/\/mês/.test(tituloCapex.split("\n").slice(0, 6).join(" ")),
  tituloCapex.split("\n")[3],
);
ok("e diz de qual exercício", /em 20\d\d/.test(tituloCapex), tituloCapex.split("\n")[3]);

console.log("\n  → e a coluna acompanha a pergunta");
const colunasCapex = await cabecalhos();
// "Por mês" numa lista de compras é uma coluna inteira de travessões, e
// "Renova em" numa compra avulsa é uma pergunta sem resposta possível.
ok("some a coluna “Por mês”", !colunasCapex.includes("POR MÊS"), colunasCapex.join(" | "));
ok("some a coluna “Renova em”", !colunasCapex.includes("RENOVA EM"), colunasCapex.join(" | "));
ok("e entra “Aquisição”", colunasCapex.includes("AQUISIÇÃO"), colunasCapex.join(" | "));
ok("com “Total” no lugar do mensal", colunasCapex.includes("TOTAL"), colunasCapex.join(" | "));

console.log("\n═══ A ABA PADRÃO FECHA COM O PAINEL ═══");
await p.goto(`${URL}/`);
await p.waitForLoadState("networkidle");
const doPainel = emNumero(texto(await p.locator("main").innerText()));
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
const daLista = emNumero(texto(await p.locator("main").innerText()));
// Era exatamente esta divergência que o rodapé da lista explicava por escrito.
ok(
  "o total da lista é o mesmo do painel",
  daLista === doPainel && daLista > 0,
  `painel ${doPainel} · lista ${daLista}`,
);
ok(
  "e a nota que pedia desculpa pela divergência sumiu",
  !/de todas as naturezas/.test(texto(await p.locator("main").innerText())),
);

console.log("\n═══ NÃO SE OFERECE O QUE JÁ SE SABE QUE VAI NEGAR ═══");
await p.goto(`${URL}/custos?nat=pontual`);
await p.waitForSelector("main");
const chips = (await p.locator("main nav a, main a").allInnerTexts()).map((t) => t.trim());
ok(
  "“Renova em 90 dias” não aparece numa aba de compra avulsa",
  !chips.includes("Renova em 90 dias"),
  chips.filter((c) => /Renova|Ativos|Encerrados/.test(c)).join(" | "),
);

await p.goto(`${URL}/custos?nat=pontual&f=pendencia`);
await p.waitForSelector("main");
const faltas = texto(await p.locator("main").innerText());
ok("nem a lacuna “sem data de renovação”", !/sem data de renovação/.test(faltas));
ok("e sim “sem data de aquisição”", /sem data de aquisição/.test(faltas));

console.log("\n  → a pendência que só existe no que aconteceu uma vez");
await p.goto(`${URL}/custos?nat=investimento&f=pendencia&falta=aquisicao&ano=todos`);
await p.waitForTimeout(700);
const semData = await p.locator("table tbody tr").count();
ok(
  "o investimento sem data de aquisição é achável",
  semData === SEMENTE.semDataDeAquisicao,
  `${semData}, esperado ${SEMENTE.semDataDeAquisicao}`,
);

console.log("\n═══ O EXERCÍCIO RECORTA O QUE SE MEDE POR PERÍODO ═══");
await p.goto(`${URL}/custos?nat=pontual`);
await p.waitForSelector("table tbody tr");
const em2026 = await p.locator("table tbody tr").count();
ok(
  "o ano corrente é o padrão",
  em2026 === SEMENTE.pontuaisEm2026,
  `${em2026}, esperado ${SEMENTE.pontuaisEm2026}`,
);

await p.locator('main a:has-text("todos os anos")').click();
await p.waitForURL(/ano=todos/, { timeout: 8000 });
await p.waitForTimeout(600);
const todosAnos = await p.locator("table tbody tr").count();
ok(
  "e “todos os anos” alcança o resto",
  todosAnos === SEMENTE.pontuais,
  `${todosAnos}, esperado ${SEMENTE.pontuais}`,
);
ok(
  "o cabeçalho declara o escopo em vez de escondê-lo",
  /de todos os anos/.test(texto(await p.locator("main").innerText())),
);

console.log("\n═══ “TUDO” MOSTRA DOIS NÚMEROS, NUNCA UM ═══");
await p.goto(`${URL}/custos?nat=tudo`);
await p.waitForSelector("table tbody tr");
const tudo = texto(await p.locator("main").innerText());
// Somar compromisso mensal com gasto do exercício produz um número que não
// responde pergunta nenhuma. A tentação de somá-los é o defeito de origem.
ok("um número por mês", /\/mês em \d+ recorrentes/.test(tudo), tudo.split("\n")[3]);
ok("e outro do exercício", /em \d+ pontuais e investimentos/.test(tudo), tudo.split("\n")[3]);
const colunasTudo = await cabecalhos();
ok(
  "com a coluna de natureza, que só existe aqui",
  colunasTudo.includes("NATUREZA"),
  colunasTudo.join(" | "),
);

console.log("\n═══ AGRUPAR: A PASTA SEM O ARQUIVAR ═══");
await p.goto(`${URL}/custos?g=fornecedor`);
await p.waitForSelector("[data-grupo]");
const grupos = await p.locator("[data-grupo]").count();
ok("a lista se reorganiza em grupos", grupos > 1, `${grupos} grupos`);

// O subtotal é o que faz o agrupamento servir para conferir, e não só para
// enxugar a tela.
const subtotais = await p.evaluate(() =>
  [...document.querySelectorAll("[data-grupo] th")].map((e) => e.innerText),
);
const soma = subtotais.reduce((s, t) => {
  const v = t.match(/R\$\s*([\d.]+,\d\d)/);
  return v ? s + Number(v[1].replace(/\./g, "").replace(",", ".")) : s;
}, 0);
const totalDaTela = emNumero(texto(await p.locator("main").innerText()));
ok(
  "e os subtotais fecham com o total do cabeçalho",
  Math.abs(soma - totalDaTela) < 0.02,
  `grupos ${soma.toFixed(2)} · total ${totalDaTela.toFixed(2)}`,
);

console.log("\n  → e recolher é estado de tela, não recorte");
const primeiro = p.locator("[data-grupo] th button").first();
const antesDeFechar = await p.locator("table tbody tr").count();
await primeiro.click();
await p.waitForTimeout(400);
ok(
  "recolher esconde as linhas do grupo",
  (await p.locator("table tbody tr").count()) < antesDeFechar,
);
ok("sem mexer na URL", !p.url().includes("recolhido"), p.url());

console.log("\n  → não se agrupa por setor, e a ausência é deliberada");
const opcoes = await p.locator('select[data-controle="agrupar"] option').allInnerTexts();
// Um custo rateado 40/30/30 pertence a três setores ao mesmo tempo: agrupar por
// ele exigiria repetir a linha ou somar valor cheio num grupo que só tem 40%.
ok("só fornecedor e categoria", !opcoes.some((o) => /setor/i.test(o)), opcoes.join(" | "));

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
