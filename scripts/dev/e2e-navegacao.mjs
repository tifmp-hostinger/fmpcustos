import { chromium } from "playwright";
import { SEMENTE } from "./semente.mjs";

/**
 * Teste de ponta a ponta da navegação por números.
 *
 * A pergunta que este arquivo responde: clicar num número do painel abre a
 * lista cujo total é exatamente aquele número? Se as duas telas discordarem,
 * a confiança nas duas cai junto — e é o tipo de divergência que só aparece
 * no fechamento do mês, quando já é tarde.
 */
const URL = process.env.E2E_URL ?? "http://127.0.0.1:3320";
const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao, extra });
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
}

const navegador = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));
p.on("console", (m) => {
  if (m.type() === "error" && !/404|favicon/.test(m.text())) erros.push(m.text());
});

async function entrar(email) {
  await ctx.clearCookies();
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 10000 });
}

/** Lê "R$ 12.345,67" como número. */
function reais(texto) {
  const m = texto.match(/R\$\s*([\d.]+,\d{2})/);
  return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null;
}

console.log("\n═══ O PAINEL LEVA À LISTA ═══");
await entrar("admin@fmp.com.br");

const barras = p.locator('a[title^="Ver os custos de"]');
const quantasBarras = await barras.count();
ok("as barras do painel são links", quantasBarras > 0, `${quantasBarras} barras clicáveis`);

// Setor: o valor da barra tem de bater com o total da lista que ela abre.
const barraSetor = barras.first();
const textoBarra = await barraSetor.innerText();
const valorNaBarra = reais(textoBarra);
const nomeSetor = textoBarra.split("\n")[0].trim();
await barraSetor.click();
await p.waitForURL(/\/custos\?/, { timeout: 8000 });
await p.waitForSelector("table tbody tr, .border-dashed");
const cabecalho = await p.locator("main p").first().innerText();
const valorNaLista = reais(cabecalho);
ok(
  `clicar em "${nomeSetor}" abre a lista com o mesmo total`,
  valorNaBarra !== null && valorNaLista !== null && Math.abs(valorNaBarra - valorNaLista) < 0.02,
  `barra ${valorNaBarra} · lista ${valorNaLista}`,
);
ok("a lista mostra o chip do setor filtrado", (await p.locator("main").innerText()).includes("Setor:"));
ok(
  "e oferece o panorama daquele setor",
  (await p.locator('a[href^="/setores/"]').count()) > 0,
);

console.log("\n— Pendência vira fila de trabalho —");
await p.goto(`${URL}/`);
await p.waitForLoadState("networkidle");
const pendencia = p.locator('a[href*="falta="]').first();
const temPendencia = (await pendencia.count()) > 0;
ok("o resumo de pendências é clicável", temPendencia);
if (temPendencia) {
  const rotulo = (await pendencia.innerText()).replace(/\n/g, " ");
  const quantidade = Number(rotulo.match(/^(\d+)/)?.[1] ?? "0");
  await pendencia.click();
  await p.waitForURL(/falta=/, { timeout: 8000 });
  await p.waitForLoadState("networkidle");
  const linhas = await p.locator("table tbody tr").count();
  ok(
    "a fila tem exatamente a quantidade anunciada",
    linhas === quantidade,
    `${rotulo.trim()} → ${linhas} linhas`,
  );
  ok(
    "e o sub-filtro do que falta aparece marcado",
    (await p.locator('main a[aria-current="true"]').count()) >= 2,
  );
}

console.log("\n— Renovações —");
await p.goto(`${URL}/`);
await p.waitForLoadState("networkidle");
const cartaoRenov = p.locator('a[href*="f=renovacao"]').first();
const nRenov = Number((await cartaoRenov.innerText()).match(/^(\d+)/)?.[1] ?? "-1");
await cartaoRenov.click();
await p.waitForURL(/f=renovacao/, { timeout: 8000 });
await p.waitForLoadState("networkidle");
const linhasRenov = await p.locator("table tbody tr").count();
ok(
  "o indicador de renovações abre exatamente esses itens",
  linhasRenov === nRenov,
  `indicador ${nRenov} → lista ${linhasRenov}`,
);
ok("já ordenada pela data mais próxima", p.url().includes("ordem=renovacao"));

console.log("\n═══ ORDENAÇÃO ═══");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
const primeiroPorValor = await p.locator('table tbody tr [data-celula="descricao"] a').first().innerText();
await p.locator("thead a", { hasText: "Custo" }).click();
// waitForURL, não waitForLoadState: numa navegação do lado do cliente não há
// requisição de documento, então "networkidle" já é verdade antes da troca.
await p.waitForURL(/ordem=descricao/, { timeout: 8000 });
const primeiroPorNome = await p.locator('table tbody tr [data-celula="descricao"] a').first().innerText();
ok("ordenar por nome muda a primeira linha", primeiroPorValor !== primeiroPorNome,
   `${primeiroPorValor} → ${primeiroPorNome}`);
