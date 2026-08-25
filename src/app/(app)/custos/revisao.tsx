"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  alterarCategoria,
  alterarValor,
  definirCambio,
  definirDataFim,
  marcarSemPrazo,
} from "./acoes-rapidas";
import { useAviso } from "@/components/avisos";
import { PainelLateral } from "@/components/painel";
import {
  formatarBRL,
  formatarMoeda,
  lerCambioDigitado,
  lerValorDigitado,
  valorMensalEmReais,
} from "@/lib/dinheiro";
import { ROTULOS_PERIODICIDADE } from "@/lib/opcoes";
import { IconeCheck } from "@/components/icones";
import type { Moeda, Periodicidade } from "@/generated/prisma/enums";
import type { LinhaCusto } from "./tabela";
import { classesDeBotao } from "@/components/botao";

/**
 * MODO REVISÃO
 *
 * A fila de pendências resolve o "o quê"; isto resolve o "de novo". Doze custos
 * sem data significam doze aberturas de item, doze voltas à lista e doze
 * perdas do lugar onde se estava — e é a mesma tecla doze vezes.
 *
 * Aqui a fila é percorrida no painel lateral: cada item mostra só o que falta
 * nele, gravar avança sozinho para o próximo, e o contador desce. ↑ e ↓ trocam
 * de item sem fechar nada.
 *
 * A mensagem final não diz "concluído": diz o que o trabalho comprou. Preencher
 * doze datas não é uma tarefa cumprida, é o alerta de renovação passando a
 * cobrir a área inteira — e é isso que faz a pessoa voltar da próxima vez.
 */

type Falta = "valor" | "cambio" | "data" | "categoria";

function faltasDe(item: LinhaCusto): Falta[] {
  const faltas: Falta[] = [];
  if (item.valorPeriodo === null) faltas.push("valor");
  // Antes da data e da categoria porque é a única que mantém o custo fora do
  // total: as outras deixam o item incompleto, esta deixa a SOMA incompleta.
  if (item.moeda !== "BRL" && item.cambio === null) faltas.push("cambio");
  if (item.dataFim === null && !item.semPrazo) faltas.push("data");
  if (item.categoria === null) faltas.push("categoria");
  return faltas;
}

export function ModoRevisao({
  itens,
  categorias,
}: {
  itens: LinhaCusto[];
  categorias: Array<{ valor: string; rotulo: string }>;
}) {
  const router = useRouter();
  const avisar = useAviso();
  const [, transicao] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState(0);
  /** Itens já resolvidos nesta sessão de revisão, para o contador descer. */
  const [resolvidos, setResolvidos] = useState<Set<string>>(new Set());

  /**
   * A fila é CONGELADA quando a revisão começa.
   *
   * Gravar dispara `revalidatePath` na action, e o Next re-renderiza a lista na
   * mesma resposta — o item resolvido sai do filtro de pendências e todos os
   * seguintes sobem uma posição. Sem o congelamento, salvar o terceiro item
   * fazia o quarto virar o terceiro, o contador cair de onze para dez de dez, e
   * a seta para baixo repetir o item em que a pessoa já estava.
   *
   * Com a fila fixa, o resolvido continua ocupando o lugar dele (marcado como
   * feito) e a navegação segue previsível até o fim.
   */
  const disponivel = useMemo(() => itens.filter((i) => i.podeEditar && !i.naLixeira), [itens]);
  const [fila, setFila] = useState<LinhaCusto[]>([]);
  const restantes = fila.filter((i) => !resolvidos.has(i.id));
  const atual = fila[posicao];

  const gravar = useCallback(
    async (
      acao: (d: FormData) => Promise<{ ok: boolean; erro?: string; mensagem?: string }>,
      dados: FormData,
      id: string,
    ) => {
      const r = await acao(dados);
      if (!r.ok) {
        avisar({ mensagem: r.erro ?? "Não consegui salvar.", tom: "erro" });
        return false;
      }
      setResolvidos((atuais) => new Set(atuais).add(id));
      // O refresh é adiado para o fim da revisão: recarregar a lista a cada
      // gravação reordenaria a fila embaixo de quem está percorrendo ela.
      return true;
    },
    [avisar],
  );

  function avancar() {
    const proximo = fila.findIndex((i, n) => n > posicao && !resolvidos.has(i.id));
    if (proximo >= 0) {
      setPosicao(proximo);
      return;
    }
    // Não há próximo adiante: volta para o primeiro pendente antes daqui.
    const anterior = fila.findIndex((i) => !resolvidos.has(i.id));
    if (anterior >= 0) setPosicao(anterior);
  }

  function encerrar() {
    setAberto(false);
    if (resolvidos.size > 0) transicao(() => router.refresh());
  }

  if (disponivel.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFila(disponivel);
          setResolvidos(new Set());
          setPosicao(0);
          setAberto(true);
        }}
        className="rounded-fmp-md border border-[var(--accent)]/40 bg-[var(--surface)] px-3.5 py-2 text-dado font-medium text-[var(--accent-texto)] hover:bg-[var(--accent)]/8"
      >
        Revisar em sequência ({disponivel.length})
      </button>

      <PainelLateral
        aberto={aberto && atual !== undefined}
        titulo={atual?.descricao ?? ""}
        subtitulo={
          atual && (
            <>
              {atual.fornecedor ?? "sem fornecedor"}
              {atual.setores[0] ? ` · ${atual.setores[0].nome}` : ""}
              {atual.valorMensal ? ` · ${formatarBRL(atual.valorMensal)}/mês` : ""}
            </>
          )
        }
        posicao={
          restantes.length === 0 ? "tudo resolvido" : `faltam ${restantes.length} de ${fila.length}`
        }
        aoAnterior={posicao > 0 ? () => setPosicao(posicao - 1) : undefined}
        aoProximo={posicao < fila.length - 1 ? () => setPosicao(posicao + 1) : undefined}
        aoFechar={encerrar}
        rodape={
          restantes.length === 0 ? (
            <Concluido quantidade={resolvidos.size} aoFechar={encerrar} />
          ) : (
            <p className="text-meta text-[var(--ink-3)]">
              Enter grava e vai ao próximo · Alt+↑ e Alt+↓ trocam de custo · Esc volta para a lista
            </p>
          )
        }
      >
        {atual && (
          <FichaDeRevisao
            key={atual.id}
            item={atual}
            categorias={categorias}
            resolvido={resolvidos.has(atual.id)}
            gravar={gravar}
            aoResolver={avancar}
          />
        )}
      </PainelLateral>
    </>
  );
}

