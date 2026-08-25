/**
 * O BOTÃO DA FMP.
 *
 * O kit da marca tem um botão só, em três variantes, e ele é uma PÍLULA — raio
 * 999, nunca um retângulo arredondado. Aqui havia 38 strings de classe escritas
 * uma a uma, com quatro raios diferentes, três pesos de fonte e dois vermelhos.
 * Nenhuma delas estava errada sozinha; juntas, não eram um botão, eram 38.
 *
 * O que o sistema define e aqui se cumpre:
 *
 * - **Pílula.** Todo botão do material da FMP é redondo nas pontas.
 * - **Três estados de vermelho.** `--fmp-red` em repouso, `--fmp-red-600` no
 *   hover, `--fmp-red-700` no pressionado. São derivações de interação, não
 *   cores da paleta: existe um vermelho FMP, e ele é o de repouso.
 * - **Contorno de 1,5px.** O kit usa fio grosso na variante fantasma; 1px
 *   desenha um botão tímido ao lado de um preenchido.
 *
 * Fica como função de classes, e não só como componente, porque metade destes
 * botões é `<Link>`, `<button type="submit">` dentro de `<form action>`, ou um
 * `<label>` que embrulha um input de arquivo. Trocar tudo isso por um
 * componente custaria reescrever formulários que funcionam para ganhar uma
 * sintaxe. A função entra em qualquer um deles.
 */

export type VarianteDeBotao =
  /** A ação da tela. Vermelho cheio. No máximo uma por região. */
  | "primario"
  /** A alternativa. Fio escuro, fundo transparente. */
  | "contorno"
  /** A saída — cancelar, voltar. Sem caixa, sublinhado vermelho no hover. */
  | "texto"
  /** Destrutivo confirmado. Vermelho, mas anunciado pelo texto, não pela cor. */
  | "perigo";

export type TamanhoDeBotao = "sm" | "md" | "lg";

const TAMANHO: Record<TamanhoDeBotao, string> = {
  sm: "px-3.5 py-1.5 text-dado gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2",
};

export function classesDeBotao(
  variante: VarianteDeBotao = "primario",
  tamanho: TamanhoDeBotao = "md",
): string {
  const base = `inline-flex items-center justify-center rounded-full leading-none font-semibold no-underline transition-all duration-200 ease-fmp disabled:cursor-not-allowed disabled:opacity-45 ${TAMANHO[tamanho]}`;

  switch (variante) {
    case "primario":
      /*
       * Branco sobre `#EE2A42` dá 4,16:1. O preenchimento contra o fundo passa
       * (3,59:1, e a WCAG pede 3:1 para componente); o RÓTULO fica 0,34 abaixo
       * do 4,5:1 que o AA pede para texto normal.
       *
       * Fica assim de propósito, e não por descuido: este par exato — vermelho
       * da marca com rótulo branco de ~14px — é o que o kit da FMP especifica
       * para o botão primário. Trocar por `--fmp-red-600` resolveria o número
       * (5,18:1) ao custo de pintar o elemento mais visível da plataforma com
       * um vermelho que não é o da marca. Essa é uma decisão de identidade, de
       * quem responde pela marca, não de quem escreve o CSS.
       *
       * O texto vermelho pequeno, esse sim, foi corrigido: ver `--accent-texto`
       * em globals.css. A diferença é que lá não havia decisão de marca a
       * tomar — o sistema já traz o escurecido pronto para uso em interface.
       */
      return `${base} border-[1.5px] border-transparent bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]`;
    case "perigo":
      return `${base} border-[1.5px] border-[var(--accent)] text-[var(--accent-texto)] hover:bg-[var(--accent)] hover:text-white active:bg-[var(--accent-press)] active:text-white`;
    case "texto":
      return `${base} border-[1.5px] border-transparent px-2 text-[var(--ink-2)] hover:text-[var(--accent-texto)]`;
    case "contorno":
    default:
      return `${base} border-[1.5px] border-[var(--rule-2)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]`;
  }
}
