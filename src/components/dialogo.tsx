"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Confirmação modal.
 *
 * Existe uma tentação forte de usar isto em toda ação destrutiva. É errado: a
 * eficácia do modal depende diretamente da sua raridade. Exibido em toda
 * exclusão, ele vira ruído e a pessoa clica "Sim" por reflexo — o que aumenta
 * os erros em vez de reduzi-los. E confirmação é fricção mal alocada: pune cem
 * por cento das ações certas para prevenir uma minoria de enganos.
 *
 * Neste sistema o modal fica reservado ao que o Desfazer não alcança bem:
 * alterar cinco ou mais custos de uma vez. Abaixo disso, a ação acontece e o
 * aviso oferece o caminho de volta.
 *
 * Quando a contagem é grande, a confirmação deixa de ser um clique e passa a
 * ser digitada: escrever "14" exige ler o 14.
 */
export function DialogoDeConfirmacao({
  aberto,
  titulo,
  children,
  rotuloConfirmar,
  /** Quando presente, a pessoa precisa digitar exatamente este texto. */
  exigeDigitar,
  aoConfirmar,
  aoFechar,
  perigoso,
}: {
  aberto: boolean;
  titulo: string;
  children: React.ReactNode;
  rotuloConfirmar: string;
  exigeDigitar?: string;
  aoConfirmar: () => void;
  aoFechar: () => void;
  perigoso?: boolean;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const devolverFoco = useRef<HTMLElement | null>(null);
  const [digitado, setDigitado] = useState("");
  const idTitulo = useId();

  // O campo é limpo durante a renderização, não num efeito: um diálogo que
  // abre já mostrando o que foi digitado da vez anterior é um diálogo que
  // aceita confirmação sem leitura.
  const [estavaAberto, setEstavaAberto] = useState(aberto);
  if (estavaAberto !== aberto) {
    setEstavaAberto(aberto);
    if (aberto) setDigitado("");
  }

  useEffect(() => {
    if (!aberto) return;
    devolverFoco.current = document.activeElement as HTMLElement | null;
    // O foco vai para o botão de cancelar, nunca para o de confirmar: um Enter
    // reflexo em cima de uma confirmação é exatamente o que ela deveria evitar.
    requestAnimationFrame(() =>
      caixa.current?.querySelector<HTMLElement>("[data-cancelar]")?.focus(),
    );
    return () => devolverFoco.current?.focus?.();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFechar();
        return;
      }
      if (e.key !== "Tab" || !caixa.current) return;
      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, aoFechar]);

  if (!aberto || typeof document === "undefined") return null;

  const liberado = !exigeDigitar || digitado.trim() === exigeDigitar;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancelar"
        onClick={aoFechar}
        className="absolute inset-0 cursor-default bg-black/35"
      />
      <div
        ref={caixa}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="relative w-full max-w-md rounded-fmp-md border border-[var(--rule)] bg-[var(--ground)] p-6 shadow-2xl shadow-black/25 motion-safe:animate-[surgir_150ms_ease-out]"
      >
        <h2 id={idTitulo} className="font-serif text-lg leading-tight font-bold">
          {titulo}
        </h2>
        <div className="mt-2.5 space-y-2 text-sm leading-relaxed text-[var(--ink-2)]">
          {children}
        </div>

        {exigeDigitar && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
              Digite <strong className="tabular-nums">{exigeDigitar}</strong> para confirmar
            </span>
            <input
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && liberado) {
                  e.preventDefault();
                  aoConfirmar();
                }
              }}
              inputMode="numeric"
              autoComplete="off"
              className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-base tabular-nums outline-none focus:border-[var(--accent)]"
            />
          </label>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            data-cancelar
            onClick={aoFechar}
            className="rounded-lg border border-[var(--rule)] px-4 py-2 text-sm font-medium text-[var(--ink-2)] hover:border-[var(--ink-3)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={!liberado}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 ${
              perigoso ? "bg-[var(--accent)]" : "bg-[var(--ink)] text-[var(--ground)]"
            }`}
          >
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
