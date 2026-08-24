"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { conferirSenha } from "@/lib/senha";
import { abrirSessao, authSecretConfigurada, ERRO_AUTH_SECRET } from "@/lib/sessao";
import { falha, texto, type Resultado } from "@/lib/acoes";
import { limparTentativas, tentativaPermitida } from "@/lib/limitador";

export async function entrar(_anterior: Resultado | null, dados: FormData): Promise<Resultado> {
  const email = texto(dados, "email").toLowerCase();
  const senha = texto(dados, "senha");

  if (!authSecretConfigurada()) return falha(ERRO_AUTH_SECRET, { email });
  if (!email || !senha) return falha("Informe e-mail e senha.", { email });

  if (!tentativaPermitida(`login:${email}`)) {
    return falha("Muitas tentativas para este e-mail. Aguarde 15 minutos e tente de novo.", {
      email,
    });
  }

  const usuario = await prisma.usuario.findFirst({
    where: { colaborador: { email } },
    select: { id: true, senhaHash: true, ativo: true, precisaTrocarSenha: true },
  });

  // Mesma mensagem para e-mail inexistente e senha errada: não entregamos a
  // quem tenta adivinhar a informação de quais e-mails existem.
  const generico = "E-mail ou senha incorretos.";
  const recusar = () => falha(generico, { email });

  if (!usuario || !usuario.ativo) {
    // Gasta o mesmo tempo de um scrypt real, para não vazar por temporização.
    await conferirSenha(senha, "scrypt$16384$8$1$YWJjZA$YWJjZA");
    return recusar();
  }

  if (!(await conferirSenha(senha, usuario.senhaHash))) return recusar();

  limparTentativas(`login:${email}`);
  await abrirSessao(usuario.id);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcesso: new Date() },
  });

  redirect(usuario.precisaTrocarSenha ? "/trocar-senha" : "/");
}