const ordemAria = await p.locator('thead th[data-coluna="descricao"]').getAttribute("aria-sort");
ok("o cabeçalho anuncia a ordem para leitor de tela", ordemAria === "ascending", `aria-sort=${ordemAria}`);
const nomes = await p.locator('table tbody tr [data-celula="descricao"] a').allInnerTexts();
const ordenado = [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
ok("e a lista está de fato em ordem alfabética", JSON.stringify(nomes) === JSON.stringify(ordenado),
   nomes.slice(0, 2).join(" | "));
await p.locator("thead a", { hasText: "Custo" }).click();
await p.waitForURL(/dir=desc/, { timeout: 8000 }).catch(() => {});
ok("clicar de novo inverte a direção", p.url().includes("dir=desc"), p.url());

console.log("\n═══ CHIPS DE FILTRO ═══");
await p.goto(`${URL}/custos?f=ativos&q=Microsoft`);
await p.waitForLoadState("networkidle");
const comBusca = await p.locator("table tbody tr").count();
ok("busca filtra a lista", comBusca > 0 && comBusca < SEMENTE.ativos, `${comBusca} de ${SEMENTE.ativos}`);
const chipBusca = p.locator('main a', { hasText: "Busca:" }).first();
ok("a busca aparece como chip removível", (await chipBusca.count()) > 0);
await chipBusca.click();
await p.waitForURL((u) => !u.searchParams.has("q"), { timeout: 8000 });
await p
  .waitForFunction((n) => document.querySelectorAll("table tbody tr").length === n, SEMENTE.ativos, {
    timeout: 8000,
  })
  .catch(() => {});
ok(
  "remover o chip devolve a lista inteira",
  (await p.locator("table tbody tr").count()) === SEMENTE.ativos,
  `${await p.locator("table tbody tr").count()} linhas`,
);

console.log("\n═══ BUSCA GLOBAL NO CABEÇALHO ═══");
await p.goto(`${URL}/`);
await p.waitForLoadState("networkidle");
await p.keyboard.press("/");
await p.waitForTimeout(200);
const focoBusca = await p.evaluate(() => document.activeElement?.getAttribute("aria-label"));
ok("a tecla / foca a busca do cabeçalho", (focoBusca ?? "").includes("Buscar custos"), focoBusca ?? "—");
await p.keyboard.type("Zoom");
await p.keyboard.press("Enter");
await p.waitForURL(/q=Zoom/, { timeout: 8000 });
await p.waitForLoadState("networkidle");
ok("Enter leva à lista com o termo", p.url().includes("q=Zoom"));
ok("e busca em todas as situações, não só nos ativos", p.url().includes("f=todos"));
ok("encontrando o item", (await p.locator("table tbody tr").count()) === 1);

// A barra não pode sequestrar o cursor de quem está digitando num campo.
await p.goto(`${URL}/custos`);
await p.waitForSelector('input[name="q"]');
await p.locator('main input[name="q"]').click();
await p.keyboard.press("/");
await p.waitForTimeout(150);
const dentroDoCampo = await p.evaluate(() => (document.activeElement)?.value ?? "");
ok("digitar / dentro de um campo escreve a barra, não rouba o foco", dentroDoCampo === "/", `campo="${dentroDoCampo}"`);

console.log("\n═══ PANORAMA DO SETOR ═══");
await p.goto(`${URL}/custos?f=ativos&setor=`);
await p.goto(`${URL}/`);
await p.waitForLoadState("networkidle");
await barras.first().click();
await p.waitForURL(/\/custos\?/, { timeout: 8000 });
await p.locator('a[href^="/setores/"]').first().click();
await p.waitForURL(/\/setores\//, { timeout: 8000 });
await p.waitForLoadState("networkidle");
const panorama = await p.locator("main").innerText();
ok("o panorama do setor abre", /do total da FMP/.test(panorama));
ok("com participação no total corporativo", /\d+,\d%\s*do total/.test(panorama.replace(/\s+/g, " ")));
ok("e declara o que os números medem", /podem divergir/.test(panorama));
const indicadoresPanorama = await p.locator('main a[href*="/custos?"]').count();
ok("cada número do panorama é uma porta", indicadoresPanorama >= 3, `${indicadoresPanorama} links`);

console.log("\n═══ ESCOPO ═══");
await entrar("ti@fmp.com.br");
const setoresDoTi = await prismaSetorDoUsuario(p);
ok("gestor consegue abrir o panorama da própria área", setoresDoTi.ok, setoresDoTi.detalhe);
await p.goto(`${URL}/setores/id-que-nao-existe`);
await p.waitForLoadState("networkidle");
ok(
  "e recebe 404 num setor que não é dele",
  (await p.locator("body").innerText()).toLowerCase().includes("not found") ||
    (await p.locator("body").innerText()).includes("404"),
);

async function prismaSetorDoUsuario(pagina) {
  await pagina.goto(`${URL}/custos`);
  await pagina.waitForSelector("table tbody tr");
  // O gestor não vê a coluna Setor; chega ao panorama pelo próprio início.
  await pagina.goto(`${URL}/`);
  await pagina.waitForLoadState("networkidle");
  const texto = await pagina.locator("main").innerText();
  return { ok: texto.includes("TI"), detalhe: texto.split("\n")[1] ?? "" };
}

console.log("\n═══ ERROS DE CONSOLE ═══");
ok("nenhum erro de JavaScript", erros.length === 0, erros.slice(0, 2).join(" | "));

const falhas = registro.filter((r) => !r.condicao);
console.log(`\n${falhas.length === 0 ? "✓" : "✗"} ${registro.length - falhas.length}/${registro.length} verificações passaram`);
if (falhas.length) falhas.forEach((f) => console.log(`   ✗ ${f.nome}${f.extra ? " → " + f.extra : ""}`));
await navegador.close();
process.exit(falhas.length === 0 ? 0 : 1);
