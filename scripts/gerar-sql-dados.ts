/**
 * Gera scripts/sql/02-dados-iniciais.sql a partir do MESMO seed usado pela
 * aplicação, para que as duas formas de popular o banco nunca divirjam.
 *
 *   npx tsx scripts/gerar-sql-dados.ts
 */
import { writeFileSync } from "node:fs";

const SETORES = [
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

const CAPACIDADES = [
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
 * gen_random_uuid() só é nativo no PostgreSQL 13+; antes disso exige a extensão
 * pgcrypto e permissão de superusuário, que nem sempre existe num banco
 * gerenciado. Gerar o id aqui remove a dependência e ainda torna o registro
 * rastreável: dá para ver de olho o que veio da carga inicial.
 */
const id = (prefixo: string, codigo: string) =>
  `seed_${prefixo}_${codigo.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

const linhas: string[] = [
  "-- ============================================================================",
  "-- 02 · DADOS INICIAIS",
  "--",
  "-- Os 13 setores da FMP, a árvore de categorias e o catálogo de capacidades.",
  "-- Idempotente: rodar de novo não duplica nada.",
  "--",
  "-- Como rodar:",
  '--   psql "$DATABASE_URL" -f scripts/sql/02-dados-iniciais.sql',
  "--",
  "-- SE VOCÊ VIR \"current transaction is aborted\" (SQL state 25P02):",
  "-- esse NÃO é o erro. Ele apenas informa que alguma instrução ANTERIOR falhou",
  "-- e que o resto do bloco foi ignorado. Role até o PRIMEIRO erro da saída —",
  "-- é ele que diz o que aconteceu. Em cliente gráfico o primeiro erro costuma",
  "-- ficar escondido acima; rodando por psql ele aparece no topo.",
  "--",
  "-- GERADO POR scripts/gerar-sql-dados.ts — não edite à mão.",
  "-- ============================================================================",
  "",
  "BEGIN;",
  "",
  "-- Guarda: sem o esquema, a mensagem precisa dizer o que fazer -----------",
  "DO $$",
  "BEGIN",
  "  IF to_regclass('public.setor') IS NULL THEN",
  "    RAISE EXCEPTION 'O esquema ainda nao existe neste banco. Rode antes: psql \"$DATABASE_URL\" -f scripts/sql/01-esquema.sql (ou deixe o container aplicar as migrations no start).';",
  "  END IF;",
  "END $$;",
  "",
  "-- Setores ---------------------------------------------------------------",
  'INSERT INTO "setor" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES',
];

linhas.push(
  SETORES.map(
    ([codigo, nome]) =>
      `  (${aspas(id("setor", codigo))}, ${aspas(codigo)}, ${aspas(nome)}, true, now(), now())`,
  ).join(",\n") + "\nON CONFLICT (codigo) DO NOTHING;",
  "",
  "-- Categorias raiz -------------------------------------------------------",
  'INSERT INTO "categoria" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES',
  CATEGORIAS.filter(([, , pai]) => pai === null)
    .map(([codigo, nome]) => `  (${aspas(id("cat", codigo))}, ${aspas(codigo)}, ${aspas(nome)}, true, now(), now())`)
    .join(",\n") + "\nON CONFLICT (codigo) DO NOTHING;",
  "",
  "-- Subcategorias ---------------------------------------------------------",
);

for (const [codigo, nome, pai] of CATEGORIAS.filter(([, , p]) => p !== null)) {
  linhas.push(
    `INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")`,
    `SELECT ${aspas(id("cat", codigo))}, ${aspas(codigo)}, ${aspas(nome)}, true, p.id, now(), now()`,
    `FROM "categoria" p WHERE p.codigo = ${aspas(pai!)}`,
    "ON CONFLICT (codigo) DO NOTHING;",
    "",
  );
}

linhas.push(
  "-- Capacidades funcionais ------------------------------------------------",
  'INSERT INTO "capacidade" (id, codigo, nome) VALUES',
  CAPACIDADES.map(([codigo, nome]) => `  (${aspas(id("cap", codigo))}, ${aspas(codigo)}, ${aspas(nome)})`).join(
    ",\n",
  ) + "\nON CONFLICT (codigo) DO NOTHING;",
  "",
  "COMMIT;",
  "",
);

writeFileSync("scripts/sql/02-dados-iniciais.sql", linhas.join("\n"), "utf8");
console.log("scripts/sql/02-dados-iniciais.sql gerado.");
