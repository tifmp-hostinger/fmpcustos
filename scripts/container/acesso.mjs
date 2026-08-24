/**
 * ACESSO DE EMERGÊNCIA — para colar dentro do container.
 *
 * Existe porque as ferramentas em prisma/ só chegam ao container depois de um
 * redeploy, e quando ninguém consegue entrar isso é exatamente o que não dá
 * para esperar.
 *
 * Depende só de `pg` e node:crypto, que estão em qualquer versão da imagem.
 * Não usa Prisma Client, src/lib, nem nenhum arquivo do repositório.
 *
 *   # listar quem existe
 *   node /tmp/acesso.mjs
 *
 *   # criar ou redefinir o administrador
 *   node /tmp/acesso.mjs voce@fmp.com.br 'SuaSenhaForte2026'
 *
 * O hash gerado aqui usa o mesmo formato de src/lib/senha.ts
 * (scrypt$N$r$p$salt$hash), então a senha funciona no login normalmente.
 */
// Autossuficiente: usa só `pg` e node:crypto, que já existem na imagem.
// Não depende de src/lib, do Prisma Client nem de nenhum arquivo novo.
import { randomUUID, randomBytes, scrypt } from "node:crypto";
import pg from "pg";

const [, , email, senha] = process.argv;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const derivar = (s, salt, n) =>
  new Promise((ok, err) =>
    scrypt(s, salt, n, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? err(e) : ok(k))),
  );

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();

const { rows: usuarios } = await cliente.query(`
  SELECT c.email, c.nome, u.papel, u.ativo, (u."senhaHash" IS NOT NULL) AS tem_senha,
         u."precisaTrocarSenha", u."ultimoAcesso"
  FROM usuario u JOIN colaborador c ON c.id = u."colaboradorId"
  ORDER BY u."criadoEm"`);

console.log("");
console.log("======================================================================");
console.log(`USUÁRIOS NO BANCO: ${usuarios.length}`);
for (const u of usuarios) {
  console.log(
    `  ${u.email} | ${u.papel} | ativo=${u.ativo} | tem_senha=${u.tem_senha}` +
      ` | troca_no_1o=${u.precisaTrocarSenha} | ultimo_acesso=${u.ultimoAcesso ?? "nunca"}`,
  );
}
if (usuarios.length === 0) {
  console.log("  Nenhum. É por isso que o login recusa qualquer senha.");
}
console.log("======================================================================");

if (!email || !senha) {
  console.log("");
  console.log("Para criar ou redefinir o acesso, rode de novo assim:");
  console.log("  node /tmp/acesso.mjs seu@email.com 'SuaSenhaForte2026'");
  console.log("");
  await cliente.end();
  process.exit(0);
}

if (senha.length < 10 || !/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
  console.error("\nSenha recusada: mínimo 10 caracteres, com ao menos uma letra e um número.\n");
  await cliente.end();
  process.exit(1);
}

const alvo = email.trim().toLowerCase();
const salt = randomBytes(16);
const chave = await derivar(senha.normalize("NFKC"), salt, 64);
const hash = ["scrypt", 16384, 8, 1, salt.toString("base64url"), chave.toString("base64url")].join(
  "$",
);

const { rows: existentes } = await cliente.query(
  `SELECT c.id AS colaborador_id, u.id AS usuario_id
   FROM colaborador c LEFT JOIN usuario u ON u."colaboradorId" = c.id
   WHERE c.email = $1`,
  [alvo],
);

let acao;
if (existentes[0]?.usuario_id) {
  await cliente.query(
    `UPDATE usuario SET "senhaHash"=$1, "precisaTrocarSenha"=false, ativo=true,
            papel='ADMIN', "atualizadoEm"=now() WHERE id=$2`,
    [hash, existentes[0].usuario_id],
  );
  acao = "Senha redefinida (perfil ADMIN garantido).";
} else if (existentes[0]) {
  await cliente.query(
    `INSERT INTO usuario (id,"colaboradorId",papel,ativo,"senhaHash","precisaTrocarSenha","criadoEm","atualizadoEm")
     VALUES ($1,$2,'ADMIN',true,$3,false,now(),now())`,
    [randomUUID(), existentes[0].colaborador_id, hash],
  );
  acao = "Colaborador existia sem acesso; usuário ADMIN criado.";
} else {
  const idCol = randomUUID();
  await cliente.query(
    `INSERT INTO colaborador (id,nome,email,ativo,"criadoEm","atualizadoEm")
     VALUES ($1,$2,$3,true,now(),now())`,
    [idCol, alvo.split("@")[0], alvo],
  );
  await cliente.query(
    `INSERT INTO usuario (id,"colaboradorId",papel,ativo,"senhaHash","precisaTrocarSenha","criadoEm","atualizadoEm")
     VALUES ($1,$2,'ADMIN',true,$3,false,now(),now())`,
    [randomUUID(), idCol, hash],
  );
  acao = "Usuário ADMIN criado do zero.";
}

console.log("");
console.log("======================================================================");
console.log(acao);
console.log(`  E-mail: ${alvo}`);
console.log("  Senha:  a que você informou (sem troca obrigatória)");
console.log("======================================================================");
console.log("");
await cliente.end();
