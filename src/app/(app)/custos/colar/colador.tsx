"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { importarColados } from "./acoes";
import { useAviso } from "@/components/avisos";
import { Selecao } from "@/components/campos";
import { formatarBRL, lerValorDigitado } from "@/lib/dinheiro";
import { ROTULOS_NATUREZA, ROTULOS_PERIODICIDADE } from "@/lib/opcoes";
import {
  CAMPOS,
  MAXIMO_LINHAS,
  lerColagem,
  somaColada,
  type ChaveCampo,
  type Mapa,
} from "@/lib/planilha";
import { IconeAlerta, IconeCheck } from "@/components/icones";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

const EXEMPLO = [
  "Descrição\tFornecedor\tValor\tPeriodicidade\tRenova em",
  "Microsoft 365 — 120 licenças\tMicrosoft\tR$ 9.840,00\tMensal\t31/12/2026",
  "Antivírus corporativo\tKaspersky\t18.600,00\tAnual\t01/03/2027",
].join("\n");

/**
 * COLAR DA PLANILHA
 *
 * Um formulário de catorze campos multiplicado por trinta custos é uma tarde
 * inteira. As trinta linhas já existem numa aba de Excel — o caminho curto é
 * aceitar as trinta como estão.
 *
 * A tela é uma prévia antes de gravar, não um assistente de vários passos: cola,
 * confere o que o sistema entendeu, corrige as colunas se preciso, importa. O
 * que não foi entendido aparece linha a linha, com o texto original entre aspas,
 * porque "erro na linha 12" sem dizer o quê obriga a abrir a planilha de novo.
 */
