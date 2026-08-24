import Link from "next/link";
import { Decimal } from "decimal.js";
import { formatarBRL } from "@/lib/dinheiro";
import { urlDaLista, type Filtros } from "@/lib/filtros";

/**
 * Barras horizontais ranqueadas.
 *
 * Escolha de forma: todas as barras medem a MESMA grandeza (reais por mês) —
 * é magnitude, não identidade. Logo, um único tom para todas: colorir por
 * posição no ranking faria a cor mudar de dono a cada filtro. Sem múltiplas
 * séries, não há legenda; o título nomeia a medida. O valor é rotulado
 * diretamente em cada barra, o que dispensa tooltip.
 *
 * Cada barra é um link para a lista que a compõe. Métrica que não leva à lista
 * que a explica é decoração: "Marketing R$ 12.400/mês" é um diagnóstico, e
 * diagnóstico sem tratamento não muda nada no mês seguinte.
 */
export function BarrasRanqueadas({
  titulo,
  descricao,
  fatias,
  limite = 8,
  vazio = "Nada cadastrado ainda.",
  recorte,
}: {
  titulo: string;
  descricao?: string;
  fatias: Array<{ chave: string; rotulo: string; valor: Decimal; participacao: Decimal }>;
  limite?: number;
  vazio?: string;
  /** Monta a URL da lista a partir da chave da fatia. Sem isso, a barra é só desenho. */
  recorte?: (chave: string) => Partial<Filtros>;
}) {
  const visiveis = fatias.slice(0, limite);
  const resto = fatias.slice(limite);
  const maior = visiveis[0]?.valor ?? new Decimal(0);

  const largura = (v: Decimal) => (maior.isZero() ? 0 : Number(v.div(maior).mul(100).toFixed(2)));

  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        {titulo}
      </h3>
      {descricao && <p className="mt-1 text-[12px] text-[var(--ink-3)]">{descricao}</p>}

      {visiveis.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-3)]">{vazio}</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {visiveis.map((f) => {
            const conteudo = (
              <>
                <span className="truncate text-[13px] text-[var(--ink-2)]" title={f.rotulo}>
                  {f.rotulo}
                </span>
                <span className="text-right text-[13px] tabular-nums">
                  {formatarBRL(f.valor)}
                  <span className="ml-2 text-[11px] text-[var(--ink-3)]">
                    {f.participacao.toFixed(0)}%
                  </span>
                </span>
                <span className="col-span-2 h-[6px] overflow-hidden rounded-full bg-[var(--rule)]">
                  <span
                    className="block h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${largura(f.valor)}%` }}
                  />
                </span>
              </>
            );
            const grade =
              "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-lg px-1.5 py-1";
            return (
              <li key={f.chave}>
                {recorte ? (
                  <Link
                    href={urlDaLista(recorte(f.chave))}
                    title={`Ver os custos de ${f.rotulo}`}
                    className={`${grade} -mx-1.5 no-underline transition-colors hover:bg-[var(--ground)]`}
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <span className={grade}>{conteudo}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {resto.length > 0 && (
        <p className="mt-3 border-t border-[var(--rule)] pt-2.5 text-[12px] text-[var(--ink-3)]">
          Mais {resto.length} {resto.length === 1 ? "item somando" : "itens somando"}{" "}
          {formatarBRL(resto.reduce((s, f) => s.plus(f.valor), new Decimal(0)))} por mês.
        </p>
      )}
    </section>
  );
}

export function Indicador({
  rotulo,
  valor,
  nota,
  alerta,
  href,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
  /** Quando o número tem uma lista por trás, ele vira porta para ela. */
  href?: ReturnType<typeof urlDaLista>;
}) {
  const corpo = (
    <>
      <p
        className={`text-2xl font-semibold tracking-tight tabular-nums ${
          alerta ? "text-[var(--accent)]" : ""
        }`}
      >
        {valor}
      </p>
      <p className="mt-1.5 text-xs leading-snug text-[var(--ink-3)]">{rotulo}</p>
      {nota && <p className="mt-1 text-[11px] leading-snug text-[var(--ink-3)]">{nota}</p>}
    </>
  );

  if (!href) return <div className="bg-[var(--surface)] px-5 py-4">{corpo}</div>;
  return (
    <Link
      href={href}
      className="block bg-[var(--surface)] px-5 py-4 no-underline transition-colors hover:bg-[var(--ground)]"
    >
      {corpo}
    </Link>
  );
}
