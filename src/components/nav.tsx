"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeCustos, IconePainel, IconeUsuarios } from "./icones";

const ICONES = {
  painel: IconePainel,
  custos: IconeCustos,
  usuarios: IconeUsuarios,
} as const;

export type ItemNav = {
  href: "/" | "/custos" | "/admin/usuarios";
  rotulo: string;
  icone: keyof typeof ICONES;
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
          </Link>
        );
      })}
    </nav>
  );
}
