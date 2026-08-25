"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { IconeFechar, IconeFiltro, IconeMais } from "@/components/icones";

/**
 * AS AÇÕES FLUTUANTES DO CELULAR — e a folha de filtros.
 *
 * O problema que resolvem: num telefone, a tela de custos gastava umas 250px de
 * cromo antes do primeiro custo — abas, pílulas de situação, exercício, agrupar
 * e busca, empilhados. E as duas coisas que alguém realmente quer fazer numa
 * lista — incluir um item e recortá-la — ficavam ambas lá em cima, atrás de uma
 * rolagem inteira. Quem estava no décimo item voltava ao topo para filtrar.
 *
 * Então os filtros SAEM do topo e passam a morar aqui dentro, e o topo devolve
 * o espaço para a lista. Não é esconder: o botão traz a contagem do que está
 * ativo, e o cabeçalho da lista continua dizendo o recorte por extenso
 * ("26 custos · ativos · todos os setores"). O estado nunca fica invisível.
 *
 * DOIS PESOS, NÃO DOIS CÍRCULOS IGUAIS. Cadastrar é a ação primária da tela e
 * ganha o disco vermelho à direita, onde o polegar alcança. Filtrar é a
 * secundária e ganha uma pílula clara à esquerda. Dois discos idênticos
 * disputariam a mesma leitura e o dedo erraria metade das vezes.
 *
 * O CONTEÚDO É O MESMO, EM DOIS LUGARES SÓ NA APARÊNCIA. Os filtros são
 * renderizados no servidor e entram aqui como `children`: existe UM nó no DOM,
 * que a partir de `sm` é o bloco de sempre no fluxo da página e abaixo disso é
 * o interior da folha. Duplicar a marcação criaria dois lugares para mudar o
 * mesmo filtro — e, mais cedo ou mais tarde, dois que discordam.
 */