export function Colador({
  setores,
  podeEscolherSetor,
  setorFixo,
  setorInicial,
}: {
  setores: Array<{ valor: string; rotulo: string }>;
  podeEscolherSetor: boolean;
  setorFixo: string | null;
  setorInicial: string | null;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [colado, setColado] = useState("");
  const [mapaManual, setMapaManual] = useState<Mapa | null>(null);

  const leitura = useMemo(
    () => (colado.trim() ? lerColagem(colado, mapaManual ?? undefined) : null),
    [colado, mapaManual],
  );

  const [, acao, enviando] = useActionState<Resultado | null, FormData>(async (anterior, dados) => {
    const r = await importarColados(anterior, dados);
    if (r.ok) {
      avisar({ mensagem: r.mensagem ?? "Importado.", detalhe: r.detalhe, duracao: 12_000 });
      if (r.irPara) router.push(r.irPara as never);
    } else {
      avisar({ mensagem: r.erro, tom: "erro" });
    }
    return r;
  }, null);

  // Memorizadas de propósito: `prontas` alimenta o useMemo da soma, e um array
  // novo a cada render tornaria aquele memo inútil.
  const prontas = useMemo(
    () => leitura?.linhas.filter((l) => l.problemas.length === 0) ?? [],
    [leitura],
  );
  const comProblema = useMemo(
    () => leitura?.linhas.filter((l) => l.problemas.length > 0) ?? [],
    [leitura],
  );

  // CONFERÊNCIA DO TOTAL
  //
  // A prévia responde "entendi trinta linhas" e não responde "entendi o mesmo
  // dinheiro". Uma coluna de valor mapeada na coluna errada mantém a contagem
  // de linhas intacta e muda o total — é o único erro de colagem que passa por
  // todas as outras checagens. Comparar contra o total que a pessoa lê na
  // própria planilha é o que o pega.
  const soma = useMemo(() => somaColada(prontas), [prontas]);
  const [esperado, setEsperado] = useState("");
  const esperadoLido = esperado.trim() === "" ? null : lerValorDigitado(esperado);
  const diferenca =
    esperadoLido === null ? null : Number(soma.total) - Number(esperadoLido);
  const bate = diferenca !== null && Math.abs(diferenca) < 0.005;

  function trocarColuna(campo: ChaveCampo, indice: number) {
    const base = leitura?.mapa ?? null;
    if (!base) return;
    const novo: Mapa = { ...base, [campo]: indice };
    // Uma coluna não pode alimentar dois campos: escolher a coluna 2 para
    // "Valor" tem que soltá-la de onde ela estava.
    if (indice >= 0) {
      for (const chave of Object.keys(novo) as ChaveCampo[]) {
        if (chave !== campo && novo[chave] === indice) novo[chave] = -1;
      }
    }
    setMapaManual(novo);
  }

  return (
    <form action={acao} className="mt-8 space-y-6">
      <input type="hidden" name="colado" value={colado} />
      <input type="hidden" name="mapa" value={JSON.stringify(leitura?.mapa ?? {})} />

      <label className="block">
        <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
          Cole aqui as linhas da planilha
        </span>
        <textarea
          value={colado}
          onChange={(e) => {
            setColado(e.target.value);
            // Colar outra coisa reabre a detecção automática: manter o mapa
            // anterior faria as colunas apontarem para a planilha errada.
            setMapaManual(null);
          }}
          rows={colado ? 5 : 8}
          spellCheck={false}
          placeholder={`Selecione as células no Excel, copie e cole aqui. Exemplo:\n\n${EXEMPLO}`}
          className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5 font-mono text-meta leading-relaxed outline-none focus:border-[var(--accent)]"
        />
        <span className="mt-1 block text-xs text-[var(--ink-3)]">
          Pode colar com ou sem a linha de cabeçalho. Até {MAXIMO_LINHAS} linhas por vez.
        </span>
      </label>

      {!colado.trim() && (
        <button
          type="button"
          onClick={() => setColado(EXEMPLO)}
          className="text-dado text-[var(--accent-texto)] underline underline-offset-4"
        >
          Ver com um exemplo
        </button>
      )}

      {leitura && leitura.linhas.length > 0 && (
        <>
          <section>
            <h2 className="rotulo-secao">O que cada coluna é</h2>
            <p className="mt-1 text-meta text-[var(--ink-3)]">
              {leitura.cabecalho
                ? "Detectado pelo cabeçalho da planilha. Corrija se alguma coluna caiu no lugar errado."
                : "Sem cabeçalho na colagem — escolha a que cada coluna corresponde."}{" "}
              Tudo entra em real: custos em dólar ou euro se cadastram um a um, porque cada um
              carrega a sua própria cotação.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAMPOS.map((campo) => (
                <Selecao
                  key={campo.chave}
                  rotulo={campo.rotulo + (campo.obrigatorio ? " *" : "")}
                  nome={`coluna_${campo.chave}`}
                  valor={String(leitura.mapa[campo.chave])}
                  opcoes={[
                    { valor: "-1", rotulo: "— não veio —" },
                    ...Array.from({ length: leitura.colunas }, (_, i) => ({
                      valor: String(i),
                      rotulo: leitura.cabecalho?.[i]
                        ? `${i + 1}. ${leitura.cabecalho[i]}`
                        : `Coluna ${i + 1}`,
                    })),
                  ]}
                  onChange={(e) => trocarColuna(campo.chave, Number(e.target.value))}
                />
              ))}
            </div>

            {leitura.ambiguas.length > 0 && (
              <div className="mt-3 rounded-fmp-md border border-amber-300/70 bg-amber-50 p-3 text-meta text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="flex items-start gap-2">
                  <IconeAlerta className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {leitura.ambiguas.length === 1
                      ? "Uma coluna ficou de fora porque o sistema não adivinha o que ela é:"
                      : "Estas colunas ficaram de fora porque o sistema não adivinha o que elas são:"}
                  </span>
                </p>
                <ul className="mt-1.5 space-y-1 pl-6">
                  {leitura.ambiguas.map((a) => (
                    <li key={a.indice}>
                      <strong>
                        {a.indice + 1}. {a.titulo}
                      </strong>{" "}
                      — {a.recado}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="rotulo-secao">Prévia</h2>
              <p className="text-meta text-[var(--ink-2)]">
                <strong className="text-emerald-700 dark:text-emerald-400">{prontas.length}</strong>{" "}
                {prontas.length === 1 ? "pronta" : "prontas"}
                {comProblema.length > 0 && (
                  <>
                    {" · "}
                    <strong className="text-[var(--accent-texto)]">{comProblema.length}</strong> com
                    problema
                  </>
                )}
                {leitura.cortadas > 0 && <> · {leitura.cortadas} além do limite</>}
              </p>
            </div>

            <div className="relative mt-3 overflow-x-auto rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)]">
              <table className="w-full min-w-[720px] text-dado">
                <thead>
                  <tr className="border-b border-[var(--rule)] rotulo-coluna">
                    <th className="w-10 px-3 py-2.5 text-right font-semibold">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Custo</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Valor</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Cobrança</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Natureza</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Renova</th>
                  </tr>
                </thead>
                <tbody>
                  {leitura.linhas.map((linha) => {
                    const ruim = linha.problemas.length > 0;
                    return (
                      <tr
                        key={linha.numero}
                        className={`border-b border-[var(--rule)] last:border-0 ${
                          ruim ? "bg-[var(--accent)]/[0.05]" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-right text-micro tabular-nums text-[var(--ink-3)]">
                          {linha.numero}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{linha.descricao || "—"}</span>
                          <span className="block text-micro text-[var(--ink-3)]">
                            {linha.fornecedor ?? "sem fornecedor"}
                            {linha.categoria ? ` · ${linha.categoria}` : ""}
                          </span>
                          {ruim && (
                            <span className="mt-1 flex items-start gap-1.5 text-micro text-[var(--accent-texto)]">
                              <IconeAlerta className="mt-px size-3.5 shrink-0" />
                              {linha.problemas.join(" · ")}
                            </span>
                          )}
                          {!ruim && linha.avisos.length > 0 && (
                            <span className="mt-0.5 block text-micro text-[var(--ink-3)]">
                              {linha.avisos.join(" · ")}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {linha.valorPeriodo ? formatarBRL(linha.valorPeriodo) : "—"}
                        </td>
                        <td className="px-3 py-2 text-[var(--ink-2)]">
                          {ROTULOS_PERIODICIDADE[linha.periodicidade]}
                        </td>
                        <td className="px-3 py-2 text-[var(--ink-2)]">
                          {ROTULOS_NATUREZA[linha.natureza] ?? linha.natureza}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-[var(--ink-2)]">
                          {linha.dataFim
                            ? linha.dataFim.toLocaleDateString("pt-BR", { timeZone: "UTC" })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface-2)] px-4 py-3">
              <div>
                <p className="rotulo-coluna">Soma do que vai entrar</p>
                <p className="mt-0.5 text-dado tabular-nums">
                  <strong className="text-base">{formatarBRL(soma.total)}</strong>
                  <span className="ml-2 text-[var(--ink-3)]">
                    em {soma.comValor} {soma.comValor === 1 ? "linha" : "linhas"}
                    {soma.semValor > 0 && ` · ${soma.semValor} sem valor, a apurar`}
                  </span>
                </p>
              </div>

              <label className="flex flex-wrap items-center gap-2 text-meta text-[var(--ink-2)]">
                <span>Total que a sua planilha mostra</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={esperado}
                  onChange={(e) => setEsperado(e.target.value)}
                  placeholder="0,00"
                  aria-label="Total que a sua planilha mostra, para conferência"
                  className="w-36 rounded-fmp-sm border border-[var(--rule)] bg-[var(--surface)] px-2.5 py-1.5 text-right text-dado tabular-nums"
                />
                {esperadoLido !== null && (
                  <span
                    className={
                      bate
                        ? "font-semibold text-emerald-700 dark:text-emerald-400"
                        : "font-semibold text-[var(--accent-texto)]"
                    }
                  >
                    {bate
                      ? "bate"
                      : `difere ${formatarBRL(Math.abs(diferenca ?? 0).toFixed(2))}`}
                  </span>
                )}
                {esperado.trim() !== "" && esperadoLido === null && (
                  <span className="text-[var(--ink-3)]">não entendi esse número</span>
                )}
              </label>
            </div>

            {esperadoLido !== null && !bate && (
              <p className="mt-2 text-meta text-[var(--accent-texto)]">
                A contagem de linhas pode estar certa e o dinheiro errado — normalmente é a coluna
                de valor apontada para a coluna vizinha. Confira o mapeamento acima antes de
                importar.
              </p>
            )}

            {comProblema.length > 0 && (
              <p className="mt-2.5 text-meta text-[var(--ink-3)]">
                As linhas com problema não são importadas e não impedem as outras. Corrija na
                planilha e cole de novo, ou importe estas {prontas.length} agora e trate o resto
                depois.
              </p>
            )}
          </section>

          <section className="rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
            {podeEscolherSetor ? (
              <Selecao
                rotulo="Setor responsável por estes custos"
                nome="setorId"
                opcoes={setores}
                valor={setorInicial}
                obrigatorio
                dica="Todos entram 100% neste setor. O rateio entre áreas é feito depois, custo a custo."
              />
            ) : (
              <p className="text-dado text-[var(--ink-3)]">
                Setor responsável: <strong className="text-[var(--ink-2)]">{setorFixo}</strong> —
                todos os custos entram na sua área.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={enviando || prontas.length === 0}
                className={classesDeBotao("primario")}
              >
                <IconeCheck className="size-4" />
                {enviando
                  ? "Importando…"
                  : `Importar ${prontas.length} ${prontas.length === 1 ? "custo" : "custos"}`}
              </button>
              <p className="text-meta text-[var(--ink-3)]">
                Entram como <strong>em análise</strong> — nada soma no total da FMP antes de você
                conferir.
              </p>
            </div>
          </section>
        </>
      )}
    </form>
  );
}
