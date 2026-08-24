import { NextResponse } from "next/server";
import { ehTarefa, executar, tokenAutorizado, TAREFAS } from "@/lib/rotinas";

export const dynamic = "force-dynamic";

/**
 * O gancho do cron.
 *
 * `POST /api/rotinas/alertas` com `Authorization: Bearer <ROTINAS_TOKEN>`.
 *
 * POST e não GET de propósito: as duas tarefas escrevem no banco, e um GET que
 * altera estado é disparado por qualquer pré-carregamento de link, verificador
 * de disponibilidade ou robô que passe pela URL.
 *
 * A resposta traz o que a rotina fez — quantos alertas nasceram, quantos foram
 * resolvidos, quantos e-mails saíram. É o que permite descobrir que o SMTP está
 * mudo sem esperar alguém reclamar de não receber resumo.
 */
export async function POST(
  requisicao: Request,
  { params }: { params: Promise<{ tarefa: string }> },
) {
  if (!tokenAutorizado(requisicao.headers.get("authorization"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const { tarefa } = await params;
  if (!ehTarefa(tarefa)) {
    return NextResponse.json(
      { erro: "tarefa desconhecida", disponiveis: TAREFAS },
      { status: 404 },
    );
  }

  const resultado = await executar(tarefa);
  // 500 quando a tarefa falhou: o cron precisa conseguir avisar. Um 200 com
  // `ok: false` no corpo é lido como sucesso por qualquer monitoramento.
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 500 });
}
