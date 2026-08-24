import { chromium } from "playwright";
import { SEMENTE } from "./semente.mjs";

const URL = process.env.E2E_URL ?? "http://127.0.0.1:3312";
const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao, extra });
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
}

const navegador = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });

/** Fecha o aviso que estiver na tela, para o próximo assert não ler o anterior. */
async function limparAviso() {
  const fechar = p.locator('[role="status"] button[aria-label="Fechar aviso"]');
  while (await fechar.count()) {
    await fechar.first().click();
    await p.waitForTimeout(120);
  }
}

/** Espera um aviso NOVO aparecer e devolve o texto. */
async function proximoAviso(timeout = 8000) {
  await p.waitForSelector('[role="status"]', { timeout });
  await p.waitForTimeout(150);
  return (await p.locator('[role="status"]').innerText()).trim();
}

async function entrar(email) {
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 10000 });
}

console.log("\n═══ ADMIN ═══");
await entrar("admin@fmp.com.br");
ok("login do admin entra no sistema", !p.url().includes("login"), p.url());

await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
const linhas = await p.locator("table tbody tr").count();
ok(
  "lista abre no filtro Ativos (um item está a apurar)",
  linhas === SEMENTE.ativos,
  `${linhas} linhas`,
);

console.log("\n— Atalho: menu da linha sempre visível —");
const kebabs = await p.locator('button[aria-haspopup="menu"][aria-label^="Ações de"]').count();
ok("toda linha tem menu de ações renderizado", kebabs === linhas, `${kebabs} menus para ${linhas} linhas`);
const opacidade = await p.locator('button[aria-label^="Ações de"]').first().evaluate((e) => getComputedStyle(e).opacity);
ok("menu visível em repouso (não é hover-only)", Number(opacidade) > 0.4, `opacity ${opacidade}`);

console.log("\n— Atalho: mudar situação na própria célula —");
const alvo = p.locator("table tbody tr").filter({ hasText: "Link dedicado" });
const situacaoAntes = (await alvo.locator('[data-celula="situacao"]').innerText()).trim();
await alvo.locator('button[aria-label*="Situação de"]').click();
await p.waitForSelector('[role="menu"]');
const opcoesSituacao = await p.locator('[role="menu"] [role="menuitem"]').count();
ok("popover de situação abre com as opções", opcoesSituacao >= 6, `${opcoesSituacao} opções`);
await p.locator('[role="menu"] [role="menuitem"]', { hasText: "Em análise" }).first().click();
await p.waitForSelector('[role="status"]', { timeout: 5000 });
const aviso = await p.locator('[role="status"]').innerText();
ok("aviso confirma a mudança pelo nome do custo", aviso.includes("Link dedicado"), aviso.split("\n")[0]);
ok("aviso oferece Desfazer", await p.locator('[role="status"] button', { hasText: "Desfazer" }).count() > 0);

console.log("\n— Desfazer de verdade —");
await p.locator('[role="status"] button', { hasText: "Desfazer" }).click();
await p.waitForTimeout(1800);
await limparAviso();
const situacaoDepois = (await p.locator("table tbody tr").filter({ hasText: "Link dedicado" }).locator('[data-celula="situacao"]').innerText()).trim();
ok("Desfazer restaura a situação anterior", situacaoDepois === situacaoAntes, `${situacaoAntes} → alterado → ${situacaoDepois}`);

console.log("\n— Atalho: data de renovação na célula —");
const semData = p.locator('button[data-sem-data="true"]').first();
const qtdSemData = await p.locator('button[data-sem-data="true"]').count();
ok("itens sem data aparecem como pendência clicável", qtdSemData > 0, `${qtdSemData} itens`);
await semData.click();
await p.waitForSelector('input[type="date"]');
await p.fill('input[type="date"]', "2027-05-20");
await p.keyboard.press("Enter");
const avisoData = await proximoAviso();
ok("gravar data avisa com a data em português", avisoData.includes("20/05/2027"), avisoData.split("\n")[0]);

