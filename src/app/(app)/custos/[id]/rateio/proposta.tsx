"use client";

import { useActionState, useState } from "react";
import { Decimal } from "decimal.js";
import { cancelarProposta, decidirAceite } from "./acoes";
import { useAviso } from "@/components/avisos";
import { formatarBRL } from "@/lib/dinheiro";
import { IconeAlerta, IconeCheck, IconeFechar } from "@/components/icones";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

/**
 * A proposta de rateio enquanto ela está de pé.
 *
 * Antes desta tela, uma proposta pendente era um beco sem saída: o aceite só
 * aparecia na tela inicial de quem recebia a fatia, o cancelamento existia no
 * servidor sem nenhum botão que o chamasse, e o comentário de quem recusava era
 * gravado e nunca mostrado a ninguém. Quem propunha via a proposta sumir e não
 * sabia se tinha sido aceita, recusada ou esquecida.
 *
 * Aqui a proposta inteira fica visível para todos os envolvidos, com o estado
 * de cada fatia, o motivo de cada recusa, e as duas saídas de quem propôs:
 * cancelar ou corrigir e reenviar.
 */

type Parcela = {
  id: string;
  setorNome: string;
  percentual: string;
  aceite: "PENDENTE" | "ACEITO" | "REJEITADO";
  comentario: string | null;
  /** O aceite desta fatia cabe a quem está olhando agora. */
  minhaVez: boolean;
};

export type PropostaVisivel = {
  id: string;
  justificativa: string | null;
  criadoEm: string;
  autor: string;
  souOAutor: boolean;
  parcelas: Parcela[];
};

