"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { gerarHashSenha, gerarSenhaTemporaria } from "@/lib/senha";
import { exigirAdmin } from "@/lib/sessao";
import { falha, sucesso, texto, textoOpcional, type Resultado } from "@/lib/acoes";
import type { PapelUsuario } from "@/generated/prisma/enums";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function criarUsuario(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  await exigirAdmin();

  const nome = texto(dados, "nome");
  const email = texto(dados, "email").toLowerCase();
  const papel = texto(dados, "papel") as PapelUsuario;
  const setorId = textoOpcional(dados, "setorId");

  if (!nome) return falha("Informe o nome.");
  if (!EMAIL.test(email)) return falha("E-mail inválido.");
  if (papel !== "ADMIN" && papel !== "CONTROLADORIA" && !setorId) {
    return falha("Escolha o setor deste usuário.");
  }

  const jaExiste = await prisma.colaborador.count({ where: { email } });
  if (jaExiste > 0) return falha("Já existe um usuário com este e-mail.");

  const senhaTemporaria = gerarSenhaTemporaria();

  await prisma.colaborador.create({
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
  const papel = texto(dados, "papel") as PapelUsuario;
  const setorId = textoOpcional(dados, "setorId");
  const ativo = texto(dados, "ativo") === "on";

  if (!id) return falha("Usuário não informado.");
  if (papel !== "ADMIN" && papel !== "CONTROLADORIA" && !setorId) {
    return falha("Escolha o setor deste usuário.");
  }

  // Não deixar o sistema ficar sem nenhum administrador ativo.
  if (id === admin.id && (papel !== "ADMIN" || !ativo)) {
    const outros = await prisma.usuario.count({
      where: { papel: "ADMIN", ativo: true, id: { not: id } },
    });
    if (outros === 0) {
      return falha(
        "Você é o único administrador ativo. Promova outro usuário antes de mudar o seu perfil.",
      );
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { papel, ativo, colaborador: { update: { setorId } } },
    select: { colaboradorId: true },
  });

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
  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      senhaHash: await gerarHashSenha(senhaTemporaria),
      precisaTrocarSenha: true,
    },
    select: { colaborador: { select: { nome: true } } },
  });

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
