import {
  lerColagem,
  lerData,
  lerPeriodicidade,
  pareceCabecalho,
  separarCelulas,
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
const muitas = Array.from({ length: 250 }, (_, i) => `Custo ${i}\tFornecedor\t100,00`).join("\n");
l = lerColagem(muitas);
ok("corta em 200 linhas", l.linhas.length === 200, `${l.linhas.length}`);
ok("e diz quantas ficaram de fora", l.cortadas === 50, `${l.cortadas}`);

console.log(falhas === 0 ? "\n✓ todos os casos passaram\n" : `\n✗ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
