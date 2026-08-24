import {
  agruparPorPai,
  codigoDeNome,
  codigoLivre,
  descendentes,
  mesmoNome,
  podeApagar,
} from "../src/lib/organizacao";

/**
 * As regras de setor e categoria, sem banco.
 *
 * Duas delas merecem teste com nome próprio: o ciclo na hierarquia, que não dá
 * erro ao gravar e trava a travessia da árvore depois — inclusive a que monta o
 * próprio seletor —, e a colisão de nome com um registro INATIVO, que é
 * justamente o caso em que a pessoa jura que não existe e cria a duplicata.
 */
let falhas = 0;
function ok(nome: string, condicao: boolean, extra = "") {
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
  if (!condicao) falhas++;
}

console.log("\n— O código sai do nome —");
ok('"Software" → SOFTWARE', codigoDeNome("Software") === "SOFTWARE", codigoDeNome("Software"));
ok(
  "acento sai, espaço vira hífen",
  codigoDeNome("Comunicação e Marketing") === "COMUNICACAO-E-MARKETING",
  codigoDeNome("Comunicação e Marketing"),
);
ok(
  "pontuação não vaza para o código",
  codigoDeNome("T.I. / Infra") === "T-I-INFRA",
  codigoDeNome("T.I. / Infra"),
);
ok(
  "nome só de símbolos não gera código vazio",
  codigoDeNome("!!!") === "SEM-CODIGO",
  codigoDeNome("!!!"),
);
ok("código longo é cortado", codigoDeNome("A".repeat(80)).length === 30);

console.log("\n— Colisão de código resolve sozinha —");
const ocupados = new Set(["SOFTWARE"]);
ok('"SOFTWARE" ocupado vira SOFTWARE-2', codigoLivre("SOFTWARE", ocupados) === "SOFTWARE-2");
ocupados.add("SOFTWARE-2");
ok("e depois SOFTWARE-3", codigoLivre("SOFTWARE", ocupados) === "SOFTWARE-3");
ok("livre continua livre", codigoLivre("INFRA", ocupados) === "INFRA");

console.log("\n— Nome igual, mesmo com acento e caixa diferentes —");
const existentes = [
  { id: "a", nome: "Comunicação e Marketing", ativo: true },
  { id: "b", nome: "Software", ativo: false },
];
ok("mesma grafia", mesmoNome("Comunicação e Marketing", existentes)?.id === "a");
ok("sem acento", mesmoNome("Comunicacao e Marketing", existentes)?.id === "a");
ok("caixa diferente", mesmoNome("COMUNICAÇÃO E MARKETING", existentes)?.id === "a");
ok("com pontuação a mais", mesmoNome("Comunicação, e Marketing.", existentes)?.id === "a");
// O caso que produz duplicata na vida real: a pessoa não vê "Software" na
// lista, porque está inativo, e cria de novo.
ok("colide com o INATIVO também", mesmoNome("software", existentes)?.id === "b");
ok("e devolve que ele está inativo", mesmoNome("software", existentes)?.ativo === false);
ok("renomear a si mesmo não colide", mesmoNome("Software", existentes, "b") === null);
ok("nome de fato novo não colide", mesmoNome("Infraestrutura", existentes) === null);
ok("nome vazio não colide", mesmoNome("   ", existentes) === null);

console.log("\n— Ciclo na hierarquia —");
// TI > Infra > Redes. Pôr TI abaixo de Redes fecharia o ciclo, e a travessia da
// árvore passaria a girar para sempre — inclusive a que monta o seletor.
const arvore = [
  { id: "ti", paiId: null },
  { id: "infra", paiId: "ti" },
  { id: "redes", paiId: "infra" },
  { id: "rh", paiId: null },
];
const mapa = agruparPorPai(arvore);
const proibidos = descendentes("ti", mapa);
ok("o próprio é proibido", proibidos.has("ti"));
ok("o filho é proibido", proibidos.has("infra"));
ok("o neto também", proibidos.has("redes"));
ok("um ramo de fora é permitido", !proibidos.has("rh"));
ok("uma folha não proíbe ninguém além de si", descendentes("redes", mapa).size === 1);

console.log("\n— O que pode ser apagado —");
const limpo = podeApagar({ custos: 0, contratos: 0 });
ok("nunca usado pode sumir", limpo.pode && limpo.motivo === null);

const usado = podeApagar({ "custos rateados": 3, contratos: 0, subsetores: 1 });
ok("usado não pode", !usado.pode);
ok(
  "e a frase diz o que segura",
  usado.motivo?.includes("3 custos rateados") === true,
  usado.motivo ?? "—",
);
// Singular quando é um só: "1 subsetores" é o descuido que faz uma tela
// cuidadosa parecer descuidada.
ok(
  "e o segundo motivo vem no singular",
  usado.motivo?.includes("1 subsetor") === true && usado.motivo?.includes("1 subsetores") === false,
  usado.motivo ?? "—",
);
const umSo = podeApagar({ "custos rateados": 1 }).motivo ?? "";
ok(
  "rótulo composto também flexiona",
  umSo.includes("1 custo rateado") && !umSo.includes("1 custos"),
  umSo,
);
ok("e aponta a saída que existe", usado.motivo?.includes("Inativar") === true, usado.motivo ?? "—");

console.log(falhas === 0 ? "\nTudo certo.\n" : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