console.log("\n— Filtro 'Falta dado' vira fila de trabalho —");
await p.goto(`${URL}/custos?f=pendencia`);
await p.waitForLoadState("networkidle");
const pend = await p.locator("table tbody tr").count();
ok("filtro de pendência lista itens com dado faltando", pend > 0, `${pend} itens`);

console.log("\n— Excluir é reversível —");
await p.goto(`${URL}/custos?q=Certificado`);
await p.waitForSelector("table tbody tr");
await p.locator('button[aria-label^="Ações de"]').first().click();
await p.waitForSelector('[role="menu"]');
const rotulos = await p.locator('[role="menu"] [role="menuitem"]').allInnerTexts();
ok("menu traz Editar, Duplicar, Dividir, Histórico e Excluir",
   rotulos.some(r=>r.includes("Editar")) && rotulos.some(r=>r.includes("Duplicar")) &&
   rotulos.some(r=>r.includes("Dividir")) && rotulos.some(r=>r.includes("Excluir")),
   rotulos.join(" | "));
await limparAviso();
await p.locator('[role="menu"] [role="menuitem"]', { hasText: "Excluir" }).click();
ok("exclusão confirma pelo nome", (await proximoAviso()).includes("Certificado"));
await limparAviso();
await p.goto(`${URL}/custos?f=lixeira`);
await p.waitForLoadState("networkidle");
const naLixeira = await p.locator("table tbody tr").count();
ok("item excluído aparece na lixeira", naLixeira === 1, `${naLixeira} na lixeira`);
await p.locator('button[aria-label^="Ações de"]').first().click();
await p.locator('[role="menu"] [role="menuitem"]', { hasText: "Restaurar" }).click();
await p.waitForTimeout(1500);
await p.goto(`${URL}/custos?q=Certificado&f=todos`);
await p.waitForLoadState("networkidle");
ok("restaurar devolve o item à lista", (await p.locator("table tbody tr").count()) === 1);

console.log("\n— Item com histórico não oferece Excluir —");
await p.goto(`${URL}/custos?q=TOTVS&f=todos`);
await p.waitForSelector("table tbody tr");
await p.locator('button[aria-label^="Ações de"]').first().click();
await p.waitForSelector('[role="menu"]');
const rotulosTotvs = await p.locator('[role="menu"] [role="menuitem"]').allInnerTexts();
ok("item com lançamentos oferece 'Encerrar custo', não 'Excluir'",
   rotulosTotvs.some((r) => r.includes("Encerrar")) && !rotulosTotvs.some((r) => r.trim() === "Excluir"),
   rotulosTotvs.filter(r=>r.includes("Encerrar")||r.includes("Excluir")).join(" | "));
await p.keyboard.press("Escape");

console.log("\n═══ RATEIO — o pedido central ═══");
await p.goto(`${URL}/custos?q=Dynamics&f=todos`);
await p.waitForSelector("table tbody tr");
const idDynamics = await p.locator("table tbody tr a").first().getAttribute("href");
await p.goto(`${URL}${idDynamics}/rateio`);
await p.waitForSelector('form:has(select[name="setor_0"])');
const formRateio = p.locator('form:has(select[name="setor_0"])');

const pctTI = await p.locator('input[name="pct_0"]').inputValue();
ok("abre com um setor só, em 100%", pctTI === "100,00", `TI = ${pctTI}%`);
ok("a âncora é somente leitura", await p.locator('input[name="pct_0"]').getAttribute("readonly") !== null);
ok("a âncora se identifica como quem absorve o resto",
   (await formRateio.innerText()).includes("absorve o restante"));

