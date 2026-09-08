import { chromium } from "playwright";

/**
 * Teste de ponta a ponta da colagem de planilha.
 *
 * Existia teste de unidade para o parser e nenhum para a tela, e foi na tela
 * que estava o defeito mais caro: a colagem gravava RECORRENTE em tudo, sem
 * coluna e sem escolha. Numa planilha de Marketing com 153 compras avulsas
 * isso somaria mais de um milhão de reais por mês ao custo recorrente da
 * fundação — cada brinde comprado uma vez virando mensalidade eterna.
 *
 * As perguntas deste arquivo:
 *
 *  1. A pessoa consegue dizer que aquilo é compra avulsa, e o sistema deduz
 *     quando ela não diz?
 *  2. A coluna "Vencimento" para de ser lida como data de renovação de
 *     contrato — e a pessoa é avisada de que ela ficou de fora, em vez de
 *     achar que o sistema não viu?
 *  3. O total confere contra a planilha de origem antes de gravar?
 *  4. E o que entra no banco é o que a prévia prometeu?
 *
 * Precisa de servidor de pé e base semeada por scripts/dev/semear-demo.ts.
 */
// localhost e não 127.0.0.1: o Next dev bloqueia origem cruzada por padrão e
// devolve 403 nos chunks de JavaScript, então a página carrega mas não hidrata
// e todo teste de interação falha sem dizer por quê.
const URL = process.env.E2E_URL ?? "http://localhost:3340";

const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao });
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
  // O aviso de <script> dentro de componente React é do listener delegado de
  // src/app/(app)/custos/aplicar.tsx — decisão deliberada, documentada lá, para
  // o filtro aplicar sem um componente por controle. Não é regressão desta tela.
  if (m.type() === "error" && !/404|favicon|Encountered a script tag/.test(m.text())) {
    erros.push(m.text());
  }
});

// Uma planilha com a forma da que o Marketing realmente mandou: coluna
// VENCIMENTO com data de boleto, e uma compra avulsa junto das assinaturas.
// A coluna Aquisição existe para a compra avulsa cair num exercício: a aba
// Pontual é recortada por ano, e sem data de aquisição o item não cabe em ano
// nenhum — que é exatamente o que o aviso "vai aparecer como pendência" diz.
const COLAGEM = [
  "Descrição\tFornecedor\tValor\tPeriodicidade\tAquisição\tVencimento",
  "Ecobag preta — Cidade da Advocacia\tInova Gifts\t27.000,00\tÚnico\t15/08/2026\t10/08/2026",
  "Assinatura de clipping\tImprensa Já\t1.250,00\tMensal\t\t10/09/2026",
  "Anuidade de repositório\tRepo Brasil\t4.800,00\tAnual\t\t01/03/2027",
].join("\n");
const TOTAL_DA_PLANILHA = "33.050,00"; // 27.000 + 1.250 + 4.800

