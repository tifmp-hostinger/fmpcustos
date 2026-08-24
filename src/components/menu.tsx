"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { IconeMenuLinha } from "@/components/icones";

/**
 * Menu de linha.
 *
 * O gatilho fica SEMPRE renderizado — nunca só no hover. Esconder ação em hover
 * corta a descoberta quase pela metade, viola a WCAG 1.4.13 e não tem gesto
 * equivalente no toque; e este sistema tem gente que entra duas vezes por ano
 * (auditor, contador, quem cobre férias) e não vai varrer quinhentas linhas
 * com o mouse procurando affordance. Em repouso ele é discreto; ao passar o
 * ponteiro, ao focar a linha e ao focar o próprio botão, fica pleno.
 *
 * Todo item tem texto. Ícone sozinho só é entendido no par universal
 * lápis/lixeira — fora disso o acerto de leitura despenca, e "duplicar",
 * "encerrar" e "ratear" não têm desenho universal nenhum.
 */

export type ItemMenu = {
  rotulo: string;
  icone?: React.ReactNode;
  href?: string;
  aoEscolher?: () => void;
  /** Regra conhecida na renderização: o item aparece, mas explica a recusa. */
  desabilitado?: boolean;
  /** O porquê da recusa, escrito no próprio item — nunca um item mudo. */
  motivo?: string;
  perigoso?: boolean;
  separadorAntes?: boolean;
};

