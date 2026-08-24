"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Decimal } from "decimal.js";
import { salvarModelo, salvarRateio } from "./acoes";
import { useAviso } from "@/components/avisos";
import { formatarBRL } from "@/lib/dinheiro";
import {
  MAXIMO_FATIAS,
  TOTAL,
  arredondar,
  balancear,
  dividirIgualmente,
  podeArredondar,
  problemas,
  textoDeUnidades,
  unidadesDeReais,
  unidadesDeTexto,
  valoresEmReais,
  unidadesDeBanco,
  type Fatia,
} from "@/lib/rateio";
import { IconeAncora, IconeFechar, IconeMais } from "@/components/icones";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

/**
 * EDITOR DE RATEIO
 *
 * A regra que governa esta tela: **a soma fecha sozinha**. Uma das linhas é a
 * âncora e recebe o que sobrar, então não existe estado "110%" para avisar nem
 * para bloquear. Digitar 60% no Comercial faz a TI ir a 40% na mesma tecla —
 * e acrescentar uma terceira fatia tira da âncora, nunca de quem já foi
 * digitado. Ninguém precisa somar de cabeça em momento nenhum.
 *
 * A segunda regra: **nada muda em silêncio**. Toda vez que o sistema mexe na
 * âncora, aquela linha pisca em âmbar e passa a exibir o delta acumulado
 * (−65,50) até a gravação. Mudança que o sistema faz e a pessoa não vê é
 * descoberta no fechamento do mês, e a partir daí ela confere tudo na planilha.
 *
 * A terceira: **todo percentual anda com o seu real**. "60%" não se discute
 * numa reunião; "R$ 744,00/mês" se discute. As duas colunas são editáveis e o
 * que se grava é sempre o percentual — o custo reajusta e a proporção sobrevive.
 */

type Opcao = { valor: string; rotulo: string };

export type Modelo = {
  id: string;
  nome: string;
  parcelas: Array<{ setorId: string; percentual: string }>;
};

type Linha = Fatia & {
  /** Chave estável de React: o índice muda quando se remove uma linha do meio. */
  chave: number;
  /** O que está escrito no campo, para "60," não virar "60,00" no meio da digitação. */
  rascunho: string | null;
};

const paraLinha = (f: Fatia, chave: number): Linha => ({ ...f, chave, rascunho: null });

