import {
  colunasAmbiguas,
  lerColagem,
  lerData,
  lerNatureza,
  lerPeriodicidade,
  pareceCabecalho,
  separarCelulas,
  somaColada,
} from "../src/lib/planilha";

let falhas = 0;
function ok(nome: string, condicao: boolean, extra = "") {
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
  if (!condicao) falhas++;
}

// Como o Excel realmente cola: TAB entre colunas, vírgula decimal.
const DO_EXCEL = [
  "Descrição\tFornecedor\tValor\tPeriodicidade\tRenova em\tQtd",
  "Microsoft 365 — licenças\tMicrosoft\tR$ 9.840,00\tMensal\t31/12/2026\t120",
  "Antivírus corporativo\tKaspersky\t18.600,00\tAnual\t01/03/2027\t",
  "Link dedicado 500 Mbps\tVivo\t4.200,00\tmensal\t\t",
].join("\n");

console.log("\n— Reconhecer o que veio do Excel —");
let l = lerColagem(DO_EXCEL);
ok("detecta o cabeçalho", l.cabecalho !== null, JSON.stringify(l.cabecalho));
ok("lê as três linhas de dados", l.linhas.length === 3, `${l.linhas.length} linhas`);
ok(
  "mapeia descrição, fornecedor, valor, periodicidade e data",
  l.mapa.descricao === 0 &&
    l.mapa.fornecedor === 1 &&
    l.mapa.valorPeriodo === 2 &&
    l.mapa.periodicidade === 3 &&
    l.mapa.dataFim === 4,
  JSON.stringify(l.mapa),
);
ok(
  "lê R$ 9.840,00 como 9840.00",
  l.linhas[0].valorPeriodo === "9840.00",
  l.linhas[0].valorPeriodo ?? "null",
);
ok(
  "lê 31/12/2026",
  l.linhas[0].dataFim?.toISOString().slice(0, 10) === "2026-12-31",
  l.linhas[0].dataFim?.toISOString().slice(0, 10) ?? "null",
);
ok("lê a quantidade", l.linhas[0].quantidade === 120, String(l.linhas[0].quantidade));
ok("periodicidade anual reconhecida", l.linhas[1].periodicidade === "ANUAL");
ok(
  "nenhuma linha com problema",
  l.linhas.every((x) => x.problemas.length === 0),
  JSON.stringify(l.linhas.flatMap((x) => x.problemas)),
);

console.log("\n— A vírgula decimal não pode partir o valor —");
ok(
  "colagem com TAB usa TAB",
  separarCelulas("a\tb,c")[0].length === 2,
  JSON.stringify(separarCelulas("a\tb,c")),
);
const csvBr = separarCelulas("Descrição;Valor\nInternet;1.234,56");
ok("CSV brasileiro usa ponto e vírgula", csvBr[1][1] === "1.234,56", JSON.stringify(csvBr[1]));

console.log("\n— Célula ilegível vira problema declarado, nunca silêncio —");
l = lerColagem(["Descrição\tValor\tRenova em", "Contrato X\t1,2,3\t31/02/2026"].join("\n"));
ok(
  "valor ilegível é apontado",
  l.linhas[0].problemas.some((p) => p.includes("1,2,3")),
  JSON.stringify(l.linhas[0].problemas),
);
ok(
  "31 de fevereiro é recusado",
  l.linhas[0].problemas.some((p) => p.includes("31/02/2026")),
  JSON.stringify(l.linhas[0].problemas),
);
ok("nada é inventado no lugar", l.linhas[0].valorPeriodo === null && l.linhas[0].dataFim === null);

console.log("\n— Sem cabeçalho —");
l = lerColagem("Energia elétrica\tCEEE\t22.400,00");
ok("não trata dado como cabeçalho", l.cabecalho === null);
ok(
  "a linha de dados é preservada",
  l.linhas.length === 1 && l.linhas[0].descricao === "Energia elétrica",
);
ok("a primeira coluna vira descrição", l.mapa.descricao === 0);
ok("e avisa que assumiu mensal", l.linhas[0].avisos.includes("assumindo mensal"));

console.log("\n— Cabeçalho de verdade vs. linha de dados —");
ok("linha com dinheiro nunca é cabeçalho", !pareceCabecalho(["Internet", "Vivo", "R$ 4.200,00"]));
ok("linha só com rótulos é cabeçalho", pareceCabecalho(["Descrição", "Fornecedor", "Valor"]));
ok("texto sem pista nenhuma não é cabeçalho", !pareceCabecalho(["asdf", "qwer"]));