export function AcoesFlutuantes({
  children,
  quantosFiltros,
  podeLancar,
}: {
  /** Os controles de filtro, renderizados no servidor. */
  children: React.ReactNode;
  /** Quantos recortes estão ativos agora, para o distintivo do botão. */
  quantosFiltros: number;
  podeLancar: boolean;
}) {
  const [aberta, setAberta] = useState(false);
  const rota = usePathname();
  const busca = useSearchParams();

  /*
   * Todo filtro é um `<Link>`: clicar navega. Fechar a folha quando a URL muda
   * é o que faz o toque parecer "aplicou e voltou" em vez de deixar a pessoa
   * olhando para a folha, sem saber se pegou.
   *
   * O fechamento acontece durante a RENDERIZAÇÃO, comparando a URL com a
   * anterior — não num efeito. Num efeito, o React renderizaria uma vez com a
   * lista nova e a folha ainda aberta, e só então fecharia: um quadro em que a
   * tela já mudou por baixo de uma folha que continua tapando. É o mesmo padrão
   * que o editor de rateio usa para piscar a âncora no mesmo quadro em que o
   * número muda.
   */
  const chaveDaUrl = `${rota}?${busca}`;
  const [urlAnterior, setUrlAnterior] = useState(chaveDaUrl);
  if (urlAnterior !== chaveDaUrl) {
    setUrlAnterior(chaveDaUrl);
    if (aberta) setAberta(false);
  }

  /*
   * Esc fecha, e com a folha aberta a página atrás não rola — senão o dedo
   * arrasta a lista por baixo e a folha parece descolada do que está fazendo.
   *
   * E fecha também ao passar de `sm`. Sem isso havia uma armadilha real: girar
   * o telefone para paisagem com a folha aberta manda o véu, o botão de fechar
   * e o gatilho todos para `sm:hidden` — some tudo que sabia fechar — enquanto
   * `overflow: hidden` no corpo e o `aria-modal` continuam valendo. A página
   * fica sem rolagem, anunciada como diálogo, e sem nenhuma saída visível.
   */
  useEffect(() => {
    if (!aberta) return;

    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberta(false);
    document.addEventListener("keydown", tecla);

    // 40rem é o `sm` do Tailwind. Em `rem` e não em `px` para acompanhar quem
    // aumentou o corpo de texto no sistema operacional.
    const largura = window.matchMedia("(min-width: 40rem)");
    const cresceu = () => largura.matches && setAberta(false);
    largura.addEventListener("change", cresceu);

    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      largura.removeEventListener("change", cresceu);
      document.body.style.overflow = antes;
    };
  }, [aberta]);

  return (
    <>
      {/* O véu. Só no celular, e só com a folha aberta. */}
      {aberta && (
        <div
          onClick={() => setAberta(false)}
          className="fixed inset-0 z-40 bg-[var(--fmp-black)]/40 backdrop-blur-[2px] sm:hidden"
          aria-hidden
        />
      )}

      <div
        // A partir de `sm` isto some do caminho e vira o bloco de filtros de
        // sempre. Abaixo de `sm`, ou está fechado (e não existe), ou é a folha.
        className={
          aberta
            ? "folha-de-filtros fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto overscroll-contain rounded-t-fmp-lg border-t border-[var(--rule)] bg-[var(--ground)] px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-fmp-lg sm:static sm:z-auto sm:max-h-none sm:overflow-visible sm:rounded-none sm:border-0 sm:p-0 sm:shadow-none"
            : "hidden sm:block"
        }
        role={aberta ? "dialog" : undefined}
        aria-modal={aberta ? true : undefined}
        aria-label={aberta ? "Filtros da lista" : undefined}
      >
        {aberta && (
          <div className="mb-1 flex items-center justify-between sm:hidden">
            <span className="sobrancelha">Filtros</span>
            <button
              type="button"
              onClick={() => setAberta(false)}
              aria-label="Fechar filtros"
              className="-mr-2 rounded-full p-2 text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              <IconeFechar className="size-5" />
            </button>
          </div>
        )}
        {children}
      </div>

      {/* Os dois botões. `bottom-20` os põe acima da barra de navegação do
          rodapé, e o `safe-area` acima da faixa de gesto do iPhone. */}
      <div
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-30 flex items-center justify-between px-5 sm:hidden"
        // O contêiner atravessa a tela inteira para separar os dois botões, mas
        // não pode capturar o toque no vão entre eles — ali embaixo está a
        // lista, e um retângulo invisível engolindo cliques é o tipo de defeito
        // que ninguém consegue descrever no chamado.
        style={{ pointerEvents: "none" }}
      >
        <button
          type="button"
          onClick={() => setAberta(true)}
          style={{ pointerEvents: "auto" }}
          className="flex items-center gap-2 rounded-full border-[1.5px] border-[var(--rule-2)] bg-[var(--surface)] py-2.5 pr-4 pl-3.5 text-dado font-semibold text-[var(--ink)] shadow-fmp-md transition-transform active:scale-95"
        >
          <IconeFiltro className="size-4" />
          Filtros
          {/* O distintivo é o que impede a folha de esconder estado: sem ele,
              uma lista filtrada e uma lista inteira teriam o mesmo botão. */}
          {quantosFiltros > 0 && (
            <span
              aria-label={`${quantosFiltros} ${quantosFiltros === 1 ? "filtro ativo" : "filtros ativos"}`}
              className="min-w-[1.25rem] rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-center text-micro font-bold text-white tabular-nums"
            >
              {quantosFiltros}
            </span>
          )}
        </button>

        {podeLancar ? (
          <Link
            href="/custos/novo"
            aria-label="Cadastrar custo"
            style={{ pointerEvents: "auto" }}
            className="flex size-14 items-center justify-center rounded-full bg-[var(--accent)] text-white no-underline shadow-fmp-lg transition-transform active:scale-95"
          >
            <IconeMais className="size-6" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}
