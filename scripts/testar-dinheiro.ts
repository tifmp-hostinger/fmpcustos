import {
  emReais,
  formatarCambio,
  formatarMoeda,
  lerCambioDigitado,
  lerValorDigitado,
  precisaDeCambio,
  valorAnualEmReais,
  valorMensalEmReais,
  valorMensalNaMoeda,
} from "../src/lib/dinheiro";

let falhas = 0;
function ok(nome: string, condicao: boolean, extra = "") {
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
  if (!condicao) falhas++;
}

console.log("\n— O defeito que originou este módulo —");
// Um custo de US$ 500/mês entrava no total da FMP como R$ 500.
const semTaxa = valorMensalEmReais("500.00", "MENSAL", "USD", null);
ok("US$ 500/mês sem cotação NÃO vira R$ 500", semTaxa === null, String(semTaxa));

const comTaxa = valorMensalEmReais("500.00", "MENSAL", "USD", "5.4321");
ok("US$ 500/mês a 5,4321 vira R$ 2.716,05", comTaxa?.toFixed(2) === "2716.05", comTaxa?.toFixed(2));

console.log("\n— Real continua sendo real —");
ok(
  "R$ 500/mês continua R$ 500",
  valorMensalEmReais("500.00", "MENSAL", "BRL", null)?.toFixed(2) === "500.00",
);
ok(
  "câmbio informado num item em real é ignorado",
  valorMensalEmReais("500.00", "MENSAL", "BRL", "5.4321")?.toFixed(2) === "500.00",
);

console.log("\n— Os dois eixos juntos: periodicidade e moeda —");
// US$ 6.000 por ano a 5,4321 = R$ 32.592,60 no ano = R$ 2.716,05 por mês.
const anual = valorMensalEmReais("6000.00", "ANUAL", "USD", "5.4321");
ok("US$ 6.000/ano a 5,4321 = R$ 2.716,05/mês", anual?.toFixed(2) === "2716.05", anual?.toFixed(2));
ok(
  "e o anual em real fecha em R$ 32.592,60",
  valorAnualEmReais("6000.00", "ANUAL", "USD", "5.4321")?.toFixed(2) === "32592.60",
);

// A ordem da conta importa: converter antes de dividir evita o centavo de
// diferença entre o total do painel e a soma das linhas.
const trimestral = valorMensalEmReais("1000.00", "TRIMESTRAL", "USD", "5.123456");
ok(
  "trimestral converte antes de dividir",
  trimestral?.toFixed(2) === "1707.82",
  trimestral?.toFixed(2),
);

console.log("\n— Periodicidade sem equivalente mensal —");
ok("pagamento único não tem mensal", valorMensalEmReais("500", "UNICO", "USD", "5.4321") === null);
ok("por consumo não tem mensal", valorMensalEmReais("500", "SOB_DEMANDA", "BRL", null) === null);

console.log("\n— O valor mensal na moeda do próprio item —");
ok(
  "US$ 6.000/ano = US$ 500,00/mês, sem passar por real",
  valorMensalNaMoeda("6000.00", "ANUAL")?.toFixed(2) === "500.00",
);

console.log("\n— Conversão: os casos que precisam sair da conta —");
ok("valor nulo → null", emReais(null, "USD", "5.43") === null);
ok("taxa nula em moeda estrangeira → null", emReais("100", "EUR", null) === null);
ok("taxa zero → null", emReais("100", "EUR", "0") === null);
ok("taxa negativa → null", emReais("100", "EUR", "-5") === null);
ok("euro a 6 → R$ 600", emReais("100", "EUR", "6")?.toFixed(2) === "600.00");

console.log("\n— Quem ainda precisa de cotação —");
ok("real nunca precisa", precisaDeCambio("BRL", null) === false);
ok("dólar sem taxa precisa", precisaDeCambio("USD", null) === true);
ok("dólar com taxa não precisa", precisaDeCambio("USD", "5.43") === false);
ok("dólar com taxa zero ainda precisa", precisaDeCambio("USD", "0") === true);

console.log("\n— Leitura da cotação: a regra é OUTRA, e é de propósito —");
// "5.4321" é cinco vírgula quatro mil trezentos e vinte e um. Se passasse pela
// regra do milhar brasileiro viraria 54.321 — um dólar a cinquenta e quatro mil
// reais multiplicaria o total da FMP por dez mil.
ok('"5.4321" é 5,4321 e não 54.321', lerCambioDigitado("5.4321") === "5.432100");
ok('"5,4321" também', lerCambioDigitado("5,4321") === "5.432100");
ok('"5" vira 5,000000', lerCambioDigitado("5") === "5.000000");
ok('"R$ 5,43" tolera o símbolo', lerCambioDigitado("R$ 5,43") === "5.430000");
ok("vazio → null", lerCambioDigitado("") === null);
ok("dois separadores → null", lerCambioDigitado("5.43.21") === null);
ok("zero → null", lerCambioDigitado("0") === null);
ok("acima de 1000 → null", lerCambioDigitado("5000") === null);
ok("dedo escorregou: 54321 → null", lerCambioDigitado("54321") === null);

// A regra do dinheiro continua sendo a do dinheiro: aqui "1.234" É mil e tanto.
ok('dinheiro: "1.234" continua 1234,00', lerValorDigitado("1.234") === "1234.00");

console.log("\n— Formatação —");
ok("real", formatarMoeda("1234.56", "BRL").replace(/ /g, " ") === "R$ 1.234,56");
ok("dólar", formatarMoeda("500", "USD").replace(/ /g, " ") === "US$ 500,00");
ok("euro", formatarMoeda("90", "EUR").replace(/ /g, " ") === "€ 90,00");
ok("nulo vira travessão", formatarMoeda(null, "USD") === "—");
ok("cotação sem zeros decorativos", formatarCambio("5.432100") === "5,4321");
ok("cotação redonda", formatarCambio("6.000000") === "6");
ok("cotação nula", formatarCambio(null) === "—");

console.log(falhas === 0 ? "\nTudo certo.\n" : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