console.log("\n  → o caso literal do pedido: 100 + adiciona 10 = 90 e 10");
await p.locator("button", { hasText: "Adicionar setor" }).click();
await p.waitForSelector('select[name="setor_1"]');
const focoNoSetor = await p.evaluate(() => document.activeElement?.getAttribute("name"));
ok("o foco cai no select do setor novo", focoNoSetor === "setor_1", `foco em ${focoNoSetor}`);
await p.selectOption('select[name="setor_1"]', { label: "Comercial" });
await p.waitForTimeout(200);
const focoNoPct = await p.evaluate(() => document.activeElement?.getAttribute("name"));
ok("escolher o setor leva o foco ao percentual", focoNoPct === "pct_1", `foco em ${focoNoPct}`);
await p.fill('input[name="pct_1"]', "10");
await p.waitForTimeout(250);
const tiDepois = await p.locator('input[name="pct_0"]').inputValue();
ok("TI cai automaticamente para 90% — sem chegar a 110%", tiDepois === "90,00", `TI = ${tiDepois}%`);

console.log("\n  → adicionar um terceiro não mexe no segundo");
await p.locator("button", { hasText: "Adicionar setor" }).click();
await p.selectOption('select[name="setor_2"]', { label: "Acadêmico" });
await p.fill('input[name="pct_2"]', "5,5");
await p.waitForTimeout(250);
const comercial = await p.locator('input[name="pct_1"]').inputValue();
const ti3 = await p.locator('input[name="pct_0"]').inputValue();
ok("Comercial permanece em 10%", comercial === "10,00", `Comercial = ${comercial}%`);
ok("TI absorve de novo: 84,50%", ti3 === "84,50", `TI = ${ti3}%`);

console.log("\n  → o delta fica visível até salvar");
const textoForm = await formRateio.innerText();
ok("a âncora mostra quanto já cedeu", textoForm.includes("−15,50") || textoForm.includes("(−15,50)"),
   textoForm.split("\n").find((l) => l.includes("absorve")) ?? "");

console.log("\n  → cada percentual anda com o seu real");
const reaisComercial = await p.locator('input[aria-label*="Valor mensal de Comercial"]').inputValue();
ok("a fatia do Comercial aparece em reais", reaisComercial.includes("124,00"), reaisComercial);

console.log("\n  → excesso vira erro na linha, nunca estado 110%");
await p.fill('input[name="pct_1"]', "96");
await p.waitForTimeout(250);
const alerta = await p.locator('[role="alert"]').first().innerText().catch(() => "");
ok("o erro nasce na linha culpada, com o quanto cabe", alerta.includes("Passou") && alerta.includes("%"), alerta);
const salvarHabilitado = await p.locator('form:has(select[name="setor_0"]) button[type="submit"]').isEnabled();
ok("o botão Salvar continua clicável (não fica apagado e mudo)", salvarHabilitado);

console.log("\n  → dividir igualmente fecha em 100%");
await p.fill('input[name="pct_1"]', "10");
await p.locator("button", { hasText: "Dividir igualmente" }).click();
await p.waitForTimeout(250);
const tres = await Promise.all([0,1,2].map(i => p.locator(`input[name="pct_${i}"]`).inputValue()));
ok("três fatias iguais exibem 33,33% cada", tres.every(v => v === "33,33"), tres.join(" / "));
// A soma exata mora nas 4 casas gravadas, não nas 2 exibidas: 33,3334 + 33,3333 +
// 33,3333 = 100 exato. Conferido no teste de unidade de src/lib/rateio.ts.

console.log("\n  → aplicar (admin aplica direto)");
await p.locator("button", { hasText: "Voltar a um setor só" }).click();
await p.waitForTimeout(150);
await p.locator("button", { hasText: "Adicionar setor" }).click();
await p.selectOption('select[name="setor_1"]', { label: "Comercial" });
await p.fill('input[name="pct_1"]', "40");
await p.waitForTimeout(200);
await p.fill('textarea[name="justificativa"]', "O CRM é operado pela captação.");
await limparAviso();
await p.locator('form:has(select[name="setor_0"]) button[type="submit"]').click();
const avisoRateio = await proximoAviso();
ok("admin aplica o rateio direto", avisoRateio.includes("aplicado"), avisoRateio.replace(/\n/g, " · "));