export function EditorDeRateio({
  itemId,
  descricao,
  valorMensal,
  setores,
  inicial,
  aplicaDireto,
  modelos,
  aoConcluir,
}: {
  itemId: string;
  descricao: string;
  /** Valor mensal do custo, para a coluna de reais. Null = item sem valor apurado. */
  valorMensal: string | null;
  setores: Opcao[];
  inicial: Fatia[];
  /** Controladoria e admin aplicam direto; gestor propõe e espera aceite. */
  aplicaDireto: boolean;
  /** Divisões já nomeadas, para não redigitar o mesmo critério em doze custos. */
  modelos: Modelo[];
  aoConcluir?: () => void;
}) {
  const avisar = useAviso();
  // O aviso nasce dentro da action: num efeito que observa o resultado, ele
  // reapareceria a cada re-render depois de a pessoa já tê-lo fechado.
  const [, acao, enviando] = useActionState<Resultado | null, FormData>(async (anterior, dados) => {
    const r = await salvarRateio(anterior, dados);
    if (r.ok) {
      avisar({ mensagem: r.mensagem ?? "Rateio salvo.", detalhe: r.detalhe });
      aoConcluir?.();
    } else {
      avisar({ mensagem: r.erro, tom: "erro" });
    }
    return r;
  }, null);

  const proximaChave = useRef(inicial.length);
  const [linhas, setLinhas] = useState<Linha[]>(() => inicial.map(paraLinha));
  const [flash, setFlash] = useState(0);
  const [tocado, setTocado] = useState(false);
  const [nomeando, setNomeando] = useState(false);
  const focarProximo = useRef<{ chave: number; campo: "setor" | "pct" } | null>(null);

  const nomes = useMemo(() => new Map(setores.map((s) => [s.valor, s.rotulo])), [setores]);
  const balanco = useMemo(() => balancear(linhas), [linhas]);
  const reais = useMemo(
    () => valoresEmReais(balanco.fatias, valorMensal),
    [balanco.fatias, valorMensal],
  );
  const listaDeProblemas = useMemo(
    () => (tocado ? problemas(linhas, nomes) : []),
    [linhas, nomes, tocado],
  );
  const problemaDaLinha = useMemo(
    () => new Map(listaDeProblemas.map((p) => [p.indice, p.mensagem])),
    [listaDeProblemas],
  );

  const ancoraInicial = balancear(inicial).ancora;
  const deltaAncora = balanco.ancora - ancoraInicial;

  // A âncora pisca a cada vez que o sistema a move. `flash` sobe junto e vira a
  // key da célula, o que remonta o nó e faz a animação tocar de novo mesmo
  // quando duas alterações seguidas param no mesmo número.
  //
  // O ajuste acontece durante a renderização, não num efeito: assim a linha já
  // sai pintada no mesmo quadro em que o número muda. Num efeito haveria um
  // quadro com o valor novo e sem o destaque — que é justamente o instante em
  // que a pessoa olha.
  const [ancoraAnterior, setAncoraAnterior] = useState(balanco.ancora);
  if (ancoraAnterior !== balanco.ancora) {
    setAncoraAnterior(balanco.ancora);
    setFlash((n) => n + 1);
  }

  // Foco encadeado: escolher o setor leva ao percentual, adicionar linha leva
  // ao setor. É o que transforma "clicar em cada campo" em "digitar seguido".
  useEffect(() => {
    const alvo = focarProximo.current;
    if (!alvo) return;
    focarProximo.current = null;
    document.querySelector<HTMLElement>(`[data-campo="${alvo.campo}-${alvo.chave}"]`)?.focus();
  }, [linhas]);

  function mexer(recalcular: (ls: Linha[]) => Linha[]) {
    setTocado(true);
    setLinhas(recalcular);
  }

  function definirPct(chave: number, texto: string) {
    mexer((ls) =>
      ls.map((l) =>
        l.chave === chave ? { ...l, rascunho: texto, unidades: unidadesDeTexto(texto) ?? 0 } : l,
      ),
    );
  }

  function definirReais(chave: number, texto: string) {
    const limpo = texto
      .replace(/[^\d,.]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const unidades = limpo === "" ? 0 : (unidadesDeReais(limpo, valorMensal) ?? 0);
    mexer((ls) =>
      ls.map((l) =>
        l.chave === chave ? { ...l, unidades: Math.min(unidades, TOTAL), rascunho: null } : l,
      ),
    );
  }

  function adicionar() {
    const chave = proximaChave.current++;
    mexer((ls) => [...ls, { setorId: "", unidades: 0, ancora: false, chave, rascunho: "" }]);
    focarProximo.current = { chave, campo: "setor" };
  }

  function remover(chave: number) {
    mexer((ls) => {
      const restantes = ls.filter((l) => l.chave !== chave);
      // Remover a própria âncora não pode deixar o rateio sem quem feche a
      // conta: a maior fatia restante assume o posto.
      if (!restantes.some((l) => l.ancora) && restantes.length > 0) {
        const maior = restantes.reduce(
          (m, l, i) => (l.unidades > restantes[m].unidades ? i : m),
          0,
        );
        return restantes.map((l, i) => (i === maior ? { ...l, ancora: true } : l));
      }
      return restantes;
    });
  }

  function trocarAncora(chave: number) {
    mexer((ls) =>
      ls.map((l) =>
        // A âncora antiga congela no percentual que estava exibindo e vira uma
        // fatia digitada como as outras — nada muda de valor na troca.
        l.chave === chave
          ? { ...l, ancora: true }
          : {
              ...l,
              ancora: false,
              unidades: balanco.fatias.find((f) => f.setorId === l.setorId)?.unidades ?? l.unidades,
              rascunho: null,
            },
      ),
    );
  }

  function umSetorSo() {
    mexer((ls) => {
      const ancora = ls.find((l) => l.ancora) ?? ls[0];
      return ancora ? [{ ...ancora, ancora: true, unidades: TOTAL, rascunho: null }] : ls;
    });
  }

  function igualmente() {
    mexer((ls) => {
      const partes = dividirIgualmente(ls.length);
      // O maior resto vai para a âncora: ela é a linha que já absorve sobras
      // por contrato, então o centavo extra cai onde a tela promete que cai.
      const ordem = [...ls.keys()].sort((a, b) =>
        ls[a].ancora === ls[b].ancora ? 0 : ls[a].ancora ? -1 : 1,
      );
      const atribuido = new Map(ordem.map((indice, i) => [indice, partes[i]]));
      return ls.map((l, i) => ({ ...l, unidades: atribuido.get(i) ?? l.unidades, rascunho: null }));
    });
  }

  /**
   * Aplica um modelo salvo.
   *
   * A âncora é escolhida na aplicação, não vem no modelo: fica com o setor de
   * maior fatia, que é quem tem folga para absorver o arredondamento. As
   * linhas que não estão no modelo somem — aplicar um modelo é dizer "a
   * divisão é esta", não "some isto ao que já está aí".
   */
  function aplicarModelo(modelo: Modelo) {
    proximaChave.current = modelo.parcelas.length;
    const maior = modelo.parcelas.reduce(
      (m, p, i) => (Number(p.percentual) > Number(modelo.parcelas[m].percentual) ? i : m),
      0,
    );
    setTocado(true);
    setLinhas(
      modelo.parcelas.map((p, i) => ({
        setorId: p.setorId,
        unidades: unidadesDeBanco(p.percentual),
        ancora: i === maior,
        chave: i,
        rascunho: null,
      })),
    );
  }

  function descartar() {
    proximaChave.current = inicial.length;
    setLinhas(inicial.map(paraLinha));
    setTocado(false);
  }

  const alterado =
    linhas.length !== inicial.length ||
    balanco.fatias.some(
      (f, i) => f.setorId !== inicial[i]?.setorId || f.unidades !== inicial[i]?.unidades,
    );
  const podeAdicionar = linhas.length < MAXIMO_FATIAS && linhas.length < setores.length;
  const setorAncora = balanco.indiceAncora >= 0 ? linhas[balanco.indiceAncora].setorId : "";

  return (
    // O painel de nomear modelo é IRMÃO do formulário, nunca filho: form
    // dentro de form é inválido em HTML, o parser do navegador descarta o de
    // dentro, e o botão de salvar o modelo acabava sem formulário para enviar.
    <>
      <form action={acao} className="space-y-5">
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="ancora" value={setorAncora} />

        <div className="space-y-2">
          {linhas.map((linha, i) => {
            const fatia = balanco.fatias[i];
            const erro = problemaDaLinha.get(i);
            const usados = new Set(
              linhas.filter((l) => l.chave !== linha.chave).map((l) => l.setorId),
            );

            return (
              <div
                key={linha.chave}
                className={`rounded-fmp-md border px-3 py-2.5 ${
                  erro
                    ? "border-[var(--accent)]/50 bg-[var(--accent)]/5"
                    : "border-[var(--rule)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <select
                    name={`setor_${i}`}
                    data-campo={`setor-${linha.chave}`}
                    value={linha.setorId}
                    onChange={(e) => {
                      const setorId = e.target.value;
                      mexer((ls) =>
                        ls.map((l) => (l.chave === linha.chave ? { ...l, setorId } : l)),
                      );
                      if (setorId && !linha.ancora) {
                        focarProximo.current = { chave: linha.chave, campo: "pct" };
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Escolha o setor…</option>
                    {setores.map((s) => (
                      <option key={s.valor} value={s.valor} disabled={usados.has(s.valor)}>
                        {s.rotulo}
                      </option>
                    ))}
                  </select>

                  {/* Percentual */}
                  <div className="relative w-[92px] shrink-0">
                    <input
                      name={`pct_${i}`}
                      data-campo={`pct-${linha.chave}`}
                      // A âncora não se digita: ela é o resultado. Campo somente
                      // leitura em vez de campo escondido, para a pessoa ver de
                      // onde saiu o número que fecha a conta.
                      readOnly={linha.ancora}
                      value={
                        linha.ancora
                          ? textoDeUnidades(fatia.unidades)
                          : (linha.rascunho ?? textoDeUnidades(linha.unidades))
                      }
                      onChange={(e) => definirPct(linha.chave, e.target.value)}
                      onBlur={() =>
                        !linha.ancora &&
                        mexer((ls) =>
                          ls.map((l) => (l.chave === linha.chave ? { ...l, rascunho: null } : l)),
                        )
                      }
                      inputMode="decimal"
                      placeholder="0,00"
                      aria-label={`Percentual de ${nomes.get(linha.setorId) ?? `linha ${i + 1}`}`}
                      className={`w-full rounded-lg border py-1.5 pr-6 pl-2 text-right text-sm tabular-nums outline-none ${
                        linha.ancora
                          ? "cursor-default border-transparent bg-[var(--ground)] font-semibold text-[var(--ink-2)]"
                          : "border-[var(--rule)] bg-[var(--ground)] focus:border-[var(--accent)]"
                      }`}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-meta text-[var(--ink-3)]"
                    >
                      %
                    </span>
                  </div>

                  {/* Reais — a coluna que torna a conversa possível. */}
                  <div className="w-[112px] shrink-0">
                    {valorMensal === null ? (
                      <p className="py-1.5 text-right text-dado text-[var(--ink-3)]">—</p>
                    ) : linha.ancora ? (
                      <p
                        key={`r${flash}`}
                        className="py-1.5 text-right text-dado font-semibold tabular-nums motion-safe:animate-[destacar_2s_ease-out]"
                      >
                        {formatarBRL(reais[i] ?? 0)}
                      </p>
                    ) : (
                      <input
                        value={formatarBRL(reais[i] ?? 0)}
                        onChange={(e) => definirReais(linha.chave, e.target.value)}
                        inputMode="decimal"
                        aria-label={`Valor mensal de ${nomes.get(linha.setorId) ?? `linha ${i + 1}`}`}
                        className="w-full rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-2 py-1.5 text-right text-dado tabular-nums outline-none focus:border-[var(--accent)]"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remover(linha.chave)}
                    disabled={linhas.length === 1}
                    aria-label={`Remover ${nomes.get(linha.setorId) ?? `linha ${i + 1}`}`}
                    title="Remover linha"
                    className="shrink-0 rounded-lg p-1.5 text-[var(--ink-3)] hover:bg-[var(--ground)] hover:text-[var(--accent)] disabled:opacity-25"
                  >
                    <IconeFechar className="size-4" />
                  </button>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-0.5">
                  {linha.ancora ? (
                    <span
                      key={`a${flash}`}
                      className="flex items-center gap-1.5 rounded-md px-1 text-micro font-medium text-[var(--ink-3)] motion-safe:animate-[destacar_2s_ease-out]"
                    >
                      <IconeAncora className="size-3.5" />
                      absorve o restante
                      {deltaAncora !== 0 && (
                        <strong className="tabular-nums text-[var(--ink-2)]">
                          ({deltaAncora > 0 ? "+" : "−"}
                          {textoDeUnidades(Math.abs(deltaAncora))})
                        </strong>
                      )}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => trocarAncora(linha.chave)}
                      disabled={!linha.setorId}
                      title="Troca qual setor fecha a conta. Nenhum percentual muda agora."
                      className="flex items-center gap-1 rounded-md border border-dashed border-[var(--rule)] px-1.5 py-0.5 text-micro text-[var(--ink-3)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
                    >
                      <IconeAncora className="size-3" />
                      passar o restante para cá
                    </button>
                  )}
                  {erro && (
                    <span role="alert" className="text-micro font-medium text-[var(--accent)]">
                      {erro}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Chip aoClicar={adicionar} desabilitado={!podeAdicionar} destaque>
            <IconeMais className="size-3.5" />
            Adicionar setor
          </Chip>
          {linhas.length > 1 && <Chip aoClicar={umSetorSo}>Voltar a um setor só</Chip>}
          {linhas.length > 1 && <Chip aoClicar={igualmente}>Dividir igualmente</Chip>}
          {podeArredondar(linhas) && (
            <Chip aoClicar={() => mexer((ls) => arredondar(ls) as Linha[])}>Arredondar</Chip>
          )}
          {alterado && <Chip aoClicar={descartar}>Descartar alterações</Chip>}
        </div>

        {/* Modelos: o mesmo critério de divisão aplicado a muitos custos sem
          redigitar. Ficam abaixo dos chips de ação porque são atalho, não o
          caminho principal — quem divide um custo só nunca precisa deles. */}
        {(modelos.length > 0 || linhas.length > 1) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--rule)] pt-4">
            {modelos.length > 0 && <span className="text-meta text-[var(--ink-3)]">Modelos:</span>}
            {modelos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => aplicarModelo(m)}
                title={m.parcelas
                  .map(
                    (p) =>
                      `${nomes.get(p.setorId) ?? "setor"} ${textoDeUnidades(unidadesDeBanco(p.percentual))}%`,
                  )
                  .join(" · ")}
                className="rounded-full border border-[var(--rule)] px-3 py-1.5 text-meta text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {m.nome}
              </button>
            ))}
            {linhas.length > 1 && !nomeando && (
              <button
                type="button"
                onClick={() => setNomeando(true)}
                className="ml-auto text-meta text-[var(--ink-3)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
              >
                Salvar esta divisão como modelo
              </button>
            )}
          </div>
        )}

        {/* O centavo do arredondamento tem dono, e a tela diz de quem é. */}
        {valorMensal !== null && balanco.indiceAncora >= 0 && (
          <ResiduoDeclarado
            reais={reais}
            indiceAncora={balanco.indiceAncora}
            fatias={balanco.fatias}
            valorMensal={valorMensal}
            nomes={nomes}
          />
        )}

        <label className="block">
          <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
            {aplicaDireto ? "Motivo (fica no histórico)" : "Justificativa (ajuda quem vai aceitar)"}
          </span>
          <textarea
            name="justificativa"
            rows={2}
            placeholder="Ex.: o CRM é usado pela captação — a operação é do Comercial."
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            // Nunca desabilitado. Botão apagado e mudo faz a pessoa clicar três
            // vezes achando que a tela travou; clicável, ele repete o erro e
            // aponta a linha culpada — que é a resposta que ela procurava.
            disabled={enviando}
            className={classesDeBotao("primario")}
          >
            {enviando ? "Salvando…" : aplicaDireto ? "Aplicar rateio" : "Enviar proposta"}
          </button>
          {aoConcluir && (
            <button
              type="button"
              onClick={aoConcluir}
              className="text-dado text-[var(--ink-3)] hover:underline"
            >
              Cancelar
            </button>
          )}
        </div>

        {!aplicaDireto && (
          <p className="text-meta leading-relaxed text-[var(--ink-3)]">
            Cada setor que recebe uma fatia precisa aceitar. A proposta aparece na tela inicial do
            gestor da área, e o rateio de <strong>{descricao}</strong> só entra em vigor quando
            todos aceitarem. Enquanto isso, o rateio atual continua valendo.
          </p>
        )}
      </form>

      {nomeando && (
        <div className="mt-4">
          <NomearModelo linhas={balanco.fatias} aoFechar={() => setNomeando(false)} />
        </div>
      )}
    </>
  );
}

function Chip({
  children,
  aoClicar,
  desabilitado,
  destaque,
}: {
  children: React.ReactNode;
  aoClicar: () => void;
  desabilitado?: boolean;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-meta transition-colors disabled:opacity-40 ${
        destaque
          ? "border-[var(--accent)]/40 font-medium text-[var(--accent)] hover:bg-[var(--accent)]/8"
          : "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Declara em quem caiu o centavo do arredondamento.
 *
 * Dividir R$ 1.000,00 em três dá 333,33 três vezes e sobra um centavo. Ele vai
 * para a âncora por construção — mas dinheiro que aparece sem explicação é o
 * tipo de coisa que faz a controladoria abrir a planilha para conferir.
 */
function ResiduoDeclarado({
  reais,
  indiceAncora,
  fatias,
  valorMensal,
  nomes,
}: {
  reais: Array<Decimal | null>;
  indiceAncora: number;
  fatias: Fatia[];
  valorMensal: string;
  nomes: Map<string, string>;
}) {
  const proporcional = new Decimal(valorMensal)
    .mul(fatias[indiceAncora].unidades)
    .div(TOTAL)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const residuo = (reais[indiceAncora] ?? new Decimal(0)).minus(proporcional);
  if (residuo.isZero()) return null;

  return (
    <p className="text-meta text-[var(--ink-3)]">
      {nomes.get(fatias[indiceAncora].setorId) ?? "A âncora"} absorve o arredondamento de{" "}
      <span className="tabular-nums">{formatarBRL(residuo.abs())}</span>, para as fatias somarem
      exatamente {formatarBRL(valorMensal)}.
    </p>
  );
}

/**
 * Dá nome à divisão atual para reusá-la.
 *
 * Os mesmos campos `setor_i`/`pct_i` do rateio são reenviados escondidos, para
 * o servidor reinterpretar a divisão pelo mesmo caminho que usa ao gravar um
 * rateio de verdade — a leitura das fatias é a mesma função nos dois casos, e
 * um modelo não pode nascer de uma aritmética diferente.
 */
function NomearModelo({ linhas, aoFechar }: { linhas: Fatia[]; aoFechar: () => void }) {
  const avisar = useAviso();
  const [, acao, enviando] = useActionState<Resultado | null, FormData>(async (anterior, dados) => {
    const r = await salvarModelo(anterior, dados);
    if (r.ok) {
      avisar({ mensagem: r.mensagem ?? "Modelo salvo.", detalhe: r.detalhe });
      aoFechar();
    } else {
      avisar({ mensagem: r.erro, tom: "erro" });
    }
    return r;
  }, null);

  const ancora = linhas.find((l) => l.ancora)?.setorId ?? "";

  return (
    <form
      action={acao}
      className="rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-4"
    >
      <input type="hidden" name="ancora" value={ancora} />
      {linhas.map((l, i) => (
        <span key={l.setorId || i}>
          <input type="hidden" name={`setor_${i}`} value={l.setorId} />
          <input type="hidden" name={`pct_${i}`} value={textoDeUnidades(l.unidades)} />
        </span>
      ))}

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-meta font-medium text-[var(--ink-2)]">
            Nome do modelo
          </span>
          <input
            name="nome"
            autoFocus
            maxLength={80}
            placeholder="Ex.: Infraestrutura compartilhada 70/30"
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-[var(--ink)] px-3.5 py-2 text-dado font-semibold text-[var(--ground)] disabled:opacity-50"
        >
          {enviando ? "Salvando…" : "Salvar modelo"}
        </button>
        <button
          type="button"
          onClick={aoFechar}
          className="px-1 py-2 text-dado text-[var(--ink-3)] hover:underline"
        >
          Cancelar
        </button>
      </div>
      <p className="mt-1.5 text-micro text-[var(--ink-3)]">
        Guarda só os percentuais. Qual setor absorve o restante é decidido a cada uso.
      </p>
    </form>
  );
}
