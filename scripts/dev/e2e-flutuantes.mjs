import { chromium, devices } from "playwright";

/**
 * Teste de ponta a ponta das ações flutuantes do celular.
 *
 * O que elas resolvem: numa lista, as duas coisas que alguém quer fazer são
 * incluir um item e recortá-la — e as duas moravam no topo da página, atrás de
 * uma rolagem inteira. Quem estava no décimo custo voltava ao começo para
 * filtrar.
 *
 * O que este arquivo protege, e que só quebra em silêncio:
 *
 * - os filtros somem do topo NO CELULAR e continuam no fluxo da página NO
 *   COMPUTADOR — é um nó só no DOM com duas aparências, e é fácil alguém
 *   duplicar a marcação e criar dois lugares que discordam;
 * - o distintivo conta o que está ativo, senão a folha esconderia estado e uma
 *   lista filtrada teria o mesmo botão de uma lista inteira;
 * - clicar num filtro NAVEGA e FECHA a folha (todo filtro é um `<Link>`; sem o
 *   fechamento, a pessoa fica olhando para a folha sem saber se pegou);
 * - a última linha da lista não fica atrás do disco vermelho;
 * - e nada disso faz a página rolar de lado.
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
const erros = [];

async function entrar(ctx) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erros.push(String(e)));
  p.on("console", (m) => {
    if (m.type() === "error" && !/404|favicon/.test(m.text())) erros.push(m.text());
  });
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', "admin@fmp.com.br");
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20000 });
  return p;
}

/**
 * VISÍVEL, e não "existe".
 *
 * Tudo aqui é escondido por CSS (`hidden sm:flex`, `sm:hidden`), então o nó
 * continua no DOM nas duas larguras e `count()` devolve 1 sempre. Contar nó em
 * vez de perguntar por visibilidade faria este arquivo passar mesmo se o
 * celular mostrasse os dois botões do topo — que é exatamente o defeito que ele
 * existe para pegar.
 */
async function visivel(loc) {
  return (await loc.count()) > 0 && (await loc.first().isVisible());
}

const botaoFiltros = 'button:has-text("Filtros")';
const disco = 'a[aria-label="Cadastrar custo"]';

console.log("\n═══ NO CELULAR ═══");
const cel = await navegador.newContext({ ...devices["iPhone 13"] });
const p = await entrar(cel);
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");

ok("o disco de cadastrar flutua", await visivel(p.locator(disco)));
ok("e o botão de filtros também", await visivel(p.locator(botaoFiltros)));
// O disco JÁ é o "cadastrar" da tela. Repetir no topo dá dois alvos para a
// mesma ação, e o de cima é o pior dos dois.
ok(
  "o botão do topo some, para não haver dois alvos para a mesma ação",
  !(await visivel(p.locator('main a:has-text("Cadastrar custo")'))),
);
// Não existe como selecionar um intervalo de planilha num celular.
ok(
  "e “Colar da planilha” também, porque um celular não sabe colar planilha",
  !(await visivel(p.locator('a:has-text("Colar da planilha")'))),
);
ok(
  "os filtros não ocupam mais o topo",
  !(await p.locator('nav[aria-label="Filtrar por situação"]').isVisible()),
);

console.log("\n  → e o cabeçalho continua dizendo o recorte por extenso");
// A folha só pode esconder o CONTROLE, nunca o ESTADO.
const cabecalho = (await p.locator('[data-contagem="itens"]').innerText()).replace(/ /g, " ");
ok("o recorte está escrito na tela", /ativos/.test(cabecalho), cabecalho.trim());

