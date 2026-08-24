"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { enderecoDaLista } from "@/lib/filtros";
import { IconeBusca } from "@/components/icones";

/**
 * Busca global, no cabeçalho.
 *
 * A busca existia só dentro da lista de custos: para procurar um contrato a
 * partir do painel era preciso primeiro navegar até a lista, o que transforma
 * "onde está aquele contrato da Adobe" numa viagem de três telas.
 *
 * Ela busca sempre em TODAS as situações — quem digita "Adobe" quer achar o
 * Adobe, não descobrir que ele estava cancelado e por isso não apareceu. O
 * recorte se aplica depois, na lista.
 *
 * `/` porque é o atalho que a pessoa já traz do GitHub, do Gmail e do YouTube;
 * `Ctrl+K` porque é o que ela traz de todo o resto. Ambos checam se o foco já
 * está num campo antes de agir: `/` dentro de um texto tem que escrever uma
 * barra, não sequestrar o cursor.
 */
export function BuscaGlobal() {
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const [termo, setTermo] = useState("");

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo?.tagName === "INPUT" ||
        alvo?.tagName === "TEXTAREA" ||
        alvo?.tagName === "SELECT" ||
        alvo?.isContentEditable;

      const atalhoDeComando = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const barra = e.key === "/" && !digitando && !e.metaKey && !e.ctrlKey && !e.altKey;

      if (atalhoDeComando || barra) {
        e.preventDefault();
        campo.current?.focus();
        campo.current?.select();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const limpo = termo.trim();
        if (!limpo) return;
        router.push(enderecoDaLista({ situacao: "todos", busca: limpo }) as never);
        campo.current?.blur();
      }}
      className="relative hidden min-w-0 flex-1 md:block md:max-w-[280px]"
    >
      <IconeBusca className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--ink-3)]" />
      <input
        ref={campo}
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setTermo("");
            campo.current?.blur();
          }
        }}
        placeholder="Buscar custo…"
        aria-label="Buscar custos em todas as situações"
        aria-keyshortcuts="/ Control+K"
        className="w-full rounded-full border border-[var(--rule)] bg-[var(--surface)] py-1.5 pr-9 pl-8 text-[13px] outline-none placeholder:text-[var(--ink-3)] focus:border-[var(--accent)]"
      />
      {/* A dica do atalho só aparece com o campo vazio: sobre o texto digitado
          ela vira ruído, e some sozinha assim que deixa de ser útil. */}
      {termo === "" && (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-[var(--rule)] px-1.5 py-0.5 font-sans text-[10px] text-[var(--ink-3)]"
        >
          /
        </kbd>
      )}
    </form>
  );
}
