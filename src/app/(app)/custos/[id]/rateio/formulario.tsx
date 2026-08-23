"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { proporRateio } from "./acoes";
import { Aviso, Enviar } from "@/components/campos";
import { IconeMais } from "@/components/icones";
import type { Resultado } from "@/lib/acoes";

type Opcao = { valor: string; rotulo: string };
type Linha = { setorId: string; pct: string };

export function FormularioRateio({
  itemId,
  setores,
  inicial,
  aplicaDireto,
}: {
  itemId: string;
  setores: Opcao[];
  inicial: Linha[];
  aplicaDireto: boolean;
}) {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(proporRateio, null);
  const [linhas, setLinhas] = useState<Linha[]>(
    inicial.length > 0 ? inicial : [{ setorId: "", pct: "100" }],
  );

  const soma = linhas.reduce((s, l) => s + (Number(l.pct.replace(",", ".")) || 0), 0);
  const fecha = Math.abs(soma - 100) <= 0.01;

  const atualizar = (i: number, campo: keyof Linha, valor: string) =>
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  return (
    <form action={acao} className="mt-8 space-y-5">
      <input type="hidden" name="itemId" value={itemId} />

      <div className="space-y-2.5">
        {linhas.map((linha, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <select
              name={`setor_${i}`}
              value={linha.setorId}
              onChange={(e) => atualizar(i, "setorId", e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
            >
              <option value="">Escolha o setor…</option>
              {setores.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
            <div className="relative w-28 shrink-0">
              <input
                name={`pct_${i}`}
                value={linha.pct}
                onChange={(e) => atualizar(i, "pct", e.target.value)}
                inputMode="decimal"
                aria-label={`Percentual da linha ${i + 1}`}
                className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] py-2 pl-3 pr-8 text-right text-[15px] tabular-nums outline-none focus:border-[var(--accent)]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-[var(--ink-3)]">
                %
              </span>
            </div>
            {linhas.length > 1 && (
              <button
                type="button"
                onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
                aria-label={`Remover linha ${i + 1}`}
                className="shrink-0 rounded-lg border border-[var(--rule)] px-2.5 py-2 text-[13px] text-[var(--ink-3)] hover:text-[var(--accent)]"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setLinhas((ls) => [...ls, { setorId: "", pct: "" }])}
          disabled={linhas.length >= 13}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] disabled:opacity-40"
        >
          <IconeMais className="size-4" />
          Adicionar setor
        </button>
        <p
          className={`text-[13px] font-semibold tabular-nums ${
            fecha ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--accent)]"
          }`}
          aria-live="polite"
        >
          Soma: {soma.toFixed(2).replace(".", ",")}% {fecha ? "✓" : "— precisa dar 100%"}
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
          Justificativa (opcional, ajuda quem vai aceitar)
        </span>
        <textarea
          name="justificativa"
          rows={2}
          placeholder="Ex.: o CRM é usado pela captação — a operação é do Comercial."
          className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
        />
      </label>

      <Aviso resultado={resultado} />

      <div className="flex items-center gap-3">
        <Enviar>{aplicaDireto ? "Aplicar rateio" : "Enviar proposta"}</Enviar>
        <Link
          href={`/custos/${itemId}`}
          className="text-sm text-[var(--ink-3)] no-underline hover:underline"
        >
          Cancelar
        </Link>
      </div>
      {!aplicaDireto && (
        <p className="text-[12px] text-[var(--ink-3)]">
          Cada setor que recebe uma fatia precisa aceitar. A proposta aparece na tela inicial do
          gestor da área, e só entra em vigor quando todos aceitarem.
        </p>
      )}
    </form>
  );
}