function Concluido({ quantidade, aoFechar }: { quantidade: number; aoFechar: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-dado font-medium text-emerald-700 dark:text-emerald-400">
        <IconeCheck className="size-4" />
        {quantidade === 0
          ? "Nada faltando nesta fila."
          : `${quantidade} ${quantidade === 1 ? "cadastro completo" : "cadastros completos"}.`}
      </p>
      <button
        type="button"
        onClick={aoFechar}
        className="rounded-lg bg-[var(--ink)] px-3.5 py-2 text-dado font-semibold text-[var(--ground)]"
      >
        Voltar para a lista
      </button>
    </div>
  );
}

function FichaDeRevisao({
  item,
  categorias,
  resolvido,
  gravar,
  aoResolver,
}: {
  item: LinhaCusto;
  categorias: Array<{ valor: string; rotulo: string }>;
  resolvido: boolean;
  gravar: (
    acao: (d: FormData) => Promise<{ ok: boolean; erro?: string; mensagem?: string }>,
    dados: FormData,
    id: string,
  ) => Promise<boolean>;
  aoResolver: () => void;
}) {
  const [valor, setValor] = useState("");
  const [taxa, setTaxa] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const primeiro = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const faltas = faltasDe(item);
  const numero = lerValorDigitado(valor);
  // A conversão usa a moeda e a taxa que o item já tem: a revisão preenche o
  // que falta, não redefine em que moeda o contrato foi assinado.
  // A taxa que a pessoa está digitando agora vale mais que a gravada: é ela
  // que a prévia precisa refletir, senão o número só muda depois de salvar.
  const taxaEmUso = item.moeda === "BRL" ? null : (lerCambioDigitado(taxa) ?? item.cambio);
  const mensal = valorMensalEmReais(
    numero ?? item.valorPeriodo,
    item.periodicidade as Periodicidade,
    item.moeda as Moeda,
    taxaEmUso,
  );

  async function salvarTudo() {
    setSalvando(true);
    let algum = false;

    if (faltas.includes("valor") && valor.trim()) {
      const d = new FormData();
      d.set("id", item.id);
      d.set("valorPeriodo", valor);
      algum = (await gravar(alterarValor, d, item.id)) || algum;
    }
    if (faltas.includes("cambio") && taxa.trim()) {
      const d = new FormData();
      d.set("id", item.id);
      d.set("cambio", taxa);
      algum = (await gravar(definirCambio, d, item.id)) || algum;
    }
    if (faltas.includes("data") && data) {
      const d = new FormData();
      d.set("id", item.id);
      d.set("dataFim", data);
      algum = (await gravar(definirDataFim, d, item.id)) || algum;
    }
    if (faltas.includes("categoria") && categoria) {
      const d = new FormData();
      d.set("id", item.id);
      d.set("categoriaId", categoria);
      algum = (await gravar(alterarCategoria, d, item.id)) || algum;
    }

    setSalvando(false);
    if (algum) aoResolver();
  }

  async function semPrazo() {
    setSalvando(true);
    const d = new FormData();
    d.set("id", item.id);
    const ok = await gravar(marcarSemPrazo, d, item.id);
    setSalvando(false);
    if (ok) aoResolver();
  }

  /** Enter grava e vai ao próximo: o gesto de quem preenche uma fila inteira. */
  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || e.altKey) return;
    e.preventDefault();
    if (temAlgoParaSalvar && !salvando) void salvarTudo();
  }

  const temAlgoParaSalvar =
    (faltas.includes("valor") && valor.trim() !== "") ||
    (faltas.includes("cambio") && taxa.trim() !== "") ||
    (faltas.includes("data") && data !== "") ||
    (faltas.includes("categoria") && categoria !== "");

  if (resolvido) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3.5 py-3 text-dado text-emerald-700 dark:text-emerald-400">
        <IconeCheck className="size-4" />
        Resolvido nesta revisão.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-meta text-[var(--ink-3)]">
        {/* Só o que falta NESTE item aparece. Repetir os catorze campos a cada
            passo transformaria a revisão em doze formulários completos. */}
        Falta {faltas.map((f) => ROTULO_FALTA[f]).join(", ")}.
      </p>

      {faltas.includes("valor") && (
        <label className="block">
          <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
            Valor por período
          </span>
          <input
            ref={primeiro as React.Ref<HTMLInputElement>}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={aoTeclar}
            inputMode="decimal"
            autoFocus
            placeholder="1.234,56"
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]"
          />
          <span className="mt-1 block min-h-[16px] text-meta text-[var(--ink-3)] tabular-nums">
            {mensal
              ? `${formatarMoeda(numero, item.moeda)} ${ROTULOS_PERIODICIDADE[item.periodicidade].toLowerCase()} = ${formatarBRL(mensal)}/mês`
              : `Cobrança ${ROTULOS_PERIODICIDADE[item.periodicidade].toLowerCase()}`}
          </span>
        </label>
      )}

      {faltas.includes("cambio") && (
        <label className="block">
          <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
            Cotação — quanto vale 1 {item.moeda === "USD" ? "dólar" : item.moeda}
          </span>
          <input
            ref={faltas[0] === "cambio" ? (primeiro as React.Ref<HTMLInputElement>) : undefined}
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
            onKeyDown={aoTeclar}
            inputMode="decimal"
            autoFocus={!faltas.includes("valor")}
            placeholder="5,4321"
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-base tabular-nums outline-none focus:border-[var(--accent)]"
          />
          <span className="mt-1 block min-h-[16px] text-meta text-[var(--ink-3)] tabular-nums">
            {mensal
              ? `${formatarMoeda(item.valorPeriodo, item.moeda)} ${ROTULOS_PERIODICIDADE[
                  item.periodicidade
                ].toLowerCase()} = ${formatarBRL(mensal)}/mês`
              : `Sem a cotação, este custo fica fora de todos os totais.`}
          </span>
        </label>
      )}

      {faltas.includes("data") && (
        <div>
          <label className="block">
            <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
              Renova ou vence em
            </span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              autoFocus={faltas[0] === "data"}
              className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-base tabular-nums outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="button"
            onClick={() => void semPrazo()}
            disabled={salvando}
            className="mt-1.5 text-meta text-[var(--ink-3)] underline-offset-2 hover:text-[var(--accent-texto)] hover:underline disabled:opacity-50"
          >
            Este contrato não tem prazo determinado
          </button>
        </div>
      )}

      {faltas.includes("categoria") && (
        <label className="block">
          <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">Categoria</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            onKeyDown={aoTeclar}
            autoFocus={faltas[0] === "categoria"}
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]"
          >
            <option value="">Escolha…</option>
            {categorias.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => void salvarTudo()}
          disabled={salvando || !temAlgoParaSalvar}
          className={classesDeBotao("primario")}
        >
          {salvando ? "Salvando…" : "Salvar e ir ao próximo"}
        </button>
        <button
          type="button"
          onClick={aoResolver}
          className="text-dado text-[var(--ink-3)] hover:underline"
        >
          Pular
        </button>
        <Link
          href={`/custos/${item.id}`}
          className="ml-auto text-meta text-[var(--ink-3)] no-underline hover:underline"
        >
          Abrir o cadastro completo
        </Link>
      </div>
    </div>
  );
}

const ROTULO_FALTA: Record<Falta, string> = {
  valor: "o valor",
  cambio: "a cotação",
  data: "a data de renovação",
  categoria: "a categoria",
};
