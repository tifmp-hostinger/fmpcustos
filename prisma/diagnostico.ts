/**
 * Diagnóstico do ambiente, para rodar DENTRO do container.
 *
 *   npx tsx prisma/diagnostico.ts
 *
 * Só faz leitura. Responde as perguntas que a mensagem de login não pode
 * responder — por design, ela é genérica para não revelar quais e-mails
 * existem, o que é correto para quem ataca e péssimo para quem opera.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const linha = () =>
  console.log("----------------------------------------------------------------------");

function mascarar(url: string): string {
  // Cobre usuário vazio e senha contendo "@": tudo entre "://" e o ÚLTIMO "@"
  // antes do host é credencial e vira ***.
  return url.replace(/(:\/\/)([^/]*)@/, (_t, prefixo: string, cred: string) => {
    const usuario = cred.split(":")[0];
    return `${prefixo}${usuario}:***@`;
  });
}

async function main() {
  console.log("");
  linha();
  console.log("DIAGNÓSTICO — CUSTOS FMP");
  linha();

  // 1. Variáveis de ambiente -------------------------------------------------
  const url = process.env.DATABASE_URL;
  const segredo = process.env.AUTH_SECRET;

  console.log("");
  console.log("1. VARIÁVEIS DE AMBIENTE");
  console.log(`   DATABASE_URL ......... ${url ? mascarar(url) : "AUSENTE"}`);
  console.log(
    `   AUTH_SECRET .......... ${
      !segredo
        ? "AUSENTE — ninguém consegue entrar"
        : segredo.length < 16
          ? `CURTA DEMAIS (${segredo.length} caracteres; mínimo 16)`
          : `ok (${segredo.length} caracteres)`
    }`,
  );
  console.log(`   ADMIN_EMAIL .......... ${process.env.ADMIN_EMAIL ?? "(não definida)"}`);

  if (!url) {
    console.log("");
    console.log("   Sem DATABASE_URL não dá para continuar o diagnóstico.");
    linha();
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  // 2. Conexão e esquema -----------------------------------------------------
  console.log("");
  console.log("2. BANCO DE DADOS");
  try {
    const [info] = await prisma.$queryRawUnsafe<Array<{ banco: string; usuario: string }>>(
      "SELECT current_database() AS banco, current_user AS usuario",
    );
    console.log(`   Conectado ............ sim`);
    console.log(`   Banco ................ ${info.banco}`);
    console.log(`   Usuário .............. ${info.usuario}`);
  } catch (erro) {
    console.log(`   Conectado ............ NÃO`);
    console.log(`   Erro ................. ${String(erro).slice(0, 200)}`);
    linha();
    await prisma.$disconnect();
    return;
  }

  let temEsquema = true;
  try {
    await prisma.setor.count();
  } catch {
    temEsquema = false;
  }
  console.log(`   Esquema aplicado ..... ${temEsquema ? "sim" : "NÃO — rode: prisma migrate deploy"}`);

  if (!temEsquema) {
    linha();
    await prisma.$disconnect();
    return;
  }

  // 3. Carga inicial ---------------------------------------------------------
  const [setores, categorias, capacidades, itens] = await Promise.all([
    prisma.setor.count(),
    prisma.categoria.count(),
    prisma.capacidade.count(),
    prisma.itemCusto.count(),
  ]);
  console.log("");
  console.log("3. CARGA INICIAL");
  console.log(`   Setores .............. ${setores} ${setores === 13 ? "(esperado: 13)" : "— esperado 13; rode: prisma db seed"}`);
  console.log(`   Categorias ........... ${categorias}`);
  console.log(`   Capacidades .......... ${capacidades}`);
  console.log(`   Custos cadastrados ... ${itens}`);

  // 4. Usuários --------------------------------------------------------------
  const usuarios = await prisma.usuario.findMany({
    select: {
      papel: true,
      ativo: true,
      senhaHash: true,
      precisaTrocarSenha: true,
      ultimoAcesso: true,
      colaborador: { select: { nome: true, email: true, setor: { select: { nome: true } } } },
    },
    orderBy: { criadoEm: "asc" },
  });

  console.log("");
  console.log(`4. USUÁRIOS (${usuarios.length})`);

  if (usuarios.length === 0) {
    console.log("");
    console.log("   NENHUM USUÁRIO EXISTE. É por isso que o login recusa qualquer senha:");
    console.log("   não há com quem entrar. A mensagem é genérica de propósito, para não");
    console.log("   revelar quais e-mails existem — o que esconde justamente este caso.");
    console.log("");
    console.log("   Crie o administrador com:");
    console.log("     npx tsx prisma/definir-senha.ts seu@email.com 'SuaSenhaForte2026'");
  } else {
    for (const u of usuarios) {
      console.log("");
      console.log(`   ${u.colaborador.email}`);
      console.log(`     Nome ............... ${u.colaborador.nome}`);
      console.log(`     Perfil ............. ${u.papel}`);
      console.log(`     Setor .............. ${u.colaborador.setor?.nome ?? "(sem setor)"}`);
      console.log(`     Ativo .............. ${u.ativo ? "sim" : "NÃO — não consegue entrar"}`);
      console.log(
        `     Tem senha .......... ${u.senhaHash ? "sim" : "NÃO — nunca vai conseguir entrar"}`,
      );
      console.log(`     Troca no 1º acesso . ${u.precisaTrocarSenha ? "sim" : "não"}`);
      console.log(
        `     Último acesso ...... ${u.ultimoAcesso ? u.ultimoAcesso.toISOString() : "nunca entrou"}`,
      );
    }
    console.log("");
    console.log("   Para redefinir a senha de qualquer um deles:");
    console.log("     npx tsx prisma/definir-senha.ts <email> 'NovaSenhaForte2026'");
  }

  console.log("");
  linha();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