export function MenuDeLinha({
  rotulo,
  itens,
  aoAbrir,
  registrarAbertura,
  conteudoGatilho,
  classeGatilho,
}: {
  /** Rótulo acessível do gatilho: "Ações de Adobe Creative Cloud". */
  rotulo: string;
  itens: ItemMenu[];
  aoAbrir?: () => void;
  /**
   * Conteúdo do gatilho, quando o próprio dado é o botão. Na coluna de
   * situação é o selo colorido que abre o menu: dois pontinhos ao lado de um
   * selo seriam dois alvos para a mesma coisa, e a linha já tem um menu de
   * três pontos na ponta direita — repetir o desenho confunde os dois.
   */
  conteudoGatilho?: React.ReactNode;
  classeGatilho?: string;
  /**
   * Entrega ao pai uma função que abre este menu, para o clique com o botão
   * direito na linha inteira cair no mesmo lugar — é o gesto que a pessoa já
   * traz da planilha, e custa zero pixel de tela.
   */
  registrarAbertura?: (abrir: (() => void) | null) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState<{ x: number; y: number; acima: boolean } | null>(null);
  const [focado, setFocado] = useState(0);
  const gatilho = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const idMenu = useId();

  const abrir = useCallback(() => {
    setFocado(0);
    setAberto(true);
    aoAbrir?.();
  }, [aoAbrir]);

  useEffect(() => {
    registrarAbertura?.(abrir);
    return () => registrarAbertura?.(null);
  }, [registrarAbertura, abrir]);

  /** Mede o gatilho e coloca o menu junto dele. Perto do rodapé, abre para cima. */
  const recolocar = useCallback(() => {
    const alvo = gatilho.current;
    if (!alvo) return;
    const r = alvo.getBoundingClientRect();
    // Gatilho fora da tela: sem âncora visível, o menu não tem onde se apoiar.
    if (r.bottom < 0 || r.top > window.innerHeight) {
      setAberto(false);
      return;
    }
    const altura = Math.min(itens.length * 38 + 16, 340);
    const acima = r.bottom + altura > window.innerHeight - 12;
    setPosicao({ x: r.right, y: acima ? r.top : r.bottom, acima });
  }, [itens.length]);

  // Medido antes da pintura, para o menu não aparecer no canto errado por um quadro.
  useLayoutEffect(() => {
    if (aberto) recolocar();
  }, [aberto, recolocar]);

  useEffect(() => {
    if (!aberto) return;

    // O ouvinte é de CAPTURA, para clicar fora fechar o menu sem também
    // acionar a linha que estava embaixo. Por isso ele roda antes de o evento
    // chegar ao menu, e um `stopPropagation` lá dentro não o alcançaria: quem
    // decide é a verificação de contenção. Sem ela, o pointerdown sobre um
    // item desmontava o menu antes de o clique se completar — e escolher uma
    // opção simplesmente não fazia nada.
    const fechar = (evento: Event) => {
      const alvo = evento.target as Node | null;
      if (alvo && (lista.current?.contains(alvo) || gatilho.current?.contains(alvo))) return;
      setAberto(false);
    };

    // Rolar REPOSICIONA, não fecha. Fechar na primeira rolagem derrubava o
    // menu antes de ele existir de fato: o navegador ainda está terminando de
    // trazer a linha para a área visível quando o clique acontece, e essa
    // rolagem residual matava o menu recém-aberto.
    window.addEventListener("pointerdown", fechar, true);
    window.addEventListener("resize", recolocar);
    window.addEventListener("scroll", recolocar, true);
    return () => {
      window.removeEventListener("pointerdown", fechar, true);
      window.removeEventListener("resize", recolocar);
      window.removeEventListener("scroll", recolocar, true);
    };
  }, [aberto, recolocar]);

  // `posicao` entra nas dependências porque a lista só existe no DOM depois de
  // ela ser medida: sem isso, o primeiro item nunca receberia foco e a abertura
  // por teclado deixaria a pessoa sem ponto de partida.
  useEffect(() => {
    if (!aberto || !posicao) return;
    lista.current?.querySelectorAll<HTMLElement>("[role='menuitem']")[focado]?.focus();
  }, [aberto, posicao, focado]);

  const utilizaveis = itens.map((i, n) => ({ ...i, n })).filter((i) => !i.desabilitado);

  function navegar(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      setAberto(false);
      gatilho.current?.focus();
      return;
    }
    const passos: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    if (e.key in passos) {
      e.preventDefault();
      const ordem = utilizaveis.map((i) => i.n);
      if (ordem.length === 0) return;
      const atual = ordem.indexOf(focado);
      const proximo = (atual + passos[e.key] + ordem.length) % ordem.length;
      setFocado(ordem[proximo]);
    }
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const ordem = utilizaveis.map((i) => i.n);
      if (ordem.length) setFocado(e.key === "Home" ? ordem[0] : ordem[ordem.length - 1]);
    }
  }

  function escolher(item: ItemMenu) {
    if (item.desabilitado) return;
    setAberto(false);
    gatilho.current?.focus();
    item.aoEscolher?.();
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        aria-label={rotulo}
        onClick={(e) => {
          e.stopPropagation();
          if (aberto) setAberto(false);
          else abrir();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            abrir();
          }
        }}
        className={
          classeGatilho ??
          "rounded-lg p-1.5 text-[var(--ink-3)] opacity-55 transition-opacity hover:bg-[var(--ground)] hover:text-[var(--ink)] hover:opacity-100 focus-visible:opacity-100 group-hover/linha:opacity-100 group-focus-within/linha:opacity-100 aria-expanded:bg-[var(--ground)] aria-expanded:opacity-100"
        }
      >
        {conteudoGatilho ?? <IconeMenuLinha className="size-[18px]" />}
      </button>

      {aberto &&
        posicao &&
        createPortal(
          <div
            ref={lista}
            id={idMenu}
            role="menu"
            aria-label={rotulo}
            onKeyDown={navegar}
            style={{
              position: "fixed",
              left: Math.max(12, posicao.x - 232),
              [posicao.acima ? "bottom" : "top"]: posicao.acima
                ? window.innerHeight - posicao.y + 6
                : posicao.y + 6,
            }}
            className="z-50 w-[232px] rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-1.5 shadow-xl shadow-black/10"
          >
            {itens.map((item, n) => (
              <div key={item.rotulo}>
                {item.separadorAntes && (
                  <div role="separator" className="my-1.5 h-px bg-[var(--rule)]" />
                )}
                <ItemDoMenu
                  item={item}
                  ativo={n === focado}
                  aoEscolher={() => escolher(item)}
                  aoFocar={() => setFocado(n)}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function ItemDoMenu({
  item,
  ativo,
  aoEscolher,
  aoFocar,
}: {
  item: ItemMenu;
  ativo: boolean;
  aoEscolher: () => void;
  aoFocar: () => void;
}) {
  const classe = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-dado no-underline transition-colors ${
    item.desabilitado
      ? "cursor-not-allowed text-[var(--ink-3)]"
      : item.perigoso
        ? "text-[var(--ink)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
        : "text-[var(--ink)] hover:bg-[var(--ground)]"
  } ${ativo && !item.desabilitado ? "bg-[var(--ground)]" : ""}`;

  const conteudo = (
    <>
      {item.icone && (
        <span aria-hidden className="shrink-0 text-[var(--ink-3)]">
          {item.icone}
        </span>
      )}
      <span className="min-w-0 flex-1">
        {item.rotulo}
        {/* A recusa é escrita no próprio item. Item desabilitado e mudo faz a
            pessoa clicar três vezes achando que a tela travou. */}
        {item.desabilitado && item.motivo && (
          <span className="mt-0.5 block text-micro leading-snug">{item.motivo}</span>
        )}
      </span>
    </>
  );

  if (item.href && !item.desabilitado) {
    return (
      <Link
        role="menuitem"
        // `typedRoutes` valida rotas literais; aqui o destino é montado a
        // partir do id do registro, então a checagem acontece em quem monta
        // o item de menu, não neste componente genérico.
        href={item.href as never}
        tabIndex={-1}
        onFocus={aoFocar}
        onClick={aoEscolher}
        className={classe}
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      role="menuitem"
      type="button"
      tabIndex={-1}
      disabled={item.desabilitado}
      aria-disabled={item.desabilitado}
      onFocus={aoFocar}
      onClick={aoEscolher}
      className={classe}
    >
      {conteudo}
    </button>
  );
}
