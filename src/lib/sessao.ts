import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { PapelUsuario } from "@/generated/prisma/enums";

const COOKIE = "fmp_sessao";
const DURACAO_SEGUNDOS = 60 * 60 * 12; // 12 horas

/**
 * `sv` é a "versão de senha": um resumo do hash da senha no momento do login.
 * Trocar ou resetar a senha muda o hash — e derruba, na hora, toda sessão
 * emitida antes. Sem isso, um cookie roubado sobreviveria à troca de senha
 * pelas 12h restantes de validade.
 */
type Conteudo = { uid: string; exp: number; sv: string };

export function versaoDeSenha(senhaHash: string | null): string {
  return createHash("sha256")
    .update(senhaHash ?? "sem-senha")
    .digest("base64url")
    .slice(0, 12);
}

export const ERRO_AUTH_SECRET =
  "AUTH_SECRET não está definida (ou tem menos de 16 caracteres). " +
  "Sem ela é impossível assinar a sessão. Gere uma com: openssl rand -base64 32 " +
  "e defina nas variáveis de ambiente do serviço.";

export function authSecretConfigurada(): boolean {
  const valor = process.env.AUTH_SECRET;
  return Boolean(valor && valor.length >= 16);
}

function segredo(): string {
  if (!authSecretConfigurada()) throw new Error(ERRO_AUTH_SECRET);
  return process.env.AUTH_SECRET!;
}

function assinar(dados: string): string {
  return createHmac("sha256", segredo()).update(dados).digest("base64url");
}

function criarToken(uid: string, sv: string): string {
  const conteudo: Conteudo = {
    uid,
    sv,
    exp: Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS,
  };
  const corpo = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

function lerToken(token: string): Conteudo | null {
  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;

  const esperada = Buffer.from(assinar(corpo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) {
    return null;
  }

  try {
    const conteudo = JSON.parse(Buffer.from(corpo, "base64url").toString()) as Conteudo;
    if (conteudo.exp < Math.floor(Date.now() / 1000)) return null;
    return conteudo;
  } catch {
    return null;
  }
}

/**
 * O cookie só recebe a flag `Secure` quando a requisição realmente chegou por
 * HTTPS. Amarrar isso a NODE_ENV quebra o login em qualquer acesso por HTTP —
 * o navegador descarta o cookie em silêncio e a pessoa volta para a tela de
 * login sem nenhuma mensagem. Atrás do proxy do EasyPanel, com SSL ativo,
 * x-forwarded-proto é `https` e a flag entra normalmente.
 */
async function requisicaoSegura(): Promise<boolean> {
  const cabecalhos = await headers();
  const proto = cabecalhos.get("x-forwarded-proto");
  return proto ? proto.split(",")[0].trim() === "https" : false;
}

export async function abrirSessao(usuarioId: string): Promise<void> {
  const registro = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { senhaHash: true },
  });
  const jar = await cookies();
  jar.set(COOKIE, criarToken(usuarioId, versaoDeSenha(registro?.senhaHash ?? null)), {
    httpOnly: true,
    sameSite: "lax",
    secure: await requisicaoSegura(),
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function fecharSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export type UsuarioSessao = {
  id: string;
  papel: PapelUsuario;
  nome: string;
  email: string;
  precisaTrocarSenha: boolean;
  setorId: string | null;
  setorNome: string | null;
};

/** Usuário autenticado, ou null. Não redireciona. */
export async function sessaoAtual(): Promise<UsuarioSessao | null> {
  // Sem segredo não existe sessão válida. Devolver null manda a pessoa para o
  // login, onde a causa aparece escrita — melhor que um 500 sem explicação.
  if (!authSecretConfigurada()) return null;

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const conteudo = lerToken(token);
  if (!conteudo) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: conteudo.uid },
    select: {
      id: true,
      papel: true,
      ativo: true,
      senhaHash: true,
      precisaTrocarSenha: true,
      colaborador: {
        select: {
          nome: true,
          email: true,
          ativo: true,
          setorId: true,
          setor: { select: { nome: true } },
        },
      },
    },
  });

  // colaborador.ativo entra na checagem: desligar a pessoa no cadastro tem que
  // revogar o acesso mesmo que ninguém lembre de desativar o usuário.
  if (!usuario || !usuario.ativo || !usuario.colaborador.ativo) return null;
  if (conteudo.sv !== versaoDeSenha(usuario.senhaHash)) return null;

  return {
    id: usuario.id,
    papel: usuario.papel,
    nome: usuario.colaborador.nome,
    email: usuario.colaborador.email,
    precisaTrocarSenha: usuario.precisaTrocarSenha,
    setorId: usuario.colaborador.setorId,
    setorNome: usuario.colaborador.setor?.nome ?? null,
  };
}

/** Usuário autenticado, ou redireciona para o login. */
export async function exigirSessao(): Promise<UsuarioSessao> {
  const usuario = await sessaoAtual();
  if (!usuario) redirect("/login");
  if (usuario.precisaTrocarSenha) redirect("/trocar-senha");
  return usuario;
}

export async function exigirAdmin(): Promise<UsuarioSessao> {
  const usuario = await exigirSessao();
  if (usuario.papel !== "ADMIN") redirect("/");
  return usuario;
}

// ---------------------------------------------------------------------------
// Escopo de acesso
// ---------------------------------------------------------------------------

/** Enxerga todos os setores. */
export function vePorInteiro(papel: PapelUsuario): boolean {
  return papel === "ADMIN" || papel === "CONTROLADORIA";
}

/** Pode criar e editar lançamentos de custo. */
export function podeLancar(papel: PapelUsuario): boolean {
  return papel === "ADMIN" || papel === "GESTOR_SETOR" || papel === "GESTOR_CONTRATO";
}

/**
 * Setores que o usuário enxerga.
 * `null` significa "todos" — quem vê por inteiro não tem lista de setores.
 */
export function setoresVisiveis(usuario: UsuarioSessao): string[] | null {
  if (vePorInteiro(usuario.papel)) return null;
  return usuario.setorId ? [usuario.setorId] : [];
}

export const ROTULO_PAPEL: Record<PapelUsuario, string> = {
  ADMIN: "Administrador",
  GESTOR_SETOR: "Gestor de setor",
  GESTOR_CONTRATO: "Gestor de contrato",
  CONTROLADORIA: "Controladoria",
  LEITOR: "Leitor",
};
