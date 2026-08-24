import { normalizar, parecidos } from "../src/lib/fornecedores";

let falhas = 0;
function ok(nome: string, condicao: boolean, extra = "") {
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
  if (!condicao) falhas++;
}

console.log("\n— Forma comparável —");
ok(
  '"Microsoft LTDA" e "Microsoft" viram o mesmo',
  normalizar("Microsoft LTDA") === normalizar("Microsoft"),
);
ok('"MICROSOFT" e "microsoft " também', normalizar("MICROSOFT") === normalizar("microsoft "));
ok('"Thomson Reuters S/A" perde o sufixo', normalizar("Thomson Reuters S/A") === "thomson reuters");
ok(
  "acento não distingue",
  normalizar("Serviços Gráficos") === "servicos graficos",
  normalizar("Serviços Gráficos"),
);
ok('um fornecedor chamado só "ME" sobrevive', normalizar("ME") === "me", normalizar("ME"));
ok(
  '"Editora RT" continua distinto de "Editora"',
  normalizar("Editora RT") !== normalizar("Editora"),
);

console.log("\n— O caso que mata o gráfico de concentração —");
const cadastrados = ["Microsoft", "Adobe", "Thomson Reuters", "Vivo", "TOTVS", "Meta Platforms"];
let c = parecidos("Microsoft Brasil", cadastrados);
ok(
  "“Microsoft Brasil” sugere “Microsoft”",
  c[0]?.nome === "Microsoft" && c[0].motivo === "contido",
  JSON.stringify(c),
);
c = parecidos("MICROSOFT LTDA", cadastrados);
ok(
  "“MICROSOFT LTDA” é reconhecido como o mesmo",
  c[0]?.nome === "Microsoft" && c[0].motivo === "igual",
  JSON.stringify(c),
);
c = parecidos("Adobee", cadastrados);
ok(
  "“Adobee” é apontado como engano de digitação",
  c[0]?.nome === "Adobe" && c[0].motivo === "parecido",
  JSON.stringify(c),
);
c = parecidos("Thompson Reuters", cadastrados);
ok(
  "“Thompson Reuters” encontra “Thomson Reuters”",
  c[0]?.nome === "Thomson Reuters",
  JSON.stringify(c),
);

console.log("\n— Não pode alarmar à toa —");
ok("nome idêntico não vira aviso", parecidos("Microsoft", cadastrados).length === 0);
ok(
  "fornecedor genuinamente novo passa limpo",
  parecidos("Hostinger", cadastrados).length === 0,
  JSON.stringify(parecidos("Hostinger", cadastrados)),
);
ok(
  "nome curto não confunde com outro curto",
  parecidos("Vivo", ["Nivo", "Claro"]).length === 0,
  JSON.stringify(parecidos("Vivo", ["Nivo", "Claro"])),
);
ok("duas letras não disparam nada", parecidos("Oi", cadastrados).length === 0);
ok(
  "“Meta” e “Meta Platforms” são ligados",
  parecidos("Meta", cadastrados)[0]?.nome === "Meta Platforms",
);

console.log("\n— Custo de comparação —");
const muitos = Array.from({ length: 500 }, (_, i) => `Fornecedor Número ${i}`);
const antes = process.hrtime.bigint();
parecidos("Fornecedor Número 250", muitos);
const ms = Number(process.hrtime.bigint() - antes) / 1e6;
ok("500 fornecedores comparados em menos de 50ms", ms < 50, `${ms.toFixed(1)}ms`);

console.log(falhas === 0 ? "\n✓ todos os casos passaram\n" : `\n✗ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
