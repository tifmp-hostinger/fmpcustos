/**
 * A MARCA NO CABEÇALHO.
 *
 * O guia da FMP é explícito: o logotipo é um desenho geométrico exclusivo e
 * *nunca* se recria em texto. O cabeçalho fazia exatamente isso — escrevia
 * "Custos FMP" numa serifa e chamava aquilo de marca.
 *
 * O que se pode compor em tipografia, e que o próprio sistema de design prevê
 * com uma classe própria, é o DESCRITOR institucional: as quatro linhas em
 * caixa alta que acompanham o logotipo no material da fundação. Ele é
 * tipografia por definição, não uma imitação do desenho.
 *
 * Então enquanto o arquivo do logotipo não chega, o cabeçalho mostra o
 * descritor de verdade em vez de uma marca falsa. Quando o arquivo chegar,
 * basta pôr o caminho em `LOGOTIPO` abaixo: ele entra à esquerda do descritor,
 * que é a montagem oficial do lockup.
 */

/**
 * O caminho do logotipo em `public/`, quando ele existir.
 *
 * Está `null` de propósito e não por esquecimento: `design-system/assets/`
 * documenta quais arquivos faltam. Preencher aqui é a única mudança necessária.
 */
const LOGOTIPO: string | null = null;

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      {LOGOTIPO ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGOTIPO} alt="FMP" className="block h-[26px] w-auto" />
      ) : null}
      {!compacta && (
        <span
          aria-label="Fundação Escola Superior do Ministério Público"
          className="hidden border-l border-[var(--rule-2)] pl-2.5 leading-[1.18] font-semibold tracking-[0.04em] text-[var(--ink)] uppercase sm:block"
          style={{ fontSize: "0.5rem" }}
        >
          Fundação
          <br />
          Escola Superior
          <br />
          do Ministério
          <br />
          Público
        </span>
      )}
    </span>
  );
}

/**
 * O nome do produto — a serifa itálica da marca.
 *
 * "Custos" é o nome desta plataforma, não da fundação: por isso ele é
 * tipografia livre, na voz da marca, e não parte do lockup.
 */
export function NomeDoProduto() {
  return <span className="titulo-pagina text-lg">Custos</span>;
}