try {
  await p.goto(`${URL}/login`, { waitUntil: "networkidle" });
  await p.fill('input[name="email"]', "admin@fmp.com.br");
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

  await p.goto(`${URL}/custos/colar`, { waitUntil: "networkidle" });
  ok("a tela de colar abre", p.url().includes("/custos/colar"));

  await p.fill("textarea", COLAGEM);
  await p.waitForTimeout(600);

  const corpo = await p.textContent("body");

  // --- 1. os campos novos existem -----------------------------------------
  ok("existe seletor de Natureza", corpo.includes("Natureza"));
  ok("existe seletor de Começou em", corpo.includes("Começou em"));

  // --- 2. "Vencimento" não é adivinhada, e o aviso explica ----------------
  ok(
    "avisa que a coluna Vencimento ficou de fora",
    corpo.includes("Vencimento") && corpo.includes("data do boleto"),
  );
  ok(
    "e diz o que fazer se for o fim do contrato",
    corpo.includes("aponte esta coluna"),
    "recado presente",
  );

  // --- 3. natureza derivada da periodicidade ------------------------------
  const linhas = await p.$$eval("tbody tr", (trs) =>
    trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim())),
  );
  const daEcobag = linhas.find((c) => c.some((t) => t.includes("Ecobag")));
  const doClipping = linhas.find((c) => c.some((t) => t.includes("clipping")));
  ok(
    "pagamento único aparece como compra avulsa na prévia",
    Boolean(daEcobag?.some((t) => t.includes("Pontual"))),
    daEcobag?.join(" | ") ?? "linha não encontrada",
  );
  ok(
    "mensal segue como recorrente",
    Boolean(doClipping?.some((t) => t.includes("Recorrente"))),
    doClipping?.join(" | ") ?? "linha não encontrada",
  );
  ok(
    "e a compra avulsa não recebeu data de renovação",
    Boolean(daEcobag) && !daEcobag.some((t) => t.includes("10/08/2026")),
    daEcobag?.join(" | ") ?? "",
  );
  ok(
    "com Aquisição preenchida, o aviso de pendência não aparece",
    Boolean(daEcobag) && !daEcobag.some((t) => t.includes("pendência")),
    daEcobag?.join(" | ") ?? "",
  );

  // --- 4. o rodapé confere o dinheiro -------------------------------------
  ok("o rodapé mostra a soma do que vai entrar", corpo.includes("Soma do que vai entrar"));
  ok(
    "e a soma está correta",
    corpo.includes("33.050,00"),
    corpo.match(/Soma do que vai entrar[\s\S]{0,80}/)?.[0]?.replace(/\s+/g, " ") ?? "",
  );

  const campoTotal = p.locator('input[aria-label*="Total que a sua planilha"]');
  await campoTotal.fill(TOTAL_DA_PLANILHA);
  await p.waitForTimeout(300);
  ok("com o total certo, diz que bate", (await p.textContent("body")).includes("bate"));

  await campoTotal.fill("30.000,00");
  await p.waitForTimeout(300);
  const comErro = await p.textContent("body");
  ok(
    "com o total errado, diz quanto difere",
    comErro.includes("difere") && comErro.includes("3.050,00"),
    comErro.match(/difere[^<]{0,30}/)?.[0] ?? "",
  );
  ok(
    "e explica que costuma ser a coluna de valor",
    comErro.includes("coluna de valor apontada"),
  );
  await campoTotal.fill("");

  // --- 5. o que entra no banco é o que a prévia prometeu ------------------
  await p.click('button[type="submit"]:has-text("Importar")');
  await p.waitForTimeout(2500);
  const depois = await p.textContent("body");
  ok("a importação conclui", /custos importados|custo importado/.test(depois), "");

  // A natureza não é um filtro entre outros: é o que a página é
  // (src/lib/filtros.ts:39). Compra avulsa vive na aba Pontual, e é justamente
  // isso que este teste precisa provar — antes desta versão a ecobag teria ido
  // para a aba Recorrente, somando R$ 27.000,00 por mês ao custo da fundação.
  await p.goto(`${URL}/custos?nat=pontual&f=analise`, { waitUntil: "networkidle" });
  ok("a compra avulsa aparece na aba Pontual", (await p.textContent("body")).includes("Ecobag"));

  await p.goto(`${URL}/custos?f=analise`, { waitUntil: "networkidle" });
  const recorrentes = await p.textContent("body");
  ok(
    "e NÃO aparece na aba Recorrente",
    !recorrentes.includes("Ecobag"),
    "é o defeito que esta versão corrige",
  );
  ok("as assinaturas, sim, aparecem na Recorrente", recorrentes.includes("Assinatura de clipping"));

  ok("nenhum erro de JavaScript na página", erros.length === 0, erros.slice(0, 2).join(" | "));
} catch (e) {
  ok(`exceção: ${String(e).slice(0, 200)}`, false);
} finally {
  await navegador.close();
}

const falhas = registro.filter((r) => !r.condicao).length;
console.log(
  falhas === 0
    ? `\n✓ ${registro.length} casos passaram\n`
    : `\n✗ ${falhas} de ${registro.length} falharam\n`,
);
process.exit(falhas === 0 ? 0 : 1);
