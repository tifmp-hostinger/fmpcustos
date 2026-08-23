/**
 * Gera scripts/sql/04-acesso-emergencia.sql: um SQL que cria (ou redefine) o
 * administrador, com o hash da senha já calculado.
 *
 *   npx tsx scripts/gerar-sql-acesso.ts <email> '<senha>'
 *
 * Existe para o caso em que ninguém consegue entrar e as ferramentas em
 * prisma/ ainda não chegaram ao container. SQL puro é o menor denominador
 * comum: não depende de redeploy, de Node dentro do container, nem de colar
 * base64 gigante em terminal web — que foi exatamente onde as tentativas
 * anteriores quebraram.
 *
 * O arquivo gerado NÃO deve ser versionado com uma senha real.
 */
import { writeFileSync } from "node:fs";
import { gerarHashSenha, validarSenha } from "../src/lib/senha";

const aspas = (v: string) => `'${v.replace(/'/g, "''")}'`;

async function main() {
  const [emailBruto, senha] = process.argv.slice(2);
  if (!emailBruto || !senha) {
    console.error("Uso: npx tsx scripts/gerar-sql-acesso.ts <email> '<senha>'");
    process.exit(1);
  }

  const problema = validarSenha(senha);
  if (problema) {
    console.error(`Senha recusada: ${problema}`);
    process.exit(1);
  }

  const email = emailBruto.trim().toLowerCase();
  const hash = await gerarHashSenha(senha);
  const destino = "scripts/sql/04-acesso-emergencia.sql";

  writeFileSync(
    destino,
    `-- ============================================================================
-- ACESSO DE EMERGÊNCIA — cria (ou redefine) o administrador.
--
-- E-mail: ${email}
-- Senha:  a que foi passada ao gerador (o SQL guarda só o hash)
--
-- GERADO por scripts/gerar-sql-acesso.ts. Não versione com senha real.
--
-- Sem transação: se algo falhar, aparece a causa real, não "25P02".
-- Rodar de novo é seguro — redefine a senha para a mesma.
-- ============================================================================

-- 1. Quem já existe? (se vier vazio, é por isso que o login recusa tudo)
SELECT c.email, u.papel, u.ativo, (u."senhaHash" IS NOT NULL) AS tem_senha
FROM usuario u JOIN colaborador c ON c.id = u."colaboradorId";

-- 2. Cria o colaborador, se ainda não existir.
INSERT INTO colaborador (id, nome, email, ativo, "criadoEm", "atualizadoEm")
VALUES ('boot_colab_admin', 'Administrador', ${aspas(email)}, true, now(), now())
ON CONFLICT (email) DO NOTHING;

-- 3. Cria o usuário ADMIN, ou redefine a senha se ele já existir.
INSERT INTO usuario (id, "colaboradorId", papel, ativo, "senhaHash", "precisaTrocarSenha", "criadoEm", "atualizadoEm")
SELECT 'boot_user_admin', c.id, 'ADMIN', true, ${aspas(hash)}, false, now(), now()
FROM colaborador c WHERE c.email = ${aspas(email)}
ON CONFLICT ("colaboradorId") DO UPDATE
  SET "senhaHash" = EXCLUDED."senhaHash",
      papel = 'ADMIN',
      ativo = true,
      "precisaTrocarSenha" = false,
      "atualizadoEm" = now();

-- 4. Confirmação: deve listar o e-mail acima como ADMIN, ativo, com senha.
SELECT c.email, u.papel, u.ativo, (u."senhaHash" IS NOT NULL) AS tem_senha
FROM usuario u JOIN colaborador c ON c.id = u."colaboradorId";
`,
    "utf8",
  );

  console.log(`${destino} gerado para ${email}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
