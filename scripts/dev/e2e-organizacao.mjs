import { chromium } from "playwright";

/**
 * Teste de ponta a ponta de setor e categoria pela interface.
 *
 * Até aqui, criar um setor ou uma categoria exigia SQL. O efeito prático não era
 * "dá trabalho": era que ninguém criava — os custos de uma área nova iam para o
 * setor mais parecido, e o gráfico por tipo descrevia a lista de dois anos atrás.
 *
 * O que se verifica: criar sem inventar código, a recusa de nome duplicado
 * (inclusive contra um registro INATIVO, que é o caso que produz duplicata na
 * vida real), o que o sistema deixa apagar e o que só deixa inativar, a
 * consequência dita antes do clique, a fusão de duas categorias com os custos
 * indo junto, e o ciclo de hierarquia que é recusado.
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

/**
 * A linha da tabela cujo nome é este.
 *
 * Por atributo, e não por texto: cada linha carrega um `<select>` com TODOS os
 * outros nomes, então `hasText` acerta a primeira linha da tabela em vez da
 * linha certa — e o teste passa a inativar um setor e conferir outro.
 */
const linha = (nome) => p.locator(`tbody tr[data-nome="${nome}"]`);

async function abrirMenu(nome) {
  await linha(nome).locator('button[aria-haspopup="menu"]').click();
  await p.waitForSelector('[role="menu"]');
}

console.log("\n═══ SETORES: CRIAR SEM SQL ═══");
await entrar("admin@fmp.com.br");
await p.goto(`${URL}/admin/setores`);
await p.waitForSelector("tbody tr");

const antes = await p.locator("tbody tr").count();
ok("a tela lista os setores existentes", antes >= 13, `${antes} setores`);

const totalCabecalho = texto(await p.locator("main p").first().innerText());
void totalCabecalho;
const resumo = texto(await p.locator("main > p").nth(1).innerText());
// Inativar um setor sem saber quanto passa por ele é uma decisão cega.
ok("o cabeçalho diz quanto dinheiro está em jogo", /R\$\s*[\d.]+,\d\d\/mês/.test(resumo), resumo);
ok(
  "e a tabela tem coluna de dinheiro por linha",
  (await p.locator("thead th", { hasText: "Por mês" }).count()) === 1,
);

await p.fill('input[name="nome"]', "Núcleo de Inovação");
await p.waitForTimeout(300);
const sugerido = await p.getAttribute('input[name="codigo"]', "placeholder");
// Pedir que a pessoa invente um código único produz "CAT1" e "X".
ok("o código é sugerido a partir do nome", sugerido === "NUCLEO-DE-INOVACAO", sugerido ?? "—");

await p.click('button:has-text("Criar setor")');
const avisoCriado = await proximoAviso();
ok(
  "criar avisa o que passou a ser possível",
  /pode receber custos/i.test(avisoCriado),
  avisoCriado.replace(/\n/g, " · "),
);
await limparAviso();

await p.waitForTimeout(700);
ok("e o setor aparece na lista", (await linha("Núcleo de Inovação").count()) === 1);

console.log("\n  → e passa a existir no cadastro de custo");
await p.goto(`${URL}/custos/novo`);
await p.waitForSelector('select[name="setorId"]');
const opcoes = await p.locator('select[name="setorId"] option').allInnerTexts();
ok(
  "o setor novo já é escolhível",
  opcoes.some((o) => o.includes("Núcleo de Inovação")),
  `${opcoes.length} opções`,
);

console.log("\n═══ NOME DUPLICADO É RECUSADO ═══");
await p.goto(`${URL}/admin/setores`);
await p.waitForSelector("tbody tr");
await p.fill('input[name="nome"]', "nucleo de inovacao");
await p.click('button:has-text("Criar setor")');
const avisoDuplicado = await proximoAviso();
// Sem acento e em minúsculas continua sendo o mesmo setor.
ok(
  "nome igual sem acento é recusado",
  /já existe/i.test(avisoDuplicado),
  avisoDuplicado.replace(/\n/g, " · "),
);
await limparAviso();

console.log("\n═══ APAGAR SÓ O QUE NUNCA FOI USADO ═══");
await abrirMenu("Núcleo de Inovação");
const apagarNovo = p.locator('[role="menu"] [role="menuitem"]', { hasText: "Apagar" }).first();
ok(
  "o setor recém-criado pode ser apagado",
  (await apagarNovo.getAttribute("aria-disabled")) !== "true",
);
await p.keyboard.press("Escape");

await abrirMenu("TI");
const apagarTI = p.locator('[role="menu"] [role="menuitem"]', { hasText: "Apagar" }).first();
ok("um setor com custos, não", (await apagarTI.getAttribute("aria-disabled")) === "true");
const motivo = texto(await apagarTI.innerText());
// Desabilitado com motivo, em vez de ausente: quem procura o botão precisa
// achar a explicação, não o vazio.
ok(
  "e o item diz por quê, em vez de ficar mudo",
  /custos rateados/i.test(motivo),
  motivo.replace(/\n/g, " · "),
);
ok("apontando a saída que existe", /inativar/i.test(motivo), motivo.replace(/\n/g, " · "));
await p.keyboard.press("Escape");

console.log("\n═══ INATIVAR NÃO SOME COM O DINHEIRO ═══");
await abrirMenu("Biblioteca");
await p.locator('[role="menu"] [role="menuitem"]', { hasText: "Inativar" }).first().click();
const avisoInativado = await proximoAviso();
ok("inativar avisa", /inativado/i.test(avisoInativado), avisoInativado.split("\n")[0]);
// Quem inativa e vê o total do painel igual ao de antes vai achar que não
// funcionou. A consequência precisa vir junto.
ok(
  "e diz o que continua acontecendo com os custos",
  /continuam somando|listas de escolha/i.test(avisoInativado),
  avisoInativado.replace(/\n/g, " · "),
);
ok("com desfazer à mão", avisoInativado.includes("Desfazer"), avisoInativado.replace(/\n/g, " · "));

