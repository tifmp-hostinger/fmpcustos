import { chromium } from "playwright";
import { SEMENTE } from "./semente.mjs";

/**
 * Teste de ponta a ponta da Etapa 5 — lote e fila de pendências.
 *
 * As perguntas: a seleção diz quanto dinheiro está em jogo antes de agir? A
 * fricção cresce com o tamanho do lote, em vez de ser sempre a mesma? O que
 * ficou de fora é declarado? E a revisão em sequência resolve doze pendências
 * sem doze idas e voltas?
 */
const URL = process.env.E2E_URL ?? "http://127.0.0.1:3340";
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

async function entrar(email) {
  await ctx.clearCookies();
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 10000 });
}

const caixas = () => p.locator('table tbody input[type="checkbox"]');
const barra = () => p.locator('[data-barra="selecao"]');

console.log("\n═══ SELEÇÃO ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
ok(
  "cada linha tem caixa de seleção",
  (await caixas().count()) === SEMENTE.ativos,
  `${await caixas().count()}`,
);

await caixas().nth(0).click();
await p.waitForTimeout(600);
const textoBarra = (await barra().innerText()).replace(/ /g, " ");
ok(
  "a barra aparece com a contagem",
  textoBarra.includes("1 custo selecionado"),
  textoBarra.split("\n")[0],
);
ok(
  "e diz quanto dinheiro está selecionado",
  /R\$ [\d.]+,\d{2}\/mês/.test(textoBarra),
  textoBarra.match(/R\$ [\d.]+,\d{2}\/mês/)?.[0] ?? "sem soma",
);

console.log("\n— Shift+clique estende a seleção —");
await caixas()
  .nth(5)
  .click({ modifiers: ["Shift"] });
await p.waitForTimeout(600);
const comShift = (await barra().innerText()).replace(/ /g, " ");
ok(
  "um Shift+clique marca o intervalo inteiro",
  comShift.includes("6 custos selecionados"),
  comShift.split("\n")[0],
);

console.log("\n— A soma vem do servidor, não da tela —");
const somaBarra =
  Number((comShift.match(/R\$ ([\d.]+),(\d{2})\/mês/) ?? []).slice(1).join("").replace(/\./g, "")) /
  100;
const somaLinhas = (
  await Promise.all(
    [0, 1, 2, 3, 4, 5].map(async (i) => {
      const celula = await p
        .locator("table tbody tr")
        .nth(i)
        .locator('[data-celula="mensal"]')
        .innerText();
      return Number(celula.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    }),
  )
).reduce((a, b) => a + b, 0);
ok(
  "a soma da barra bate com a das linhas marcadas",
  Math.abs(somaBarra - somaLinhas) < 0.02,
  `barra ${somaBarra} · linhas ${somaLinhas.toFixed(2)}`,
);

console.log("\n═══ FRICÇÃO PROPORCIONAL AO RISCO ═══");
console.log("  → até 4 itens: age direto, com Desfazer");
await p.reload();
await p.waitForSelector("table tbody tr");
await caixas().nth(0).click();
await caixas().nth(1).click();
await p.waitForTimeout(500);
await barra().locator('select[aria-label="Situação"]').selectOption({ label: "Em análise" });
await p.waitForSelector('[role="status"]', { timeout: 8000 });
const aviso2 = await p.locator('[role="status"]').innerText();
ok("dois itens mudam sem modal", (await p.locator('[role="alertdialog"]').count()) === 0);
ok("o aviso diz quantos mudaram", /2 custos em/.test(aviso2), aviso2.split("\n")[0]);
ok(
  "e oferece Desfazer",
  (await p.locator('[role="status"] button', { hasText: "Desfazer" }).count()) > 0,
);

console.log("  → o Desfazer devolve cada item ao SEU estado");
await p.locator('[role="status"] button', { hasText: "Desfazer" }).click();
await p.waitForTimeout(2000);
await p.goto(`${URL}/custos?f=analise`);
await p.waitForTimeout(600);
const emAnalise = await p.locator("table tbody tr").count();
ok("nenhum item ficou em análise depois de desfazer", emAnalise === 0, `${emAnalise} em análise`);

console.log("  → 5 ou mais: confirmação com a soma");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
await caixas().nth(0).click();
await caixas()
  .nth(6)
  .click({ modifiers: ["Shift"] });
await p.waitForTimeout(600);
await barra().locator('select[aria-label="Situação"]').selectOption({ label: "Em análise" });
await p.waitForSelector('[role="alertdialog"]', { timeout: 8000 });
const modal = (await p.locator('[role="alertdialog"]').innerText()).replace(/ /g, " ");
ok("sete itens exigem confirmação", modal.includes("7 custos"), modal.split("\n")[0]);
ok(
  "a confirmação mostra a soma em dinheiro",
  /R\$ [\d.]+,\d{2}\/mês/.test(modal),
  modal.match(/R\$ [\d.]+,\d{2}\/mês/)?.[0] ?? "",
);
ok(
  "e nomeia os custos em jogo",
  /Energia elétrica|Limpeza/.test(modal),
  modal.split("\n").slice(2, 3).join(""),
);

console.log("  → o foco não cai no botão de confirmar");
const focoModal = await p.evaluate(() => document.activeElement?.textContent?.trim());
ok("o foco abre em Cancelar, não em Confirmar", focoModal === "Cancelar", focoModal ?? "—");
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
ok("Esc fecha sem aplicar", (await p.locator('[role="alertdialog"]').count()) === 0);

console.log("\n═══ O QUE FICA DE FORA É DECLARADO ═══");
await entrar("ti@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
const doTi = await caixas().count();
await p.locator('thead input[type="checkbox"]').click();
await p.waitForTimeout(600);
const barraTi = await barra().innerText();
ok(
  "o gestor seleciona só o que é da área dele",
  barraTi.includes(`${doTi} custos selecionados`),
  barraTi.split("\n")[0],
);
ok(
  "e não vê a opção de mover entre setores",
  (await barra().locator('select[aria-label="Mover para setor"]').count()) === 0,
);

console.log("\n═══ EXPORTAR ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
await p.locator('thead input[type="checkbox"]').click();
await p.waitForTimeout(700);
const [download] = await Promise.all([
  p.waitForEvent("download", { timeout: 10000 }),
  barra().locator("button", { hasText: "Exportar" }).click(),
]);
const caminho = await download.path();
const conteudo = (await import("node:fs")).readFileSync(caminho, "utf8");
const linhasCsv = conteudo.trim().split("\r\n");
ok(
  "o CSV traz TODAS as linhas selecionadas, não só as 5 da prévia",
  linhasCsv.length === SEMENTE.ativos + 1,
  `${linhasCsv.length - 1} linhas + cabeçalho`,
);
ok(
  "com as colunas que a colagem lê de volta",
  linhasCsv[0].includes("Descrição") && linhasCsv[0].includes("Periodicidade"),
  linhasCsv[0].slice(0, 70),
);
ok(
  "e com BOM, para o Excel em português não estragar os acentos",
  conteudo.charCodeAt(0) === 0xfeff,
);

console.log("\n═══ REVISÃO EM SEQUÊNCIA ═══");
await p.goto(`${URL}/custos?f=pendencia&falta=data`);
await p.waitForSelector("table tbody tr");
const pendentes = await p.locator("table tbody tr").count();
const botaoRevisar = p.locator("button", { hasText: "Revisar em sequência" });
ok(
  "a fila oferece revisão em sequência",
  (await botaoRevisar.count()) > 0,
  await botaoRevisar.innerText().catch(() => "—"),
);

await botaoRevisar.click();
await p.waitForSelector('[role="dialog"]', { timeout: 8000 });
const painel = p.locator('[role="dialog"]');
ok("o painel lateral abre no primeiro item", (await painel.count()) === 1);
const contador = await painel.innerText();
ok(
  "com o contador do que falta",
  contador.includes(`faltam ${pendentes}`),
  contador.split("\n").find((l) => l.includes("faltam")) ?? "",
);
ok(
  "mostrando só o que falta neste item",
  contador.includes("Falta a data de renovação"),
  contador.split("\n").find((l) => l.startsWith("Falta")) ?? "",
);

const primeiroNome = (await painel.locator("h2").innerText()).trim();
await painel.locator('input[type="date"]').fill("2027-08-15");
await painel.locator("button", { hasText: "Salvar e ir ao próximo" }).click();
await p.waitForTimeout(1200);
const depoisDeSalvar = await painel.innerText();
ok(
  "gravar avança sozinho para o próximo custo",
  (await painel.locator("h2").innerText()).trim() !== primeiroNome,
  `${primeiroNome} → ${(await painel.locator("h2").innerText()).trim()}`,
);
ok(
  "e o contador desce sem a fila encolher embaixo de quem revisa",
  depoisDeSalvar.includes(`faltam ${pendentes - 1} de ${pendentes}`),
  depoisDeSalvar.split("\n").find((l) => l.includes("faltam")) ?? "",
);

console.log("  → navegar sem fechar o painel, mesmo com o cursor num campo");
const antesDaSeta = (await painel.locator("h2").innerText()).trim();
// O campo de data está com o foco: a seta pura pertence a ele (muda o dia), e
// é com Alt que se troca de item sem tirar as mãos do teclado.
await p.keyboard.press("ArrowDown");
await p.waitForTimeout(300);
ok(
  "↓ dentro do campo de data continua sendo do campo",
  (await painel.locator("h2").innerText()).trim() === antesDaSeta,
);
await p.keyboard.press("Alt+ArrowDown");
await p.waitForTimeout(400);
ok(
  "Alt+↓ vai para o próximo",
  (await painel.locator("h2").innerText()).trim() !== antesDaSeta,
  `${antesDaSeta} → ${(await painel.locator("h2").innerText()).trim()}`,
);
await p.locator('[role="dialog"] h2').click();
await p.keyboard.press("ArrowUp");
await p.waitForTimeout(400);
ok(
  "e ↑ pura funciona fora dos campos",
  (await painel.locator("h2").innerText()).trim() === antesDaSeta,
  (await painel.locator("h2").innerText()).trim(),
);
ok("o painel continua aberto", (await p.locator('[role="dialog"]').count()) === 1);
await p.keyboard.press("Escape");
await p.waitForTimeout(600);
ok("Esc fecha e volta para a lista", (await p.locator('[role="dialog"]').count()) === 0);

await p.goto(`${URL}/custos?f=pendencia&falta=data`);
await p.waitForTimeout(700);
const restam = await p.locator("table tbody tr").count();
ok("a pendência resolvida saiu da fila", restam === pendentes - 1, `${pendentes} → ${restam}`);

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
