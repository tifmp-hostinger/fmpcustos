"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { gerarHashSenha, gerarSenhaTemporaria } from "@/lib/senha";
import { exigirAdmin } from "@/lib/sessao";
import { falha, opcaoValida, sucesso, texto, textoOpcional, type Resultado } from "@/lib/acoes";
import type { PapelUsuario } from "@/generated/prisma/enums";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAPEIS = ["ADMIN", "GESTOR_SETOR", "GESTOR_CONTRATO", "CONTROLADORIA", "LEITOR"] as const;

export async function criarUsuario(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const admin = await exigirAdmin();

  const nome = texto(dados, "nome").slice(0, 150);
  const email = texto(dados, "email").toLowerCase();
  const papel = opcaoValida<PapelUsuario>(dados, "papel", PAPEIS);
  const setorId = textoOpcional(dados, "setorId");

  if (!nome) return falha("Informe o nome.");
  if (!EMAIL.test(email)) return falha("E-mail inválido.");
  if (!papel) return falha("Perfil inválido.");
  if (papel !== "ADMIN" && papel !== "CONTROLADORIA" && !setorId) {
    return falha("Escolha o setor deste usuário.");
  }

  // Case-insensitive: um e-mail legado gravado com maiúsculas ainda é duplicata.
  const jaExiste = await prisma.colaborador.count({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (jaExiste > 0) return falha("Já existe um usuário com este e-mail.");

  const senhaTemporaria = gerarSenhaTemporaria();

  let criado: { id: string };
  try {
    criado = await prisma.colaborador.create({
      data: {
        nome,
        email,
        setorId,
        usuario: {
          create: {
            papel,
            senhaHash: await gerarHashSenha(senhaTemporaria),
            precisaTrocarSenha: true,
          },
        },
      },
      select: { id: true },
    });
  } catch (erro) {
    // Corrida entre duas criações do mesmo e-mail: o unique do banco decide.
    if ((erro as { code?: string }).code === "P2002") {
      return falha("Já existe um usuário com este e-mail.");
    }
    throw erro;
  }

  await prisma.auditoria.create({
    data: {
      tabela: "colaborador",
      registroId: criado.id,
      acao: "CRIACAO",
      usuarioId: admin.id,
      diff: { depois: { nome, email, papel, setorId } },
    },
  });

  revalidatePath("/admin/usuarios");
  return sucesso(
    `Usuário criado. Senha temporária de ${nome}: ${senhaTemporaria} — repasse com segurança. Ela será trocada no primeiro acesso.`,
  );
}

export async function atualizarUsuario(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const admin = await exigirAdmin();

  const id = texto(dados, "id");
  const papel = opcaoValida<PapelUsuario>(dados, "papel", PAPEIS);
  const setorId = textoOpcional(dados, "setorId");
  const ativo = texto(dados, "ativo") === "on";

  if (!id) return falha("Usuário não informado.");
  if (!papel) return falha("Perfil inválido.");
  if (papel !== "ADMIN" && papel !== "CONTROLADORIA" && !setorId) {
    return falha("Escolha o setor deste usuário.");
  }

  let usuario: { colaboradorId: string };
  try {
    // Checagem e alteração na MESMA transação serializável: dois admins se
    // rebaixando ao mesmo tempo não podem deixar o sistema sem administrador.
    usuario = await prisma.$transaction(
      async (tx) => {
        const alvo = await tx.usuario.findUnique({ where: { id }, select: { papel: true } });
        if (!alvo) throw new Error("nao-encontrado");

        const viraNaoAdmin = alvo.papel === "ADMIN" && (papel !== "ADMIN" || !ativo);
        if (viraNaoAdmin) {
          const outros = await tx.usuario.count({
            where: { papel: "ADMIN", ativo: true, id: { not: id } },
          });
          if (outros === 0) throw new Error("ultimo-admin");
        }

        return tx.usuario.update({
          where: { id },
          data: { papel, ativo, colaborador: { update: { setorId } } },
          select: { colaboradorId: true },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (erro) {
    const mensagem = (erro as Error).message;
    if (mensagem === "ultimo-admin") {
      return falha(
        "Este é o único administrador ativo. Promova outro usuário antes de rebaixá-lo ou desativá-lo.",
      );
    }
    if (mensagem === "nao-encontrado" || (erro as { code?: string }).code === "P2025") {
      return falha("Usuário não encontrado.");
    }
    throw erro;
  }

  await prisma.auditoria.create({
    data: {
      tabela: "usuario",
      registroId: id,
      acao: "ALTERACAO",
      usuarioId: admin.id,
      diff: { depois: { papel, setorId, ativo, colaboradorId: usuario.colaboradorId } },
    },
  });

  revalidatePath("/admin/usuarios");
  return sucesso("Usuário atualizado.");
}

export async function resetarSenha(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  if (!id) return falha("Usuário não informado.");

  const senhaTemporaria = gerarSenhaTemporaria();
  let usuario: { colaborador: { nome: string } };
  try {
    usuario = await prisma.usuario.update({
      where: { id },
      data: {
        senhaHash: await gerarHashSenha(senhaTemporaria),
        precisaTrocarSenha: true,
      },
      select: { colaborador: { select: { nome: true } } },
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === "P2025") return falha("Usuário não encontrado.");
    throw erro;
  }

  await prisma.auditoria.create({
    data: {
      tabela: "usuario",
      registroId: id,
      acao: "ALTERACAO",
      usuarioId: admin.id,
      diff: { depois: { senhaResetada: true } },
    },
  });

  revalidatePath("/admin/usuarios");
  return sucesso(
    `Nova senha temporária de ${usuario.colaborador.nome}: ${senhaTemporaria} — repasse com segurança.`,
  );
}