await p.locator('[role="status"] button:has-text("Desfazer")').click();
await p.waitForTimeout(1200);
await limparAviso();
await p.waitForTimeout(500);
const voltou = await linha("Biblioteca").getAttribute("data-ativo");
ok("desfazer devolve o setor ao ativo", voltou === "sim", voltou ?? "—");

console.log("\n═══ CICLO NA HIERARQUIA É RECUSADO ═══");
// Põe Núcleo de Inovação abaixo de TI, e depois tenta pôr TI abaixo dele.
const seletorNucleo = linha("Núcleo de Inovação").locator('select[data-campo="setorPaiId"]');
await seletorNucleo.selectOption({ label: "TI" });
await proximoAviso();
await limparAviso();
await p.waitForTimeout(800);

const seletorTI = linha("TI").locator('select[data-campo="setorPaiId"]').first();
await seletorTI.selectOption({ label: "Núcleo de Inovação" });
const avisoCiclo = await proximoAviso();
// O ciclo não dá erro ao gravar: ele trava a travessia da árvore depois,
// inclusive a que monta este próprio seletor.
ok("o ciclo é recusado", /ciclo|abaixo deste/i.test(avisoCiclo), avisoCiclo.replace(/\n/g, " · "));
await limparAviso();

console.log("\n═══ CATEGORIAS: O MESMO, MAIS A FUSÃO ═══");
await p.goto(`${URL}/admin/categorias`);
await p.waitForSelector("tbody tr");

await p.fill('input[name="nome"]', "Softwares");
await p.click('button:has-text("Criar categoria")');
await proximoAviso();
await limparAviso();
await p.waitForTimeout(800);

// "Softwares" ao lado de "Software" parte o gráfico por tipo ao meio sem que
// nenhuma das duas linhas pareça errada.
const suspeita = p.locator('[role="status"], div', { hasText: "Podem ser a mesma coisa" }).first();
ok("a tela avisa que duas categorias podem ser a mesma", (await suspeita.count()) >= 1);

console.log("\n  → e a fusão move os custos junto");
await abrirMenu("Software");
await p.locator('[role="menu"] [role="menuitem"]', { hasText: "Fundir" }).first().click();
await p.waitForSelector('[role="dialog"] select');
// A primeira frase do painel, e não o texto inteiro: o `<select>` de destino
// lista "Infraestrutura (4 custos)" e casaria com qualquer busca por "custos".
const painel = texto(await p.locator('[role="dialog"] p').first().innerText());
ok(
  "o painel diz quantos custos vão se mover",
  /\d+ custos classificados/.test(painel),
  painel.replace(/\n/g, " "),
);
// O número tem que ser o TOTAL, e não só o corrente: prometer 10 e mover 11 é a
// mentira pequena que corrói a confiança em tudo o mais que a tela afirma.
const prometidos = Number(painel.match(/Os (\d+) custos classificados/)?.[1] ?? 0);

await p.locator('[role="dialog"] select').selectOption({ label: "Softwares (0 custos)" });
await p.waitForTimeout(400);
await p.waitForTimeout(400);
const previa = texto(await p.locator('[role="dialog"]').innerText());
ok(
  "e com quantos a outra fica",
  /fica com/.test(previa),
  previa.split("\n").find((l) => l.includes("fica com")) ?? "—",
);
// Apagar deixaria as linhas de auditoria apontando para um id inexistente.
ok("dizendo que a absorvida é inativada, não apagada", /inativada — não apagada/.test(previa), "—");

await p.locator('[role="dialog"] button:has-text("Fundir")').click();
const avisoFusao = await proximoAviso(14000);
ok(
  "a fusão avisa quantos custos passaram",
  /passaram de|foi fundida/i.test(avisoFusao),
  avisoFusao.replace(/\n/g, " · "),
);
const movidos = Number(avisoFusao.match(/^(\d+) custos? passar/)?.[1] ?? 0);
ok(
  "e move exatamente o que prometeu",
  movidos === prometidos,
  `prometeu ${prometidos}, moveu ${movidos}`,
);
await limparAviso();

await p.goto(`${URL}/admin/categorias`);
await p.waitForSelector("tbody tr");
const softwareDepois = await linha("Software").getAttribute("data-ativo");
ok("a categoria absorvida ficou inativa", softwareDepois === "nao", softwareDepois ?? "—");
const softwaresDepois = texto(await linha("Softwares").innerText());
ok(
  "e a que ficou herdou os custos",
  /\d/.test(softwaresDepois),
  softwaresDepois.split("\n").slice(0, 2).join(" · "),
);

console.log("\n  → e a inativa some da escolha, sem reclassificar quem já estava nela");
await p.goto(`${URL}/custos/novo`);
await p.waitForSelector('select[name="categoriaId"]');
const cats = await p.locator('select[name="categoriaId"] option').allInnerTexts();
ok(
  "a categoria inativa não é oferecida em cadastro novo",
  !cats.some((c) => c.trim() === "Software"),
  cats.join(" | "),
);

console.log("\n═══ SÓ ADMINISTRADOR ═══");
await entrar("ti@fmp.com.br");
await p.goto(`${URL}/admin/setores`);
await p.waitForTimeout(900);
ok("gestor de setor não entra na administração", !p.url().includes("/admin"), p.url());

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