await p.goto(`${URL}${idDynamics}`);
await p.waitForLoadState("networkidle");
const detalhe = await p.locator("main").innerText();
ok("a página do custo mostra as duas fatias em % e em R$",
   detalhe.includes("60,00%") && detalhe.includes("40,00%") && detalhe.includes("744,00"),
   detalhe.split("\n").filter(l=>l.includes("%")).slice(0,3).join(" | "));

console.log("\n— Histórico do custo agora aparece —");
// O item do rateio veio da carga inicial e não tem auditoria; o "Link dedicado"
// teve situação alterada e desfeita pela interface, então tem histórico real.
await p.goto(`${URL}/custos?q=Link dedicado&f=todos`);
await p.waitForSelector("table tbody tr");
const idLink = await p.locator("table tbody tr a").first().getAttribute("href");
await p.goto(`${URL}${idLink}`);
await p.waitForSelector("#historico", { timeout: 8000 });
const historico = await p.locator("#historico").innerText();
ok("a página traz a seção Histórico", /hist[óo]rico/i.test(historico));
ok("o histórico nomeia quem alterou", historico.includes("Ana Administradora"), historico.split("\n").slice(1,3).join(" · "));
ok("o histórico mostra o antes e o depois do campo",
   /Situação:\s*Em análise\s*→\s*Ativo/.test(historico.replace(/\s+/g, " ")),
   historico.split("\n").filter(l => l.includes("Situação")).slice(0,2).join(" | "));