console.log("\n═══ A FOLHA ABRE, FILTRA E FECHA ═══");
await p.locator(botaoFiltros).click();
await p.waitForSelector('[role="dialog"]');
ok("a folha abre", await p.locator('[role="dialog"]').isVisible());
ok(
  "com os controles dentro",
  await p.locator('[role="dialog"] nav[aria-label="Filtrar por situação"]').isVisible(),
);
// Na página a faixa rola de lado; na folha há altura de sobra e ela quebra,
// senão "Excluídos" fica cortado na borda com espaço vazio embaixo.
const pilulas = p.locator('[role="dialog"] nav[aria-label="Filtrar por situação"] a');
const total = await pilulas.count();
const visiveis = [];
for (let i = 0; i < total; i++) {
  const c = await pilulas.nth(i).boundingBox();
  if (c && c.x >= 0 && c.x + c.width <= 390) visiveis.push(i);
}
ok(
  "e as pílulas quebram em linhas em vez de sair pela borda",
  visiveis.length === total,
  `${visiveis.length}/${total} inteiras na tela`,
);

await p.locator('[role="dialog"] a:has-text("Falta dado")').click();
await p.waitForURL(/f=pendencia/, { timeout: 10000 });
await p.waitForTimeout(600);
ok("clicar num filtro navega", p.url().includes("f=pendencia"), p.url());
// Sem isto a pessoa fica olhando para a folha sem saber se pegou.
ok("e a folha fecha sozinha", (await p.locator('[role="dialog"]').count()) === 0);

console.log("\n  → e o distintivo conta o que está ativo");
const comUm = (await p.locator(botaoFiltros).innerText()).replace(/\s+/g, " ").trim();
ok("com um recorte, o botão mostra 1", /Filtros 1$/.test(comUm), comUm);

await p.goto(`${URL}/custos?f=pendencia&q=microsoft&ano=todos`);
await p.waitForSelector(botaoFiltros);
const comDois = (await p.locator(botaoFiltros).innerText()).replace(/\s+/g, " ").trim();
ok("com dois, mostra 2", /Filtros 2$/.test(comDois), comDois);

await p.goto(`${URL}/custos`);
await p.waitForSelector(botaoFiltros);
const semNada = (await p.locator(botaoFiltros).innerText()).replace(/\s+/g, " ").trim();
// Um "0" permanente vira parte do rótulo e para de significar alguma coisa.
ok("e sem recorte nenhum não mostra número", semNada === "Filtros", semNada);

console.log("\n═══ O DISCO LEVA AO CADASTRO ═══");
await p.locator(disco).click();
await p.waitForURL(/\/custos\/novo/, { timeout: 10000 });
ok("o disco abre o cadastro", p.url().includes("/custos/novo"), p.url());

console.log("\n═══ NADA FICA ESCONDIDO ATRÁS DOS BOTÕES ═══");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(500);
const folga = await p.evaluate(() => {
  const linhas = [...document.querySelectorAll("table tbody tr")];
  const ultima = linhas[linhas.length - 1]?.getBoundingClientRect();
  const d = document.querySelector('a[aria-label="Cadastrar custo"]')?.getBoundingClientRect();
  return ultima && d ? Math.round(d.top - ultima.bottom) : null;
});
ok(
  "a última linha da lista termina acima do disco",
  folga !== null && folga >= 0,
  `${folga}px de folga`,
);

const rolou = await p.evaluate(() => {
  window.scrollTo(2000, 0);
  const x = Math.round(window.scrollX);
  window.scrollTo(0, 0);
  return x;
});
ok("e a página não rola de lado", rolou === 0, `${rolou}px`);

console.log("\n═══ NO COMPUTADOR, NADA DISSO EXISTE ═══");
const desk = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const d = await entrar(desk);
await d.goto(`${URL}/custos`);
await d.waitForSelector("table tbody tr");
ok("não há disco flutuante", !(await visivel(d.locator(disco))));
ok("nem botão de filtros", !(await visivel(d.locator(botaoFiltros))));
// O mesmo nó do DOM, na outra aparência: se alguém duplicar a marcação, é aqui
// que aparece.
ok(
  "e os filtros estão no fluxo da página",
  await d.locator('nav[aria-label="Filtrar por situação"]').isVisible(),
);
ok(
  "com os dois botões do topo de volta",
  (await visivel(d.locator('main a:has-text("Cadastrar custo")'))) &&
    (await visivel(d.locator('a:has-text("Colar da planilha")'))),
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
