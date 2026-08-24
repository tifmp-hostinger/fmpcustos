"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirResumo } from "./acoes";
import { useAviso } from "@/components/avisos";

/**
 * O interruptor do resumo semanal.
 *
 * Fica no fim da lista de alertas, discreto, porque a pergunta "quero isso por
 * e-mail?" só aparece depois de ver o que o e-mail traria. E existe porque um
 * resumo sem saída vira spam interno em dois meses — e aí a próxima coisa que a
 * FMP faz é criar uma regra de caixa de entrada que arquiva tudo, inclusive o
 * alerta que importava.
 */
export function PreferenciaResumo({
  inicial,
  smtpConfigurado,
}: {
  inicial: boolean;
  smtpConfigurado: boolean;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [, transicao] = useTransition();
  const [receber, setReceber] = useState(inicial);
  const [gravando, setGravando] = useState(false);

  async function alternar(novo: boolean) {
    setReceber(novo);
    setGravando(true);

    const dados = new FormData();
    dados.set("receber", String(novo));
    const r = await definirResumo(dados);
    setGravando(false);

    if (!r.ok) {
      setReceber(!novo);
      avisar({ mensagem: r.erro, tom: "erro" });
      return;
    }
    avisar({ mensagem: r.mensagem ?? "Pronto." });
    transicao(() => router.refresh());
  }

  return (
    <div className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="resumoSemanal"
          checked={receber}
          disabled={gravando}
          onChange={(e) => void alternar(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--accent)]"
        />
        <span className="text-[13.5px]">
          <span className="font-medium">Receber o resumo semanal por e-mail</span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-3)]">
            {smtpConfigurado
              ? "Uma vez por semana, só quando houver algo pendente. Semana sem novidade não vira e-mail."
              : // Dizer isto é melhor que deixar a caixa marcada prometendo um
                // e-mail que nunca sai — e o administrador precisa saber disso
                // sem esperar alguém reclamar.
                "O envio de e-mail ainda não foi configurado no servidor. A preferência fica guardada e passa a valer quando for."}
          </span>
        </span>
      </label>
    </div>
  );
}
