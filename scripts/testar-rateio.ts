import { Decimal } from "decimal.js";
import {
  balancear,
  dividirIgualmente,
  textoDeUnidades,
  unidadesDeTexto,
  valoresEmReais,
  percentualParaBanco,
  problemas,
  podeArredondar,
  arredondar,
  ESCALA,
  TOTAL,
} from "../src/lib/rateio";

let falhas = 0;
function ok(nome: string, condicao: boolean, extra = "") {
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
  if (!condicao) falhas++;
}

const f = (setorId: string, pct: number, ancora = false) => ({
  setorId,
  unidades: Math.round(pct * ESCALA),
  ancora,
});

console.log("\n— O caso exato que o usuário descreveu —");
// "se eu to com um custo de 100 e adiociono um outro de 10
//  não deveria ficar 110 e sim ja diminuir automaticamente para 90 em um e 10 no outro"
let fatias = [f("TI", 100, true)];
ok("uma linha só: TI fica com 100%", balancear(fatias).ancora === TOTAL);

fatias = [f("TI", 0, true), f("Comercial", 10)];
let b = balancear(fatias);
ok(
  "entra Comercial com 10% → TI cai para 90%",
  textoDeUnidades(b.ancora) === "90,00",
  `TI=${textoDeUnidades(b.ancora)}%`,
);
ok("soma fecha em 100%", b.fatias.reduce((s, x) => s + x.unidades, 0) === TOTAL);

console.log("\n— Adicionar terceiro setor não mexe no segundo —");
fatias = [f("TI", 0, true), f("Comercial", 60), f("Acadêmico", 5.5)];
b = balancear(fatias);
ok("Comercial permanece em 60%", textoDeUnidades(b.fatias[1].unidades) === "60,00");
ok("Acadêmico permanece em 5,50%", textoDeUnidades(b.fatias[2].unidades) === "5,50");
ok(
  "TI absorve o resto: 34,50%",
  textoDeUnidades(b.ancora) === "34,50",
  `TI=${textoDeUnidades(b.ancora)}%`,
);

console.log("\n— Excedente vira erro na linha, não estado 110% —");
fatias = [f("TI", 0, true), f("Comercial", 96), f("Acadêmico", 5.5)];
b = balancear(fatias);
ok("âncora negativa é detectada", b.ancora < 0 && !b.fecha, `âncora=${textoDeUnidades(b.ancora)}%`);
const nomes = new Map([
  ["TI", "TI"],
  ["Comercial", "Comercial"],
  ["Acadêmico", "Acadêmico"],
]);
const p = problemas(fatias, nomes);
ok("o erro aponta a linha do Comercial (índice 1)", p.length === 1 && p[0].indice === 1);
console.log(`         mensagem: "${p[0]?.mensagem}"`);

console.log("\n— Terços: 33,33 × 3 tem de somar 100 —");
const tres = dividirIgualmente(3);
ok("três fatias somam exatamente 100%", tres.reduce((a, x) => a + x, 0) === TOTAL);
ok(
  "exibidas como 33,33%",
  tres.map(textoDeUnidades).join(" / ") === "33,33 / 33,33 / 33,33",
  tres.map(textoDeUnidades).join(" / "),
);
ok(
  "gravadas com 4 casas",
  tres.map(percentualParaBanco).join(" / ") === "33.3334 / 33.3333 / 33.3333",
  tres.map(percentualParaBanco).join(" / "),
);
const sete = dividirIgualmente(7);
ok("sete fatias também somam 100%", sete.reduce((a, x) => a + x, 0) === TOTAL);

console.log("\n— O centavo tem dono —");
fatias = [f("TI", 0, true), f("Comercial", 33.33), f("Acadêmico", 33.33)];
b = balancear(fatias);
let reais = valoresEmReais(b.fatias, "1000.00");
let soma = reais.reduce<Decimal>((s, v) => s.plus(v ?? 0), new Decimal(0));
ok(
  "R$ 1.000,00 dividido fecha ao centavo",
  soma.toFixed(2) === "1000.00",
  `soma=${soma.toFixed(2)}`,
);
console.log(
  `         TI=${reais[0]?.toFixed(2)}  Comercial=${reais[1]?.toFixed(2)}  Acadêmico=${reais[2]?.toFixed(2)}`,
);

fatias = [
  f("TI", 0, true),
  ...dividirIgualmente(3)
    .slice(1)
    .map((u, i) => ({ setorId: `S${i}`, unidades: u, ancora: false })),
];
reais = valoresEmReais(balancear(fatias).fatias, "1234.57");
soma = reais.reduce<Decimal>((s, v) => s.plus(v ?? 0), new Decimal(0));
ok("R$ 1.234,57 em três também fecha", soma.toFixed(2) === "1234.57", `soma=${soma.toFixed(2)}`);

console.log("\n— Leitura do que a pessoa digita —");
ok('"60" → 60,00%', textoDeUnidades(unidadesDeTexto("60")!) === "60,00");
ok('"60,5" → 60,50%', textoDeUnidades(unidadesDeTexto("60,5")!) === "60,50");
ok('"60.5" → 60,50%', textoDeUnidades(unidadesDeTexto("60.5")!) === "60,50");
ok('"60%" → 60,00%', textoDeUnidades(unidadesDeTexto("60%")!) === "60,00");
ok('"" → null (não é zero)', unidadesDeTexto("") === null);
ok('"abc" → null', unidadesDeTexto("abc") === null);
ok('"-5" → null', unidadesDeTexto("-5") === null);

console.log("\n— Arredondar 59,70/40,30 —");
fatias = [f("TI", 0, true), f("Comercial", 59.7)];
ok("oferece arredondar", podeArredondar(fatias));
ok("59,70 vira 60,00", textoDeUnidades(arredondar(fatias)[1].unidades) === "60,00");
fatias = [f("TI", 0, true), f("Comercial", 47.3)];
ok("não oferece para 47,30 (longe demais)", !podeArredondar(fatias));

console.log(falhas === 0 ? "\n✓ todos os casos passaram\n" : `\n✗ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
