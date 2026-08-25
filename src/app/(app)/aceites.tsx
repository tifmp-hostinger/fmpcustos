"use client";

import { useActionState } from "react";
import Link from "next/link";
import { decidirAceite } from "./custos/[id]/rateio/acoes";
import { Aviso } from "@/components/campos";
import type { Resultado } from "@/lib/acoes";

/**
 * Cartão de decisão de uma fatia de rateio proposta ao setor do usuário.
 * É a "notificação": mora na tela inicial do gestor, onde ele olha todo dia.
 */
export function CartaoAceite({
  parcela,
}: {
  parcela: {
    id: string;
    percentual: string;
    itemId: string;
    itemDescricao: string;
    valorMensal: string | null;
    proponente: string;
    setorProponente: string | null;
    justificativa: string | null;
  };
}) {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(decidirAceite, null);

  if (resultado?.ok) {
    return (
      <li className="rounded-lg bg-[var(--surface)] px-4 py-3 text-dado text-[var(--ink-3)]">
        {resultado.mensagem}
      </li>
    );
  }

  return (
    <li className="rounded-lg bg-[var(--surface)] px-4 py-3.5">
      <p className="text-sm">
        <strong>{parcela.proponente}</strong>
        {parcela.setorProponente ? ` (${parcela.setorProponente})` : ""} propõe que{" "}
        <strong>{parcela.percentual}%</strong> de{" "}
        <Link href={`/custos/${parcela.itemId}`} className="font-medium">
          {parcela.itemDescricao}
        </Link>
        {parcela.valorMensal ? ` (${parcela.valorMensal}/mês no total)` : ""} passe para a sua área.
      </p>
      {parcela.justificativa && (
        <p className="mt-1 text-dado italic text-[var(--ink-2)]">“{parcela.justificativa}”</p>
      )}

      <form action={acao} className="mt-2.5 flex flex-wrap items-center gap-2">
        <input type="hidden" name="parcelaId" value={parcela.id} />
        <input
          type="text"
          name="comentario"
          placeholder="Comentário (opcional)"
          className="min-w-[180px] flex-1 rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-3 py-1.5 text-dado outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          name="decisao"
          value="aceitar"
          className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-dado font-semibold text-white"
        >
          Aceitar
        </button>
        <button
          type="submit"
          name="decisao"
          value="recusar"
          className="rounded-lg border border-[var(--rule)] px-3.5 py-1.5 text-dado font-medium text-[var(--ink-2)] hover:border-[var(--accent)] hover:text-[var(--accent-texto)]"
        >
          Recusar
        </button>
      </form>
      <Aviso resultado={resultado} />
    </li>
  );
}
