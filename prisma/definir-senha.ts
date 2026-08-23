/**
 * Define a senha de um usuário. Para rodar DENTRO do container.
 *
 *   npx tsx prisma/definir-senha.ts <email> '<senha>'
 *
 * Se o usuário não existir, ele é criado como ADMIN — é o caminho para destravar
 * uma instalação nova sem depender de variáveis de ambiente. Quem roda isto já
 * tem shell no container, ou seja, já tem controle total; a ferramenta não abre
 * nenhuma porta que não estivesse aberta.
 *
 * Diferente do seed, aqui não há idempotência protetora: o comando é explícito,
 * a pessoa digitou o e-mail e a senha, e a intenção é inequívoca.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { gerarHashSenha, validarSenha } from "../src/lib/senha";

async function main() {
  const [emailBruto, senha] = process.argv.slice(2);

  if (!emailBruto || !senha) {
    console.error("");
    console.error("Uso: npx tsx prisma/definir-senha.ts <email> '<senha>'");
    console.error("");
    console.error("Exemplo:");
    console.error("  npx tsx prisma/definir-senha.ts admin@fmp.com.br 'FmpCustos2026'");
    console.error("");
    console.error("Use aspas simples em volta da senha, para o shell não interpretar");
    console.error("caracteres como $ e !.");
    process.exit(1);
  }

  const email = emailBruto.trim().toLowerCase();

  const problema = validarSenha(senha);
  if (problema) {
    console.error("");
    console.error(`Senha recusada: ${problema}`);
    console.error("Regra: ao menos 10 caracteres, com pelo menos uma letra e um número.");
    console.error("");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não está definida.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const senhaHash = await gerarHashSenha(senha);

  const colaborador = await prisma.colaborador.findUnique({
    where: { email },
    select: { id: true, nome: true, usuario: { select: { id: true, papel: true } } },
  });

  let acao: string;

  if (colaborador?.usuario) {
    await prisma.usuario.update({
      where: { id: colaborador.usuario.id },
      data: { senhaHash, precisaTrocarSenha: false, ativo: true },
    });
    acao = `Senha redefinida para ${colaborador.nome} (perfil ${colaborador.usuario.papel}).`;
  } else if (colaborador) {
    await prisma.usuario.create({
      data: { colaboradorId: colaborador.id, papel: "ADMIN", senhaHash, precisaTrocarSenha: false },
    });
    acao = `O colaborador ${colaborador.nome} existia sem acesso; usuário ADMIN criado.`;
  } else {
    const nome = email.split("@")[0];
    const novo = await prisma.colaborador.create({
      data: {
        nome,
        email,
        usuario: { create: { papel: "ADMIN", senhaHash, precisaTrocarSenha: false } },
      },
      select: { nome: true },
    });
    acao = `Usuário ADMIN criado para ${novo.nome}.`;
  }

  console.log("");
  console.log("======================================================================");
  console.log(acao);
  console.log("");
  console.log(`  E-mail: ${email}`);
  console.log("  Senha:  a que você acabou de informar");
  console.log("");
  console.log("Entre no sistema com esses dados. O sistema NÃO vai pedir troca de");
  console.log("senha, porque você a definiu explicitamente.");
  console.log("======================================================================");
  console.log("");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
