"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { IconeFechar, IconeSeta } from "@/components/icones";

/**
 * Painel lateral (*side peek*).
 *
 * Existe para responder a uma pergunta sem perder o lugar na lista: abrir um
 * custo hoje custa a página inteira, e voltar devolve a lista no topo, sem
 * filtro, sem busca e sem a posição da varredura. Quem estava conferindo o
 * décimo sétimo item recomeça do primeiro.
 *
 * As setas ↑/↓ trocam o registro sem fechar o painel — é assim que se revisa
 * vinte itens num fechamento, e é a diferença entre uma fila de trabalho e
 * vinte idas e voltas. Dentro de um campo elas continuam sendo do campo; com
 * Alt, navegam de qualquer lugar.
 *
 * Abaixo de 1200px o painel vira sobreposição de tela cheia: máquina
 * administrativa de 1366px existe, e espremer a lista em 900px para caber um
 * painel de 440px torna as duas coisas ilegíveis.
 */
export function PainelLateral({
  titulo,
  subtitulo,
  aberto,
  aoFechar,
  aoAnterior,
  aoProximo,
  posicao,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  aberto: boolean;
  aoFechar: () => void;
  aoAnterior?: () => void;
  aoProximo?: () => void;
  /** "3 de 47" — sem isso, ninguém sabe se a fila está acabando. */
  posicao?: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const devolverFoco = useRef<HTMLElement | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (!aberto) return;
    devolverFoco.current = document.activeElement as HTMLElement | null;
    // Foca o painel, não o primeiro campo: focar um campo de texto ao abrir faz
    // a próxima tecla digitada virar conteúdo em vez de comando.
    caixa.current?.focus();
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
      // Seta pura só navega quando o foco NÃO está num campo: dentro de um
      // campo de data a seta muda o dia, e roubar isso seria pior que não ter
      // atalho nenhum. Com Alt, ela navega sempre — inclusive no meio da
      // digitação, que é onde a pessoa está o tempo todo numa fila de revisão.
      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo?.tagName === "INPUT" ||
        alvo?.tagName === "TEXTAREA" ||
        alvo?.tagName === "SELECT" ||
        alvo?.isContentEditable;
      if (digitando && !e.altKey) return;

      if (e.key === "ArrowDown" && aoProximo) {
        e.preventDefault();
        aoProximo();
      }
      if (e.key === "ArrowUp" && aoAnterior) {
        e.preventDefault();
        aoAnterior();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, aoFechar, aoAnterior, aoProximo]);

  // Prende o Tab dentro do painel enquanto ele está aberto — sem isso o foco
  // some para a lista atrás e a pessoa fica tabulando no escuro.
  useEffect(() => {
    if (!aberto) return;
    function prender(e: KeyboardEvent) {
      if (e.key !== "Tab" || !caixa.current) return;
      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    window.addEventListener("keydown", prender);
    return () => window.removeEventListener("keydown", prender);
  }, [aberto]);

  if (!aberto || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Fechar painel"
        onClick={aoFechar}
        className="absolute inset-0 cursor-default bg-black/25 xl:bg-black/10"
      />
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[min(100vw,460px)] flex-col border-l border-[var(--rule)] bg-[var(--ground)] shadow-2xl shadow-black/20 outline-none motion-safe:animate-[surgir_180ms_ease-out]"
      >
        <header className="flex items-start gap-3 border-b border-[var(--rule)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="font-serif text-lg leading-tight font-bold">
              {titulo}
            </h2>
            {subtitulo && <div className="mt-1 text-meta text-[var(--ink-3)]">{subtitulo}</div>}
          </div>

          {(aoAnterior || aoProximo) && (
            <div className="flex shrink-0 items-center gap-0.5">
              {posicao && (
                <span className="mr-1 text-micro tabular-nums text-[var(--ink-3)]">{posicao}</span>
              )}
              <button
                type="button"
                onClick={aoAnterior}
                disabled={!aoAnterior}
                aria-label="Item anterior"
                title="Item anterior (↑ ou Alt+↑)"
                className="rounded-lg p-1.5 text-[var(--ink-3)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-30"
              >
                <IconeSeta className="size-4 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={aoProximo}
                disabled={!aoProximo}
                aria-label="Próximo item"
                title="Próximo item (↓ ou Alt+↓)"
                className="rounded-lg p-1.5 text-[var(--ink-3)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-30"
              >
                <IconeSeta className="size-4 rotate-90" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar painel"
            title="Fechar (Esc)"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-[var(--ink-3)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <IconeFechar className="size-[18px]" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {rodape && (
          <footer className="border-t border-[var(--rule)] bg-[var(--surface)] px-5 py-3.5">
            {rodape}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