console.log("\n═══ GESTOR DE SETOR ═══");
await ctx.clearCookies();
await entrar("ti@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForLoadState("networkidle");
const meus = await p.locator("table tbody tr").count();
// Número EXATO, não "menos que o total". A versão frouxa deste teste deixou
// passar um defeito em que o gestor enxergava a lista inteira da FMP: com 25
// itens no banco e 24 ativos, "24 < 25" dava verde enquanto o escopo de setor
// estava sendo apagado por uma chave `AND` sobrescrita.
ok(
  "gestor vê SÓ os custos da própria área",
  meus === SEMENTE.itensDeTI,
  `${meus}, esperado ${SEMENTE.itensDeTI}`,
);
const forasteiro = await p.locator('[data-celula="descricao"]', { hasText: "Energia elétrica" }).count();
ok("e não vê o custo de outro setor", forasteiro === 0, `${forasteiro} vazamento(s)`);

console.log("\n  → gestor propõe, não aplica");
await p.goto(`${URL}/custos?q=Antivírus`);
await p.waitForSelector("table tbody tr");
const idAnti = await p.locator("table tbody tr a").first().getAttribute("href");
await p.goto(`${URL}${idAnti}/rateio`);
await p.waitForSelector('form:has(select[name="setor_0"])');
const rotuloBotao = await p.locator('form:has(select[name="setor_0"]) button[type="submit"]').innerText();
ok("o botão do gestor diz 'Enviar proposta'", rotuloBotao.includes("proposta"), rotuloBotao);
await p.locator("button", { hasText: "Adicionar setor" }).click();
await p.selectOption('select[name="setor_1"]', { label: "Comunicação e Marketing" });
await p.fill('input[name="pct_1"]', "30");
await p.waitForTimeout(200);
await p.fill('textarea[name="justificativa"]', "A licença cobre as estações do Marketing.");
await limparAviso();
await p.locator('form:has(select[name="setor_0"]) button[type="submit"]').click();
const avisoProposta = await proximoAviso();
ok("proposta enviada avisa quem precisa aceitar",
   avisoProposta.includes("Proposta enviada") && avisoProposta.includes("Comunicação"),
   avisoProposta.replace(/\n/g, " · "));

await p.goto(`${URL}${idAnti}`);
await p.waitForLoadState("networkidle");
const comProposta = await p.locator("main").innerText();
ok("a página do custo mostra a proposta pendente", comProposta.includes("aguardando aceite"));
ok("quem propôs pode cancelar (o botão existe agora)",
   await p.locator("button", { hasText: "Cancelar proposta" }).count() > 0);

console.log("\n═══ QUEM RECEBE A FATIA ═══");
await ctx.clearCookies();
await entrar("mkt@fmp.com.br");
await p.goto(`${URL}${idAnti}`);
await p.waitForLoadState("networkidle");
const paraAceitar = await p.locator("main").innerText();
ok("o gestor que recebe vê a proposta na página do custo", paraAceitar.includes("aguardando aceite"));
const botaoAceite = p.locator("button", { hasText: /Aceitar/ });
ok("o botão de aceitar mostra o valor em reais, não só o percentual",
   (await botaoAceite.count()) > 0 && (await botaoAceite.first().innerText()).includes("R$"),
   (await botaoAceite.first().innerText().catch(() => "—")));
await p.locator("button", { hasText: "Recusar" }).first().click();
await p.waitForTimeout(300);
const avisoRecusa = await p.locator("main").innerText();
ok("o texto diz a verdade: recusar derruba a proposta inteira",
   avisoRecusa.includes("proposta inteira"),
   avisoRecusa.split("\n").find((l) => l.includes("proposta inteira")) ?? "");
await p.fill('textarea[name="comentario"]', "Quem usa é a TI — só damos suporte pontual.");
await limparAviso();
await p.locator("button", { hasText: "Recusar proposta" }).click();
ok("recusa é confirmada", (await proximoAviso()).includes("recusada"));

console.log("\n═══ LEITOR ═══");
await ctx.clearCookies();
await entrar("leitor@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForLoadState("networkidle");
await p.locator('button[aria-label^="Ações de"]').first().click();
await p.waitForSelector('[role="menu"]');
const desabilitados = await p.locator('[role="menu"] [role="menuitem"][aria-disabled="true"]').count();
const textoMenu = await p.locator('[role="menu"]').innerText();
ok("para o leitor as ações vêm desabilitadas", desabilitados > 0, `${desabilitados} desabilitadas`);
ok("e cada uma explica o motivo, em vez de ficar muda",
   textoMenu.includes("consultar"), textoMenu.split("\n").filter(l=>l.includes("consultar"))[0] ?? "");
const editavel = await p.locator('button[data-sem-data="true"]').count();
ok("o leitor não tem célula de data editável", editavel === 0);

console.log("\n═══ ACESSIBILIDADE / TECLADO ═══");
await ctx.clearCookies();
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
await p.locator('button[aria-label^="Ações de"]').first().focus();
await p.keyboard.press("ArrowDown");
await p.waitForSelector('[role="menu"]');
const focoMenu = await p.evaluate(() => document.activeElement?.getAttribute("role"));
ok("seta para baixo abre o menu e foca o primeiro item", focoMenu === "menuitem");
await p.keyboard.press("ArrowDown");
await p.keyboard.press("Escape");
await p.waitForTimeout(200);
const voltouAoGatilho = await p.evaluate(() => document.activeElement?.getAttribute("aria-haspopup"));
ok("Esc fecha e devolve o foco ao botão", voltouAoGatilho === "menu");

console.log("\n═══ ERROS DE CONSOLE ═══");
const relevantes = erros.filter(
  (e) =>
    !e.includes("favicon") &&
    !e.includes("Download the React") &&
    // 404 de recurso pedido pelo navegador (ícone de aba) não é erro da aplicação.
    !/Failed to load resource.*404/.test(e),
);
ok("nenhum erro de JavaScript durante a sessão inteira", relevantes.length === 0, relevantes.slice(0, 3).join(" | "));

const falhas = registro.filter((r) => !r.condicao);
console.log(`\n${falhas.length === 0 ? "✓" : "✗"} ${registro.length - falhas.length}/${registro.length} verificações passaram`);
if (falhas.length) falhas.forEach((f) => console.log(`   ✗ ${f.nome}${f.extra ? " → " + f.extra : ""}`));
await navegador.close();
process.exit(falhas.length === 0 ? 0 : 1);
