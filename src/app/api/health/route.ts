import { NextResponse } from "next/server";
import { verificarBanco } from "@/lib/estado-banco";

export const dynamic = "force-dynamic";

/**
 * Liveness do processo, com o estado do banco no corpo.
 *
 * Responde 200 sempre que a aplicação está de pé, mesmo com o banco fora. Se
 * respondesse 503 nesse caso, o HEALTHCHECK do container marcaria o serviço como
 * não saudável e o proxy deixaria de rotear — trocando um diagnóstico legível por
 * um erro genérico de "não abre".
 */
export async function GET() {
  const banco = await verificarBanco();

  return NextResponse.json({
    status: "ok",
    banco: banco.ok ? "conectado" : "indisponivel",
    ...(banco.ok ? {} : { motivo: banco.motivo, causas: banco.causas }),
  });
}
