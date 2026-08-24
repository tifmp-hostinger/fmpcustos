import { chromium } from "playwright";
import { SEMENTE } from "./semente.mjs";

/**
 * Teste de ponta a ponta da Etapa 6 — memória e prevenção.
 *
 * Três perguntas: o sistema impede que "Microsoft" e "Microsoft Brasil" virem
 * dois fornecedores? Trinta linhas do Excel entram de uma vez, com o que não
 * foi entendido declarado? A senha temporária chega a quem precisa dela?
 */
const URL = process.env.E2E_URL ?? "http://127.0.0.1:3330";
const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao, extra });
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
}

const navegador = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const ctx = await navegador.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
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

console.log("\n═══ FORNECEDOR DUPLICADO ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/custos/novo`);
await p.waitForSelector('input[name="fornecedor"]');

await p.fill('input[name="fornecedor"]', "Microsoft Brasil");
await p.locator('input[name="descricao"]').click(); // dispara o blur
await p.waitForTimeout(300);
const aviso = await p.locator('form:has(input[name="fornecedor"])').innerText();
ok(
  "digitar “Microsoft Brasil” avisa que já existe “Microsoft”",
  aviso.includes("Já existe “Microsoft”"),
  aviso.split("\n").find((l) => l.includes("Já existe")) ?? "nenhum aviso",
);
ok(
  "e oferece adotar o nome existente",
  (await p.locator("button", { hasText: "Usar “Microsoft”" }).count()) > 0,
);
await p.locator("button", { hasText: "Usar “Microsoft”" }).click();
await p.waitForTimeout(200);
ok(
  "um clique troca o campo pelo nome cadastrado",
  (await p.locator('input[name="fornecedor"]').inputValue()) === "Microsoft",
);

await p.fill('input[name="fornecedor"]', "Adobee");
await p.locator('input[name="descricao"]').click();
await p.waitForTimeout(300);
ok(
  "erro de digitação é apontado como engano",
  (await p.locator('form:has(input[name="fornecedor"])').innerText()).includes(
    "engano de digitação",
  ),
);

await p.fill('input[name="fornecedor"]', "Kaltura Media");
await p.locator('input[name="descricao"]').click();
await p.waitForTimeout(300);
ok(
  "fornecedor genuinamente novo não é alarmado",
  !(await p.locator('form:has(input[name="fornecedor"])').innerText()).includes("Já existe"),
);

console.log("\n  → a rede embaixo: o servidor também reúne");
await p.fill('input[name="descricao"]', "Teste de fornecedor normalizado");
await p.fill('input[name="fornecedor"]', "  MICROSOFT LTDA  ");
await p.fill('input[name="valorPeriodo"]', "100,00");
await p.locator('button[type="submit"]', { hasText: "Cadastrar custo" }).click();
await p.waitForURL(/\/custos(\?|$)/, { timeout: 10000 });
await p.goto(`${URL}/custos?f=todos&q=Teste de fornecedor`);
await p.waitForSelector("table tbody tr");
const fornecedorGravado = await p
  .locator('table tbody tr [data-celula="descricao"] span')
  .first()
  .innerText();
ok(
  "“MICROSOFT LTDA” foi gravado no fornecedor Microsoft que já existia",
  fornecedorGravado.startsWith("Microsoft ·") || fornecedorGravado.startsWith("Microsoft"),
  fornecedorGravado,
);

console.log("\n═══ COLAR DA PLANILHA ═══");
await p.goto(`${URL}/custos`);
await p.waitForSelector("table tbody tr");
ok("o atalho de colagem está na lista", (await p.locator('a[href="/custos/colar"]').count()) > 0);
await p.locator('a[href="/custos/colar"]').first().click();
await p.waitForURL(/\/custos\/colar/);
await p.waitForSelector("textarea");

// Como o Excel realmente cola, com uma linha estragada de propósito.
const COLADO = [
  "Descrição\tFornecedor\tValor\tPeriodicidade\tRenova em",
  "Licença de CAD\tAutodesk\tR$ 2.480,00\tMensal\t30/06/2027",
  "Seguro predial\tPorto Seguro\t14.900,00\tAnual\t15/09/2026",
  "Manutenção de elevadores\tAtlas Schindler\t3.200,00\tTrimestral\t",
  "Linha estragada\tFornecedor X\t1,2,3\tMensal\t",
].join("\n");
await p.fill("textarea", COLADO);
await p.waitForTimeout(500);

const previa = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
ok("detecta o cabeçalho e mapeia as colunas", previa.includes("Detectado pelo cabeçalho"));
ok(
  "conta 3 prontas e 1 com problema",
  /3\s*\n?prontas/.test(previa.replace(/\s+/g, " ")) || previa.includes("3 prontas"),
  previa.split("\n").find((l) => l.includes("pronta")) ?? "",
);
ok(
  "aponta a célula ilegível com o texto original",
  previa.includes("«1,2,3»"),
  previa.split("\n").find((l) => l.includes("1,2,3")) ?? "",
);
ok(
  "trimestral não foi lido como mensal",
  previa.includes("Trimestral"),
  previa
    .split("\n")
    .filter((l) => l.includes("Trimestral"))
    .slice(0, 1)
    .join(""),
);
const valorLido = previa.includes("R$ 2.480,00");
ok("R$ 2.480,00 é lido corretamente", valorLido);

await p.locator('button[type="submit"]', { hasText: "Importar" }).click();
await p.waitForURL(/f=analise/, { timeout: 12000 });
await p.waitForTimeout(800);
const avisoImport = await p
  .locator('[role="status"]')
  .innerText()
  .catch(() => "");
ok(
  "o aviso diz quantos entraram",
  /3 custos importados/.test(avisoImport),
  avisoImport.replace(/\n/g, " · "),
);
ok(
  "e que uma linha ficou de fora",
  avisoImport.includes("ficou de fora"),
  avisoImport.replace(/\n/g, " · "),
);
ok(
  "os importados entram como “em análise”, sem somar no total ativo",
  p.url().includes("f=analise"),
);
const depois = await contarCustos(p);
ok(
  "os três aparecem na lista de custos",
  depois === SEMENTE.itens + 4,
  `${depois} custos no total (${SEMENTE.itens} da carga + 1 do teste + 3 colados)`,
);

console.log("\n═══ MODELO DE RATEIO ═══");
await p.goto(`${URL}/custos?q=Dynamics&f=todos`);
await p.waitForSelector("table tbody tr");
const idDynamics = await p.locator("table tbody tr a").first().getAttribute("href");
await p.goto(`${URL}${idDynamics}/rateio`);
await p.waitForSelector('form:has(select[name="setor_0"])');
await p.locator("button", { hasText: "Adicionar setor" }).click();
await p.selectOption('select[name="setor_1"]', { label: "Comercial" });
await p.fill('input[name="pct_1"]', "30");
await p.waitForTimeout(250);
await p.locator("button", { hasText: "Salvar esta divisão como modelo" }).click();
await p.waitForSelector('input[name="nome"]');
await p.fill('input[name="nome"]', "TI–Comercial 70/30");
await p.locator("button", { hasText: "Salvar modelo" }).click();
await p.waitForSelector('[role="status"]', { timeout: 8000 });
ok(
  "o modelo é salvo com nome",
  (await p.locator('[role="status"]').innerText()).includes("TI–Comercial 70/30"),
);

// Noutro custo, o modelo tem de aparecer como atalho e aplicar a divisão.
await p.goto(`${URL}/custos?q=Hospedagem&f=todos`);
await p.waitForSelector("table tbody tr");
const idOutro = await p.locator("table tbody tr a").first().getAttribute("href");
await p.goto(`${URL}${idOutro}/rateio`);
await p.waitForSelector('form:has(select[name="setor_0"])');
const chipModelo = p.locator("button", { hasText: "TI–Comercial 70/30" });
ok("o modelo aparece como atalho noutro custo", (await chipModelo.count()) > 0);
await chipModelo.first().click();
await p.waitForTimeout(300);
const pcts = await Promise.all([
  p.locator('input[name="pct_0"]').inputValue(),
  p.locator('input[name="pct_1"]').inputValue(),
]);
ok(
  "aplicar o modelo escreve 70 e 30",
  pcts.includes("70,00") && pcts.includes("30,00"),
  pcts.join(" / "),
);

console.log("\n═══ SENHA TEMPORÁRIA ═══");
await p.goto(`${URL}/admin/usuarios`);
await p.waitForSelector('input[name="nome"]');
ok(
  "a lista mostra quem nunca entrou",
  (await p.locator("main").innerText()).includes("nunca entrou"),
  (await p.locator("main").innerText()).split("\n").find((l) => l.includes("nunca entrou")) ?? "",
);

await p.fill('form input[name="nome"]', "Novo Gestor de Teste");
await p.fill('input[name="email"]', "novo.gestor@fmp.com.br");
await p.selectOption('select[name="setorId"]', { index: 1 });
await p.locator("button", { hasText: "Criar usuário" }).click();
await p.waitForSelector("code", { timeout: 10000 });
const senhaNaTela = (await p.locator("code").first().innerText()).trim();
ok(
  "a senha aparece isolada, em fonte monoespaçada",
  senhaNaTela.length >= 8,
  `${senhaNaTela.length} caracteres`,
);
ok("com botão de copiar", (await p.locator("button", { hasText: "Copiar" }).count()) > 0);
await p.locator("button", { hasText: "Copiar" }).first().click();
await p.waitForTimeout(400);
const daAreaDeTransferencia = await p.evaluate(() => navigator.clipboard.readText());
ok(
  "copiar leva a senha para a área de transferência",
  daAreaDeTransferencia === senhaNaTela,
  daAreaDeTransferencia === senhaNaTela ? "confere" : `“${daAreaDeTransferencia}”`,
);
ok("e há um e-mail pronto para enviar", (await p.locator('a[href^="mailto:"]').count()) > 0);

// A senha não pode sumir sozinha como um aviso qualquer.
await p.waitForTimeout(9000);
ok("a senha continua na tela depois de nove segundos", (await p.locator("code").count()) > 0);
await p.locator("button", { hasText: "Já repassei" }).click();
await p.waitForTimeout(300);
ok("e só sai quando o admin diz que repassou", (await p.locator("code").count()) === 0);

console.log("\n  → o admin não reseta a própria senha");
const meuProprio = p.locator("details").filter({ hasText: "admin@fmp.com.br" }).first();
await meuProprio.locator("summary").click();
await meuProprio.locator("button", { hasText: "Gerar nova senha temporária" }).click();
await meuProprio.locator('input[name="confirmacao"]').fill("RESETAR");
await meuProprio.locator("button", { hasText: "Resetar senha" }).click();
await p.waitForTimeout(900);
ok(
  "resetar a própria senha é recusado, com o caminho certo",
  (await meuProprio.innerText()).includes("Trocar senha"),
  (await meuProprio.innerText()).split("\n").find((l) => l.includes("Trocar senha")) ?? "",
);
ok("e a sessão continua de pé", !p.url().includes("login"));
await meuProprio.locator("button", { hasText: "Cancelar" }).click();

console.log("\n  → reset exige confirmação digitada");
const primeiro = p.locator("details").filter({ hasText: "leitor@fmp.com.br" }).first();
await primeiro.locator("summary").click();
await primeiro.locator("button", { hasText: "Gerar nova senha temporária" }).click();
await p.waitForSelector('input[name="confirmacao"]');
ok("pede a palavra de confirmação", (await primeiro.innerText()).includes("Digite RESETAR"));
await primeiro.locator('input[name="confirmacao"]').fill("sim");
await primeiro.locator("button", { hasText: "Resetar senha" }).click();
await p.waitForTimeout(700);
ok("confirmação errada não reseta", (await p.locator("code").count()) === 0);
await primeiro.locator('input[name="confirmacao"]').fill("RESETAR");
await primeiro.locator("button", { hasText: "Resetar senha" }).click();
await p.waitForSelector("code", { timeout: 8000 });
ok("confirmação certa gera a senha nova", (await p.locator("code").count()) > 0);

/**
 * Quantos custos existem, de todas as naturezas.
 *
 * Pelo atributo, e não pelo primeiro `<p>` de `main`: a posição mudou no dia em
 * que o cabeçalho ganhou o total em destaque, e o teste passou a ler o número
 * errado sem que nada estivesse quebrado no sistema.
 */
async function contarCustos(pagina) {
  await pagina.goto(`${URL}/custos?nat=tudo&f=todos`);
  await pagina.waitForSelector("[data-contagem]");
  const texto = await pagina.locator("[data-contagem]").first().innerText();
  return Number(texto.match(/(\d+)\s+custos?/)?.[1] ?? "0");
}

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