console.log("\n— Datas —");
ok("aceita 2026-12-31", lerData("2026-12-31")?.toISOString().slice(0, 10) === "2026-12-31");
ok("aceita 31/12/2026", lerData("31/12/2026")?.toISOString().slice(0, 10) === "2026-12-31");
ok("aceita 31.12.2026", lerData("31.12.2026")?.toISOString().slice(0, 10) === "2026-12-31");
ok("recusa ano de dois dígitos", lerData("31/12/26") === null);
ok("recusa texto solto", lerData("dezembro") === null);

console.log("\n— Periodicidade —");
ok('"Mensal" → MENSAL', lerPeriodicidade("Mensal") === "MENSAL");
ok(
  '"trimestral" não vira MENSAL por conter "mes"',
  lerPeriodicidade("trimestral") === "TRIMESTRAL",
  String(lerPeriodicidade("trimestral")),
);
ok(
  '"bimestral" idem',
  lerPeriodicidade("bimestral") === "BIMESTRAL",
  String(lerPeriodicidade("bimestral")),
);
ok(
  '"semestral" idem',
  lerPeriodicidade("semestral") === "SEMESTRAL",
  String(lerPeriodicidade("semestral")),
);
ok('"por mês" continua MENSAL', lerPeriodicidade("por mês") === "MENSAL");
ok('"Por consumo" → SOB_DEMANDA', lerPeriodicidade("Por consumo") === "SOB_DEMANDA");
ok('"anual" → ANUAL', lerPeriodicidade("anual") === "ANUAL");
ok("vazio não vira nada", lerPeriodicidade("") === null);

console.log("\n— Teto de linhas —");
const muitas = Array.from({ length: 350 }, (_, i) => `Custo ${i}\tFornecedor\t100,00`).join("\n");
l = lerColagem(muitas);
ok("corta em 300 linhas", l.linhas.length === 300, `${l.linhas.length}`);
ok("e diz quantas ficaram de fora", l.cortadas === 50, `${l.cortadas}`);
ok(
  "cabe a maior aba setorial real, de 172 linhas",
  lerColagem(
    Array.from({ length: 172 }, (_, i) => `Custo ${i}\tFornecedor\t100,00`).join("\n"),
  ).cortadas === 0,
);

// ---------------------------------------------------------------------------
// NATUREZA
//
// Antes desta versão a colagem gravava RECORRENTE em tudo. Numa planilha com
// 153 compras avulsas isso somaria mais de um milhão de reais por mês ao custo
// recorrente da fundação, cada brinde virando mensalidade eterna.
// ---------------------------------------------------------------------------
console.log("\n— Natureza —");
ok('"pontual" → PONTUAL', lerNatureza("Pontual") === "PONTUAL");
ok('"compra avulsa" → PONTUAL', lerNatureza("Compra avulsa") === "PONTUAL");
ok('"recorrente" → RECORRENTE', lerNatureza("Recorrente") === "RECORRENTE");
ok('"assinatura" → RECORRENTE', lerNatureza("Assinatura") === "RECORRENTE");
ok('"investimento" → CAPEX', lerNatureza("Investimento") === "CAPEX");
ok('"folha" → PESSOAL', lerNatureza("Folha de pagamento") === "PESSOAL");
ok("vazio não vira nada", lerNatureza("") === null);
ok(
  '"contrato pontual" cai em PONTUAL, não em RECORRENTE',
  lerNatureza("contrato pontual") === "PONTUAL",
  String(lerNatureza("contrato pontual")),
);

const COM_NATUREZA = [
  "Descrição\tFornecedor\tValor\tPeriodicidade\tNatureza",
  "Ecobag preta — Cidade da Advocacia\tInova Gifts\t27.000,00\tÚnico\tPontual",
  "Microsoft 365\tMicrosoft\t1.931,30\tMensal\tRecorrente",
].join("\n");
l = lerColagem(COM_NATUREZA);
ok("mapeia a coluna de natureza", l.mapa.natureza === 4, String(l.mapa.natureza));
ok("lê PONTUAL da coluna", l.linhas[0].natureza === "PONTUAL", l.linhas[0].natureza);
ok("lê RECORRENTE da coluna", l.linhas[1].natureza === "RECORRENTE", l.linhas[1].natureza);

console.log("\n— Natureza derivada, quando não há coluna —");
l = lerColagem(
  ["Descrição\tValor\tPeriodicidade", "Brindes\t27.000,00\tÚnico", "Licença\t500,00\tMensal"].join(
    "\n",
  ),
);
ok(
  "pagamento único vira compra pontual",
  l.linhas[0].natureza === "PONTUAL",
  l.linhas[0].natureza,
);
ok("e o aviso conta que foi derivado", l.linhas[0].avisos.some((a) => a.includes("compra pontual")));
ok("mensal segue recorrente", l.linhas[1].natureza === "RECORRENTE", l.linhas[1].natureza);
ok(
  "compra pontual sem data de aquisição avisa",
  l.linhas[0].avisos.some((a) => a.includes("pendência")),
  l.linhas[0].avisos.join(" · "),
);

