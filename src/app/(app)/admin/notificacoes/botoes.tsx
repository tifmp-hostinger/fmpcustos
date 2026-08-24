"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { conferirSmtp, enviarParaMim, varrerAgora } from "./acoes";
import { useAviso } from "@/components/avisos";
import type { Resultado } from "@/lib/acoes";

const ACOES = { conferirSmtp, enviarParaMim, varrerAgora } as const;

/**
 * Botão que roda uma rotina e conta o que aconteceu.
 *
 * Nenhum deles é um "salvar": os três são diagnósticos, e o valor está inteiro
 * na resposta. Por isso a resposta vai para o aviso, com detalhe, e não some em
 * dois segundos — quem clicou está lendo.
 */
export function BotaoDeRotina({
  acao,
  rotulo,
  ocupadoRotulo,
  primario,
}: {
  acao: keyof typeof ACOES;
  rotulo: string;
  ocupadoRotulo: string;
  primario?: boolean;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function executar() {
    setOcupado(true);
    const r: Resultado = await ACOES[acao]();
    setOcupado(false);

    avisar(
      r.ok
        ? { mensagem: r.mensagem ?? "Pronto.", detalhe: r.detalhe, duracao: 14_000 }
        : { mensagem: r.erro, tom: "erro", duracao: 14_000 },
    );
    if (r.ok) router.refresh();
  }

  return (
    <button
      type="button"
      data-rotina={acao}
      onClick={() => void executar()}
      disabled={ocupado}
      className={
        primario
          ? "rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          : "rounded-lg border border-[var(--rule)] px-3.5 py-2 text-dado font-medium text-[var(--ink-2)] hover:border-[var(--ink-3)] disabled:opacity-50"
      }
    >
      {ocupado ? ocupadoRotulo : rotulo}
    </button>
  );
}
