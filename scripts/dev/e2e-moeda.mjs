import { chromium } from "playwright";
import { SEMENTE } from "./semente.mjs";

/**
 * Teste de ponta a ponta da moeda no cálculo.
 *
 * A pergunta central é uma só: **um custo em dólar entra no total da FMP pelo
 * real, ou pelo número que está escrito na fatura?** Até aqui era pelo número da
 * fatura — US$ 500 somava como R$ 500 — e o defeito era invisível justamente
 * porque a coluna dizia "R$" nos dois casos.
 *
 * As outras perguntas seguem dessa: o custo sem cotação some do total em
 * silêncio, ou aparece dizendo que está de fora? Registrar a cotação de hoje
 * reescreve o total do mês passado? E o formulário mostra a conversão enquanto
 * se digita, ou só depois de salvar?
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
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));
p.on("console", (m) => {
  if (m.type() === "error" && !/404|favicon/.test(m.text())) erros.push(m.text());
});

/** Normaliza o espaço fino que o Intl usa entre símbolo e número. */
const texto = (s) => s.replace(/ | /g, " ");

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
  await p.waitForTimeout(200);
  return texto((await p.locator('[role="status"]').first().innerText()).trim());
}

console.log("\n═══ A LISTA NÃO MISTURA MOEDAS ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos?q=Adobe Creative Cloud — 12&f=todos`);
await p.waitForSelector("table tbody tr");

const cobranca = texto(await p.locator('[data-celula="cobranca"]').first().innerText());
ok(
  "a coluna da cobrança fala a moeda do contrato",
  cobranca.includes("US$ 599,88"),
  cobranca.replace(/\n/g, " · "),
);

const mensal = texto(await p.locator('[data-celula="mensal"]').first().innerText());
// US$ 599,88 × 5,4321 = R$ 3.258,61.
ok(
  "a coluna do mensal fala real, convertido",
  mensal.includes("R$ 3.258,61"),
  mensal.replace(/\n/g, " · "),
);
ok("e diz por qual taxa converteu", mensal.includes("5,4321"), mensal.replace(/\n/g, " · "));

console.log("\n═══ SEM COTAÇÃO, O CUSTO NÃO SOME EM SILÊNCIO ═══");
await p.goto(`${URL}/custos?q=Zoom Business&f=todos`);
await p.waitForSelector("table tbody tr");
const zoomCobranca = texto(await p.locator('[data-celula="cobranca"]').first().innerText());
ok(
  "o valor em dólar continua visível",
  zoomCobranca.includes("US$ 9.990,00"),
  zoomCobranca.replace(/\n/g, " · "),
);

const semCotacao = p.locator('[data-falta="cambio"]').first();
ok("o mensal não é um travessão: é um link que diz o que falta", (await semCotacao.count()) === 1);
ok("e o link diz “sem cotação”", (await semCotacao.innerText()).includes("sem cotação"));

console.log("\n  → e a lista tem um recorte só para eles");
await p.goto(`${URL}/custos?f=pendencia&falta=cambio`);
await p.waitForTimeout(600);
const naFila = await p.locator("table tbody tr").count();
ok(
  "o recorte “sem cotação” encontra exatamente o que está fora do total",
  naFila === SEMENTE.semCotacao,
  `${naFila}, esperado ${SEMENTE.semCotacao}`,
);

console.log("\n═══ O TOTAL NÃO CONTA O QUE NÃO SABE CONVERTER ═══");
await p.goto(`${URL}/`);
await p.waitForLoadState("networkidle");
const painel = texto(await p.locator("main").innerText());
// Se o Zoom entrasse como R$ 9.990,00/ano = R$ 832,50/mês, o total mudaria.
// Ele está fora, e a tela diz isso em vez de deixar o buraco mudo.
ok(
  "a tela inicial avisa que um custo está fora dos totais",
  /sem cotação/i.test(painel),
  painel.split("\n").find((l) => /sem cotação/i.test(l)) ?? "—",
);

console.log("\n═══ CADASTRAR EM DÓLAR ═══");
await p.goto(`${URL}/custos/novo`);
await p.waitForSelector('input[name="descricao"]');
await p.fill('input[name="descricao"]', "Figma Organization — teste de moeda");
await p.fill('input[name="fornecedor"]', "Figma");
await p.fill('input[name="valorPeriodo"]', "450,00");

ok(
  "o campo de cotação só existe quando a moeda é estrangeira",
  (await p.locator('input[name="cambio"]').count()) === 0,
);

await p.selectOption('select[name="moeda"]', "USD");
await p.waitForTimeout(400);
ok(
  "escolher dólar revela o campo de cotação",
  (await p.locator('input[name="cambio"]').count()) === 1,
);

const sugerida = await p.inputValue('input[name="cambio"]');
ok("e já vem com a cotação registrada", sugerida === "5,4321", sugerida);

const previa = texto(await p.locator('[data-previa="mensal"]').innerText());
// US$ 450,00 × 5,4321 = R$ 2.444,45.
ok("a prévia converte enquanto se digita", previa.includes("R$ 2.444,45"), previa);
ok("e mostra o valor na moeda de origem também", previa.includes("US$ 450,00"), previa);

console.log("\n  → e recusa salvar com taxa ilegível, em vez de somar errado");
// Campo vazio é barrado pelo próprio navegador. O caso que só o servidor pega é
// o campo PREENCHIDO e ilegível — e é o que interessa, porque é por onde passa
// uma requisição forjada, uma importação, ou um dedo que escorregou.
await p.fill('input[name="cambio"]', "cinco reais");
await p.click('button:has-text("Cadastrar custo")');
const recusa = await proximoAviso();
ok(
  "cotação ilegível é recusada, e a frase repete o que foi digitado",
  /cinco reais/.test(recusa),
  recusa.replace(/\n/g, " · "),
);
const focado = await p.evaluate(() => document.activeElement?.getAttribute("name"));
ok("e o foco vai para o campo que falta", focado === "cambio", focado ?? "—");

// A recusa não pode custar o formulário inteiro. Este trecho existe porque o
// mecanismo que devolve o que foi digitado estava quebrado desde que nasceu:
// remontava os campos uma renderização ANTES de o resultado chegar, e por isso
// os remontava vazios. Errar um campo apagava os catorze.
ok(
  "o que foi digitado continua na tela",
  (await p.inputValue('input[name="valorPeriodo"]')) === "450,00",
  await p.inputValue('input[name="valorPeriodo"]'),
);
ok(
  "inclusive a moeda escolhida",
  (await p.inputValue('select[name="moeda"]')) === "USD",
  await p.inputValue('select[name="moeda"]'),
);
ok(
  "e a descrição",
  (await p.inputValue('input[name="descricao"]')).includes("Figma"),
  await p.inputValue('input[name="descricao"]'),
);

await p.fill('input[name="cambio"]', "5,50");
await p.click('button:has-text("Cadastrar custo")');
await p.waitForURL(/\/custos/, { timeout: 12000 });
await p.waitForTimeout(400);

await p.goto(`${URL}/custos?q=Figma Organization&f=todos`);
await p.waitForSelector("table tbody tr");
const figma = texto(await p.locator('[data-celula="mensal"]').first().innerText());
// US$ 450,00 × 5,50 = R$ 2.475,00.
ok(
  "salvo, ele entra no total pelo real",
  figma.includes("R$ 2.475,00"),
  figma.replace(/\n/g, " · "),
);
ok("com a taxa digitada, não a sugerida", figma.includes("5,5"), figma.replace(/\n/g, " · "));

console.log("\n═══ REGISTRAR COTAÇÃO NÃO REESCREVE O PASSADO ═══");
await p.goto(`${URL}/admin/cambio`);
await p.waitForSelector('input[name="taxa"]');
await p.fill('input[name="taxa"]', "6,1234");
await p.fill('input[name="fonte"]', "Teste automatizado");
await p.click('button:has-text("Registrar")');
const avisoCotacao = await proximoAviso();
ok("a cotação é registrada", /6,1234/.test(avisoCotacao), avisoCotacao.replace(/\n/g, " · "));
ok(
  "e o aviso diz explicitamente que nenhum custo mudou",
  /nenhum custo já cadastrado mudou/i.test(avisoCotacao),
  avisoCotacao.replace(/\n/g, " · "),
);

await p.goto(`${URL}/custos?q=Adobe Creative Cloud — 12&f=todos`);
await p.waitForSelector("table tbody tr");
const adobeDepois = texto(await p.locator('[data-celula="mensal"]').first().innerText());
ok(
  "o custo convertido ontem continua valendo o de ontem",
  adobeDepois.includes("R$ 3.258,61"),
  adobeDepois.replace(/\n/g, " · "),
);

console.log("\n  → mas o que está SEM taxa pode ser resolvido em lote");
await p.goto(`${URL}/admin/cambio`);
await p.waitForLoadState("networkidle");
const botaoLote = p.locator("button", { hasText: /^Converter \d+ custos? a / }).first();
ok(
  "o botão diz quantos vai tocar, e a que taxa",
  (await botaoLote.count()) === 1,
  texto(await botaoLote.innerText().catch(() => "—")),
);
await botaoLote.click();
const avisoLote = await proximoAviso(12000);
ok(
  "e o aviso diz o que a conversão comprou",
  /pass(aram|ou) a contar nos totais/i.test(avisoLote),
  avisoLote.replace(/\n/g, " · "),
);

await p.goto(`${URL}/custos?q=Zoom Business&f=todos`);
await p.waitForSelector("table tbody tr");
const zoomDepois = texto(await p.locator('[data-celula="mensal"]').first().innerText());
// US$ 9.990,00/ano × 6,1234 = R$ 61.172,77 no ano = R$ 5.097,73/mês.
ok(
  "o Zoom entrou no total, convertido e anualizado",
  zoomDepois.includes("R$ 5.097,73"),
  zoomDepois.replace(/\n/g, " · "),
);
ok("não sobrou ninguém sem cotação", (await p.locator('[data-falta="cambio"]').count()) === 0);

console.log("\n═══ A EXPORTAÇÃO NÃO REPETE O DEFEITO ═══");
await p.goto(`${URL}/custos?q=Adobe Creative Cloud — 12&f=todos`);
await p.waitForSelector("table tbody tr");
await p.locator('table tbody input[type="checkbox"]').first().check();
await p.waitForTimeout(500);

const somaBarra = texto(await p.locator('[data-barra="selecao"]').innerText());
ok("a barra soma a seleção em real", somaBarra.includes("R$ 3.258,61"), somaBarra.split("\n")[0]);

// O CSV é o arquivo que sai do sistema e vira planilha de novo. Sem coluna de
// moeda ele reproduz o defeito de origem lá fora: uma coluna de números em três
// moedas, somável por qualquer um que abra o arquivo no Excel.
const [baixado] = await Promise.all([
  p.waitForEvent("download", { timeout: 15000 }),
  p.locator('[data-barra="selecao"] button:has-text("Exportar")').click(),
]);
const caminho = await baixado.path();
const conteudo = (await import("node:fs")).readFileSync(caminho, "utf8");
const [cabecalho, primeira] = conteudo.split("\r\n");
ok("o CSV traz a moeda junto do valor", cabecalho.includes('"Moeda"'), cabecalho);
ok("e a cotação aplicada", cabecalho.includes('"Cotação"'), cabecalho);
ok(
  "e o valor mensal em real, já convertido",
  cabecalho.includes('"Valor mensal em real"'),
  cabecalho,
);
ok(
  "a linha exportada casa com a tela",
  primeira.includes('"USD"') && primeira.includes('"3258,61"'),
  primeira,
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
