import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Usado pelo healthcheck do container no EasyPanel. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", banco: "conectado" });
  } catch (erro) {
    return NextResponse.json(
      { status: "degradado", banco: "indisponivel", erro: String(erro) },
      { status: 503 },
    );
  }
}
