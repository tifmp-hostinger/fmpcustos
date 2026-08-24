"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeAdmin, IconeCustos, IconePainel, IconeSino } from "./icones";

const ICONES = {
  painel: IconePainel,
  custos: IconeCustos,
  alertas: IconeSino,
  admin: IconeAdmin,
} as const;

export type ItemNav = {
  href: "/" | "/custos" | "/alertas" | "/admin";
  rotulo: string;
  icone: keyof typeof ICONES;
  /** Quantos itens esperam decisão. Ausente ou zero não desenha nada. */
  contador?: number;
};

/** Navegação principal, com estado ativo — a pessoa sempre sabe onde está. */
export function Navegacao({ itens }: { itens: ItemNav[] }) {
  const atual = usePathname();

  return (
    <nav aria-label="Principal" className="flex gap-1">
      {itens.map((item) => {
        const Icone = ICONES[item.icone];
        const ativo =
          item.href === "/" ? atual === "/" : atual === item.href || atual.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] no-underline transition-colors ${
              ativo
                ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent)]"
                : "text-[var(--ink-2)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            }`}
          >
            <Icone className="shrink-0" />
            {item.rotulo}
            {/* O número no menu é o que faz a pessoa clicar sem ter ido lá
                procurar. Zero não desenha nada: um "0" permanente vira parte do
                rótulo e para de significar alguma coisa. */}
            {item.contador !== undefined && item.contador > 0 && (
              <span
                aria-label={`${item.contador} pendentes`}
                className="ml-0.5 min-w-[1.25rem] rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-center text-[11px] font-bold text-white tabular-nums"
              >
                {item.contador}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
