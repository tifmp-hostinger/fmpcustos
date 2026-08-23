/**
 * Gera o SQL que cria o primeiro administrador.
 *
 * A senha vira hash scrypt aqui, na sua máquina — o arquivo SQL nunca carrega
 * a senha em texto. Por isso este passo é um gerador, e não um .sql fixo no
 * repositório.
 *
 *   npx tsx scripts/gerar-sql-admin.ts "voce@fmp.com.br" "Seu Nome" "suaSenhaForte123"
 *
 * Sem o terceiro argumento, uma senha temporária é sorteada e impressa uma vez.
 */
import { writeFileSync } from "node:fs";
import { gerarHashSenha, gerarSenhaTemporaria, validarSenha } from "../src/lib/senha";

const aspas = (v: string) => `'${v.replace(/'/g, "''")}'`;

async function main() {
  const [email, nome, senhaArg] = process.argv.slice(2);

  if (!email || !nome) {
    console.error(
      'Uso: npx tsx scripts/gerar-sql-admin.ts "email@fmp.com.br" "Nome Completo" ["senha"]',
    );
    process.exit(1);
  }

  const definidaPeloOperador = Boolean(senhaArg);
  const senha = senhaArg ?? gerarSenhaTemporaria();

  if (definidaPeloOperador) {
    const problema = validarSenha(senha);
    if (problema) {
      console.error(problema);
      process.exit(1);
    }
  }

  const hash = await gerarHashSenha(senha);
  const destino = "scripts/sql/03-administrador.sql";

  const sql = `-- ============================================================================
-- 03 · PRIMEIRO ADMINISTRADOR
--
-- GERADO por scripts/gerar-sql-admin.ts. Contém o HASH da senha, nunca a senha.
-- Não versione este arquivo se ele foi gerado com uma senha real.
--
-- Como rodar:
--   psql "$DATABASE_URL" -f ${destino}
-- ============================================================================

BEGIN;

INSERT INTO "colaborador" (id, nome, email, ativo, "criadoEm", "atualizadoEm")
VALUES (gen_random_uuid()::text, ${aspas(nome)}, ${aspas(email.toLowerCase())}, true, now(), now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO "usuario" (id, "colaboradorId", papel, ativo, "senhaHash", "precisaTrocarSenha", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, c.id, 'ADMIN', true, ${aspas(hash)}, ${definidaPeloOperador ? "false" : "true"}, now(), now()
FROM "colaborador" c
WHERE c.email = ${aspas(email.toLowerCase())}
ON CONFLICT ("colaboradorId") DO UPDATE
  SET papel = 'ADMIN',
      ativo = true,
      "senhaHash" = EXCLUDED."senhaHash",
      "precisaTrocarSenha" = EXCLUDED."precisaTrocarSenha";

COMMIT;
`;

  writeFileSync(destino, sql, "utf8");

  console.log(`${destino} gerado.`);
  console.log("");
  console.log("======================================================================");
  console.log(`  E-mail: ${email.toLowerCase()}`);
  if (definidaPeloOperador) {
    console.log("  Senha:  a que você passou no comando");
  } else {
    console.log(`  Senha:  ${senha}`);
    console.log("  Temporária — o sistema pede a troca no primeiro acesso.");
    console.log("  Ela não será exibida de novo.");
  }
  console.log("======================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
