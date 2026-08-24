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

/**
 * Navegação principal, com estado ativo — a pessoa sempre sabe onde está.
 *
 * São DUAS barras, e nunca as duas ao mesmo tempo: a do topo a partir de `sm`,
 * a do rodapé abaixo disso. Escrita com os quatro rótulos, a barra do topo
 * media 423px numa janela de 390 — não quebrava, não rolava, e empurrava a
 * PÁGINA inteira de lado. Era a causa do topo embaralhado em toda tela do
 * sistema, não só na lista.
 *
 * A saída não foi espremer: foi mudar de lugar. Ver `variante` abaixo.
 */
export function Navegacao({
  itens,
  variante = "topo",
}: {
  itens: ItemNav[];
  /**
   * `rodape` é a mesma navegação numa barra fixa no pé da tela, e só existe no
   * telefone.
   *
   * Não é enfeite de aplicativo: no topo, esta barra disputava 390px com a
   * marca e a identidade do usuário, e perdia — o cabeçalho quebrava em duas
   * faixas que apareciam em cima de TODA tela do sistema. No pé ela não disputa
   * com nada, fica embaixo do polegar (que é onde a mão segura o aparelho) e
   * devolve a faixa inteira ao conteúdo.
   *
   * Aqui os rótulos voltam todos, porque no rodapé há largura para os quatro.
   */
  variante?: "topo" | "rodape";
}) {
  const atual = usePathname();

  if (variante === "rodape") {
    return (
      <nav
        aria-label="Principal"
        // `pb-[env(safe-area-inset-bottom)]`: no iPhone sem botão físico existe
        // uma faixa de gesto no pé da tela. Sem esta reserva, o último item
        // fica debaixo da barra do sistema e o toque cai nela, não no link.
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rule)] bg-[var(--ground)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {itens.map((item) => {
            const Icone = ICONES[item.icone];
            const ativo =
              item.href === "/"
                ? atual === "/"
                : atual === item.href || atual.startsWith(item.href + "/");
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-micro no-underline transition-colors ${
                    ativo ? "font-semibold text-[var(--accent)]" : "text-[var(--ink-3)]"
                  }`}
                >
                  <Icone className="shrink-0" />
                  {item.rotulo}
                  {item.contador !== undefined && item.contador > 0 && (
                    <span
                      aria-label={`${item.contador} pendentes`}
                      className="absolute top-1.5 right-1/2 mr-2 min-w-[1.1rem] rounded-full bg-[var(--accent)] px-1 text-center text-[0.625rem] leading-4 font-bold text-white tabular-nums"
                    >
                      {item.contador}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Principal" className="hidden gap-1 sm:flex">
      {itens.map((item) => {
        const Icone = ICONES[item.icone];
        const ativo =
          item.href === "/"
            ? atual === "/"
            : atual === item.href || atual.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            aria-label={item.rotulo}
            title={item.rotulo}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm no-underline transition-colors sm:px-3 ${
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
                className="ml-0.5 min-w-[1.25rem] rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-center text-micro font-bold text-white tabular-nums"
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
