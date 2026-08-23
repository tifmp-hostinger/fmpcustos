import { prisma } from "@/lib/db";

export type EstadoBanco =
  | { ok: true }
  | { ok: false; motivo: string; detalhe: string; causas: string[] };

/**
 * Verifica a conexão e se o schema já foi migrado.
 *
 * Existe para que uma falha de banco vire uma tela explicando o problema, em vez
 * de um erro 500 sem pista — que é como um deploy mal configurado aparece para
 * quem está operando o painel.
 */
export async function verificarBanco(): Promise<EstadoBanco> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      motivo: "DATABASE_URL não está definida",
      detalhe:
        "O serviço subiu sem a variável de conexão, então nenhuma consulta é possível.",
      causas: [
        "Defina DATABASE_URL nas variáveis de ambiente do serviço, no painel.",
        "Use o hostname interno do serviço Postgres do projeto, nunca localhost nem IP público.",
        "Formato: postgresql://usuario:senha@nome-do-servico:5432/banco?schema=public",
      ],
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (erro) {
    return {
      ok: false,
      motivo: "Não foi possível conectar ao banco",
      detalhe: String(erro).slice(0, 400),
      causas: [
        "DATABASE_URL aponta para localhost em vez do hostname interno do serviço Postgres.",
        "O serviço Postgres ainda não subiu, ou está com outro nome dentro do projeto.",
        "Usuário, senha ou nome do banco divergem do que o serviço Postgres criou.",
      ],
    };
  }

  try {
    await prisma.setor.count();
  } catch (erro) {
    return {
      ok: false,
      motivo: "Banco conectado, mas o schema não foi migrado",
      detalhe: String(erro).slice(0, 400),
      causas: [
        "As migrations falharam no start — veja o log do container.",
        "Aplique manualmente pelo terminal do serviço: prisma migrate deploy",
        "Depois popule os dados iniciais: prisma db seed",
      ],
    };
  }

  return { ok: true };
}
