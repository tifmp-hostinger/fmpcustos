/**
 * Gera scripts/sql/02-dados-iniciais.sql a partir da MESMA lista usada pelo
 * seed da aplicação, para que as duas formas de popular o banco não divirjam.
 *
 *   npx tsx scripts/gerar-sql-dados.ts
 *
 * O SQL gerado é deliberadamente simples: sem transação, sem blocos DO $$, sem
 * funções que dependam da versão do PostgreSQL. Ele precisa rodar tanto por
 * psql quanto colado num cliente gráfico, e um cliente gráfico costuma dividir
 * o script por ponto e vírgula — o que quebra qualquer bloco mais elaborado.
 */
import { writeFileSync } from "node:fs";

const SETORES: Array<[string, string]> = [
  ["FIN", "Financeiro e Tesouraria"],
  ["TI", "Tecnologia da Informação"],
  ["COM", "Comercial"],
  ["PRE", "Assessoria da Presidência"],
  ["NEAD", "NEAD"],
  ["BIB", "Biblioteca"],
  ["MEST", "Mestrado"],
  ["ACAD", "Assessoria Acadêmica"],
  ["COMU", "Comunicação"],
  ["ATEND", "Atendimento e Relacionamento"],
  ["FAC", "Facilities"],
  ["CPR", "Compras"],
  ["JUR", "Jurídico"],
];

const CATEGORIAS: Array<[string, string, string | null]> = [
  ["TEC", "Tecnologia", null],
  ["TEC.TELECOM", "Telecomunicação", "TEC"],
  ["TEC.INFRA", "Infraestrutura", "TEC"],
  ["TEC.SIST", "Sistemas", "TEC"],
  ["TEC.LIC", "Licenças", "TEC"],
  ["PRED", "Predial e Facilities", null],
  ["PRED.UTIL", "Utilidades (energia, água)", "PRED"],
  ["PRED.MANUT", "Manutenção e limpeza", "PRED"],
  ["SERV", "Serviços profissionais", null],
  ["SERV.JUR", "Assessoria jurídica", "SERV"],
  ["SERV.CONT", "Contabilidade e auditoria", "SERV"],
  ["ACADEM", "Acadêmico", null],
  ["ACADEM.AVA", "Ambientes de aprendizagem", "ACADEM"],
  ["ACADEM.ACERVO", "Acervo e bases de pesquisa", "ACADEM"],
  ["MKT", "Marketing e captação", null],
  ["FINAN", "Financeiro e bancário", null],
];

const CAPACIDADES: Array<[string, string]> = [
  ["VIDEOCONF", "Videoconferência"],
  ["GESTAO_PROJ", "Gestão de projetos"],
  ["AVA", "Ambiente virtual de aprendizagem"],
  ["CHAT", "Chat e atendimento"],
  ["TELEFONIA", "Telefonia"],
  ["CRM", "CRM e captação"],
  ["ASSIN_DIG", "Assinatura digital"],
  ["HOSPEDAGEM", "Hospedagem e infraestrutura"],
  ["ERP", "ERP e backoffice"],
  ["RH", "Gestão de pessoas"],
  ["BI", "BI e relatórios"],
  ["SERVICE_DESK", "Service desk e ativos"],
  ["ARMAZ_VIDEO", "Armazenamento de vídeo"],
  ["SEGURANCA", "Segurança e antivírus"],
  ["BIBLIO", "Gestão de biblioteca"],
  ["IMPRESSAO", "Impressão e digitalização"],
];

const aspas = (v: string) => `'${v.replace(/'/g, "''")}'`;

/**
 * IDs fixos e legíveis, em vez de gen_random_uuid().
 *
 * gen_random_uuid() só é nativa no PostgreSQL 13+; antes disso exige a extensão
 * pgcrypto e permissão de superusuário, que nem sempre existe num banco
 * gerenciado. Gerar o id aqui remove a dependência de versão e ainda torna o
 * registro rastreável: dá para ver de olho o que veio da carga inicial.
 */
const id = (prefixo: string, codigo: string) =>
  `seed_${prefixo}_${codigo.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

const linhas: string[] = [
  "-- ============================================================================",
  "-- 02 · DADOS INICIAIS",
  "--",
  "-- Os 13 setores da FMP, a árvore de categorias e o catálogo de capacidades.",
  "--",
  "-- Como rodar:",
  '--   psql "$DATABASE_URL" -f scripts/sql/02-dados-iniciais.sql',
  "-- ou cole o conteúdo inteiro no seu cliente de banco.",
  "--",
  "-- SEM transação, de propósito. Cada comando é independente e idempotente,",
  "-- então o cliente mostra o erro REAL do comando que falhou, em vez de",
  '-- "current transaction is aborted" (25P02) — que só informa que algo',
  "-- anterior falhou e esconde a causa. Rodar de novo é seguro: nada duplica.",
  "--",
  '-- Se aparecer "relation ... does not exist": o esquema ainda não foi criado.',
  "-- Rode antes o 01-esquema.sql, ou deixe o container aplicar as migrations.",
  "--",
  "-- GERADO POR scripts/gerar-sql-dados.ts — não edite à mão.",
  "-- ============================================================================",
  "",
  "-- Setores --------------------------------------------------------------",
  'INSERT INTO "setor" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES',
  SETORES.map(
    ([codigo, nome]) =>
      `  (${aspas(id("setor", codigo))}, ${aspas(codigo)}, ${aspas(nome)}, true, now(), now())`,
  ).join(",\n") + "\nON CONFLICT (codigo) DO NOTHING;",
  "",
  "-- Categorias raiz ------------------------------------------------------",
  'INSERT INTO "categoria" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES',
  CATEGORIAS.filter(([, , pai]) => pai === null)
    .map(
      ([codigo, nome]) =>
        `  (${aspas(id("cat", codigo))}, ${aspas(codigo)}, ${aspas(nome)}, true, now(), now())`,
    )
    .join(",\n") + "\nON CONFLICT (codigo) DO NOTHING;",
  "",
  "-- Subcategorias --------------------------------------------------------",
];

for (const [codigo, nome, pai] of CATEGORIAS.filter(([, , p]) => p !== null)) {
  linhas.push(
    'INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")',
    `SELECT ${aspas(id("cat", codigo))}, ${aspas(codigo)}, ${aspas(nome)}, true, p.id, now(), now()`,
    `FROM "categoria" p WHERE p.codigo = ${aspas(pai as string)}`,
    "ON CONFLICT (codigo) DO NOTHING;",
    "",
  );
}

linhas.push(
  "-- Capacidades funcionais -----------------------------------------------",
  'INSERT INTO "capacidade" (id, codigo, nome) VALUES',
  CAPACIDADES.map(
    ([codigo, nome]) => `  (${aspas(id("cap", codigo))}, ${aspas(codigo)}, ${aspas(nome)})`,
  ).join(",\n") + "\nON CONFLICT (codigo) DO NOTHING;",
  "",
  "-- Conferência: deve mostrar 13 setores, 16 categorias e 16 capacidades ---",
  "SELECT (SELECT count(*) FROM setor)      AS setores,",
  "       (SELECT count(*) FROM categoria)  AS categorias,",
  "       (SELECT count(*) FROM capacidade) AS capacidades;",
  "",
);

writeFileSync("scripts/sql/02-dados-iniciais.sql", linhas.join("\n"), "utf8");
console.log("scripts/sql/02-dados-iniciais.sql gerado.");
