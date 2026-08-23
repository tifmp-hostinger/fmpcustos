import { Decimal } from "decimal.js";
import { formatarBRL } from "@/lib/dinheiro";

/**
 * Barras horizontais ranqueadas.
 *
 * Escolha de forma: todas as barras medem a MESMA grandeza (reais por mês) —
 * é magnitude, não identidade. Logo, um único tom para todas: colorir por
 * posição no ranking faria a cor mudar de dono a cada filtro. Sem múltiplas
 * séries, não há legenda; o título nomeia a medida. O valor é rotulado
 * diretamente em cada barra, o que dispensa tooltip.
 */
export function BarrasRanqueadas({
  titulo,
  descricao,
  fatias,
  limite = 8,
  vazio = "Nada cadastrado ainda.",
}: {
  titulo: string;
  descricao?: string;
  fatias: Array<{ chave: string; rotulo: string; valor: Decimal; participacao: Decimal }>;
  limite?: number;
  vazio?: string;
}) {
  const visiveis = fatias.slice(0, limite);
  const resto = fatias.slice(limite);
  const maior = visiveis[0]?.valor ?? new Decimal(0);

  const largura = (v: Decimal) =>
    maior.isZero() ? 0 : Number(v.div(maior).mul(100).toFixed(2));

  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        {titulo}
      </h3>
      {descricao && <p className="mt-1 text-[12px] text-[var(--ink-3)]">{descricao}</p>}

      {visiveis.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-3)]">{vazio}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {visiveis.map((f) => (
            <li key={f.chave} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
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
            </li>
          ))}
        </ul>
      )}

      {resto.length > 0 && (
        <p className="mt-3 border-t border-[var(--rule)] pt-2.5 text-[12px] text-[var(--ink-3)]">
          Mais {resto.length}{" "}
          {resto.length === 1 ? "item somando" : "itens somando"}{" "}
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
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] px-5 py-4">
      <p
        className={`text-2xl font-semibold tabular-nums tracking-tight ${
          alerta ? "text-[var(--accent)]" : ""
        }`}
      >
        {valor}
      </p>
      <p className="mt-1.5 text-xs leading-snug text-[var(--ink-3)]">{rotulo}</p>
      {nota && <p className="mt-1 text-[11px] leading-snug text-[var(--ink-3)]">{nota}</p>}
    </div>
  );
}
