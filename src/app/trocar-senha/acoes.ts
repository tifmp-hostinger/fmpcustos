"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { conferirSenha, gerarHashSenha, validarSenha } from "@/lib/senha";
import { sessaoAtual } from "@/lib/sessao";
import { falha, texto, type Resultado } from "@/lib/acoes";

export async function trocarSenha(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");

  const atual = texto(dados, "atual");
  const nova = texto(dados, "nova");
  const confirmacao = texto(dados, "confirmacao");

  if (nova !== confirmacao) return falha("A confirmação não confere com a nova senha.");

  const problema = validarSenha(nova);
  if (problema) return falha(problema);

  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.id },
    select: { senhaHash: true },
  });
  if (!(await conferirSenha(atual, usuario?.senhaHash ?? null))) {
    return falha("A senha atual está incorreta.");
  }
  if (await conferirSenha(nova, usuario?.senhaHash ?? null)) {
    return falha("A nova senha precisa ser diferente da atual.");
  }

  await prisma.usuario.update({
    where: { id: sessao.id },
    data: { senhaHash: await gerarHashSenha(nova), precisaTrocarSenha: false },
  });

  redirect("/");
}