export function PropostaEmAberto({
  proposta,
  valorMensal,
  podeCancelar,
  aoResolver,
}: {
  proposta: PropostaVisivel;
  valorMensal: string | null;
  podeCancelar: boolean;
  aoResolver?: () => void;
}) {
  const avisar = useAviso();
  const [recusando, setRecusando] = useState<string | null>(null);

  /**
   * O aviso é levantado dentro da própria action, não num efeito que observa o
   * resultado. Num efeito, o mesmo resultado dispara de novo a cada re-render
   * do pai — e o aviso reaparece sozinho depois de a pessoa já tê-lo fechado.
   */
  function comAviso(acao: (anterior: Resultado | null, dados: FormData) => Promise<Resultado>) {
    return async (anterior: Resultado | null, dados: FormData): Promise<Resultado> => {
      const r = await acao(anterior, dados);
      if (r.ok) {
        avisar({ mensagem: r.mensagem ?? "Pronto.", detalhe: r.detalhe });
        setRecusando(null);
        aoResolver?.();
      } else {
        avisar({ mensagem: r.erro, tom: "erro" });
      }
      return r;
    };
  }

  const [, decidir, decidindo] = useActionState<Resultado | null, FormData>(
    comAviso(decidirAceite),
    null,
  );
  const [, cancelar, cancelando] = useActionState<Resultado | null, FormData>(
    comAviso(cancelarProposta),
    null,
  );

  const pendentes = proposta.parcelas.filter((p) => p.aceite === "PENDENTE");
  const total = valorMensal ? new Decimal(valorMensal) : null;

  return (
    <section className="rounded-fmp-md border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-bold">Proposta aguardando aceite</h2>
        <p className="text-meta text-[var(--ink-3)]">
          {proposta.souOAutor ? "Você propôs" : `${proposta.autor} propôs`} em{" "}
          {new Date(proposta.criadoEm).toLocaleDateString("pt-BR")}
        </p>
      </header>

      {proposta.justificativa && (
        <p className="mt-2.5 border-l-2 border-[var(--rule)] pl-3 text-dado leading-relaxed text-[var(--ink-2)] italic">
          “{proposta.justificativa}”
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {proposta.parcelas.map((p) => {
          const emReais = total
            ? total.mul(p.percentual).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            : null;
          return (
            <li
              key={p.id}
              className="rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] px-3.5 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium">{p.setorNome}</span>
                <span className="tabular-nums text-[var(--ink-2)]">
                  {Number(p.percentual).toFixed(2).replace(".", ",")}%
                </span>
                {/* O percentual não se discute numa reunião; o real, sim. */}
                {emReais && (
                  <span className="tabular-nums text-dado text-[var(--ink-3)]">
                    {formatarBRL(emReais)}/mês
                  </span>
                )}
                <span className="ml-auto">
                  <Selo aceite={p.aceite} />
                </span>
              </div>

              {p.comentario && (
                <p className="mt-2 text-meta leading-snug text-[var(--ink-2)]">
                  <span className="text-[var(--ink-3)]">Comentário:</span> {p.comentario}
                </p>
              )}

              {p.minhaVez && (
                <div className="mt-3">
                  {recusando === p.id ? (
                    <form action={decidir} className="space-y-2">
                      <input type="hidden" name="parcelaId" value={p.id} />
                      <input type="hidden" name="decisao" value="recusar" />
                      <label className="block">
                        <span className="mb-1 block text-meta font-medium text-[var(--ink-2)]">
                          Por que esta fatia não cabe ao {p.setorNome}?
                        </span>
                        <textarea
                          name="comentario"
                          rows={2}
                          autoFocus
                          placeholder="Ex.: quem usa a ferramenta é o Jurídico, não a nossa equipe."
                          className="w-full rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </label>
                      {/* O botão diz a verdade sobre o efeito. Recusar não
                          devolve só esta fatia — derruba a proposta inteira. */}
                      <p className="text-meta leading-snug text-[var(--ink-3)]">
                        Recusar devolve a proposta inteira para {proposta.autor} — as outras fatias
                        caem junto e o rateio atual continua valendo.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={decidindo}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-dado font-semibold text-white disabled:opacity-50"
                        >
                          {decidindo ? "Recusando…" : "Recusar proposta"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecusando(null)}
                          className="text-dado text-[var(--ink-3)] hover:underline"
                        >
                          Voltar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={decidir}>
                        <input type="hidden" name="parcelaId" value={p.id} />
                        <input type="hidden" name="decisao" value="aceitar" />
                        <button
                          type="submit"
                          disabled={decidindo}
                          className="flex items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3 py-1.5 text-dado font-semibold text-[var(--ground)] disabled:opacity-50"
                        >
                          <IconeCheck className="size-3.5" />
                          Aceitar {emReais ? formatarBRL(emReais) : `${p.percentual}%`}
                        </button>
                      </form>
                      <button
                        type="button"
                        onClick={() => setRecusando(p.id)}
                        className={classesDeBotao("contorno", "sm")}
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-meta text-[var(--ink-3)]">
          {pendentes.length === 0
            ? "Todas as fatias foram decididas."
            : `Faltam ${pendentes.length} ${pendentes.length === 1 ? "aceite" : "aceites"}: ${pendentes.map((p) => p.setorNome).join(", ")}.`}
        </p>
        {podeCancelar && (
          <form action={cancelar} className="ml-auto">
            <input type="hidden" name="propostaId" value={proposta.id} />
            <button
              type="submit"
              disabled={cancelando}
              className="text-meta text-[var(--ink-3)] underline-offset-2 hover:text-[var(--accent)] hover:underline disabled:opacity-50"
            >
              {cancelando ? "Cancelando…" : "Cancelar proposta e refazer"}
            </button>
          </form>
        )}
      </footer>
    </section>
  );
}

function Selo({ aceite }: { aceite: Parcela["aceite"] }) {
  if (aceite === "ACEITO") {
    return (
      <span className="flex items-center gap-1 text-meta font-semibold text-emerald-700 dark:text-emerald-400">
        <IconeCheck className="size-3.5" />
        aceito
      </span>
    );
  }
  if (aceite === "REJEITADO") {
    return (
      <span className="flex items-center gap-1 text-meta font-semibold text-[var(--accent)]">
        <IconeFechar className="size-3.5" />
        recusado
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-meta text-[var(--ink-3)]">
      <IconeAlerta className="size-3.5" />
      aguardando
    </span>
  );
}