console.log("\n— Contradição declarada é problema, não silêncio —");
l = lerColagem(
  ["Descrição\tValor\tPeriodicidade\tNatureza", "Coisa\t100,00\tÚnico\tRecorrente"].join("\n"),
);
ok(
  "recorrente com pagamento único não passa",
  l.linhas[0].problemas.some((p) => p.includes("escolha uma das duas")),
  l.linhas[0].problemas.join(" · "),
);
l = lerColagem(
  ["Descrição\tValor\tNatureza", "Coisa\t100,00\tsei lá o que"].join("\n"),
);
ok(
  "natureza ilegível é problema declarado",
  l.linhas[0].problemas.some((p) => p.includes("não reconheci a natureza")),
  l.linhas[0].problemas.join(" · "),
);

// ---------------------------------------------------------------------------
// "VENCIMENTO" NÃO É DATA DE RENOVAÇÃO
//
// A planilha de Marketing tem uma coluna VENCIMENTO com a data de cada boleto.
// Lida como fim de contrato, cada cobrança virava renovação e ia alimentar o
// alerta de vencimento com ruído.
// ---------------------------------------------------------------------------
console.log("\n— A coluna “Vencimento” não é adivinhada —");
const COM_VENCIMENTO = [
  "Descrição\tFornecedor\tValor\tVencimento",
  "Plano Premium\tObvio\t600,00\t10/04/2026",
].join("\n");
l = lerColagem(COM_VENCIMENTO);
ok("não cai em “Renova em”", l.mapa.dataFim === -1, String(l.mapa.dataFim));
ok("e a linha não ganha data de renovação", l.linhas[0].dataFim === null);
ok("mas a coluna é apontada como ambígua", l.ambiguas.length === 1, JSON.stringify(l.ambiguas));
ok(
  "com recado que diz o que fazer",
  l.ambiguas[0]?.recado.includes("Renova em"),
  l.ambiguas[0]?.recado ?? "",
);
ok(
  "“Renova em” continua sendo reconhecida",
  lerColagem(["Descrição\tValor\tRenova em", "Coisa\t10,00\t31/12/2026"].join("\n")).mapa
    .dataFim === 2,
);
ok(
  "coluna já mapeada não aparece como ambígua",
  colunasAmbiguas(["Descrição", "Vencimento"], {
    ...l.mapa,
    dataFim: 1,
  }).length === 0,
);

console.log("\n— Data de início —");
l = lerColagem(
  ["Descrição\tValor\tAquisição\tPeriodicidade", "Ecobag\t27.000,00\t15/08/2026\tÚnico"].join(
    "\n",
  ),
);
ok("mapeia “Aquisição” como início", l.mapa.dataInicio === 2, String(l.mapa.dataInicio));
ok(
  "e lê a data",
  l.linhas[0].dataInicio?.toISOString().slice(0, 10) === "2026-08-15",
  l.linhas[0].dataInicio?.toISOString().slice(0, 10) ?? "null",
);
ok(
  "com data de aquisição, o aviso de pendência não aparece",
  !l.linhas[0].avisos.some((a) => a.includes("pendência")),
  l.linhas[0].avisos.join(" · "),
);

// ---------------------------------------------------------------------------
// SOMA PARA CONFERÊNCIA
//
// A prévia dizia "entendi trinta linhas" e não dizia "entendi o mesmo
// dinheiro". Coluna de valor apontada para a vizinha mantém a contagem e muda
// o total.
// ---------------------------------------------------------------------------
console.log("\n— Soma do que vai entrar —");
let soma = somaColada(
  lerColagem(
    [
      "Descrição\tValor",
      "Um\t1.234,56",
      "Dois\t0,44",
      "Três\t",
      "Quatro\t10.000,00",
    ].join("\n"),
  ).linhas,
);
ok("soma em centavos, sem erro de ponto flutuante", soma.total === "11235.00", soma.total);
ok("conta quantas tinham valor", soma.comValor === 3, String(soma.comValor));
ok("e quantas ficaram a apurar", soma.semValor === 1, String(soma.semValor));
soma = somaColada([]);
ok("colagem vazia soma zero", soma.total === "0.00", soma.total);

console.log(falhas === 0 ? "\n✓ todos os casos passaram\n" : `\n✗ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
