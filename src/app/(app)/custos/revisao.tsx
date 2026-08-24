"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { alterarCategoria, alterarValor, definirDataFim, marcarSemPrazo } from "./acoes-rapidas";
import { useAviso } from "@/components/avisos";
import { PainelLateral } from "@/components/painel";
import { formatarBRL, lerValorDigitado, valorMensalNormalizado } from "@/lib/dinheiro";
import { ROTULOS_PERIODICIDADE } from "@/lib/opcoes";
import { IconeCheck } from "@/components/icones";
import type { Periodicidade } from "@/generated/prisma/enums";
import type { LinhaCusto } from "./tabela";

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

type Falta = "valor" | "data" | "categoria";

function faltasDe(item: LinhaCusto): Falta[] {
  const faltas: Falta[] = [];
  if (item.valorPeriodo === null) faltas.push("valor");
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
        className="rounded-xl border border-[var(--accent)]/40 bg-[var(--surface)] px-3.5 py-2 text-[13px] font-medium text-[var(--accent)] hover:bg-[var(--accent)]/8"
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
            <p className="text-[12px] text-[var(--ink-3)]">
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
      <p className="flex items-center gap-2 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
        <IconeCheck className="size-4" />
        {quantidade === 0
          ? "Nada faltando nesta fila."
          : `${quantidade} ${quantidade === 1 ? "cadastro completo" : "cadastros completos"}.`}
      </p>
      <button
        type="button"
        onClick={aoFechar}
        className="rounded-lg bg-[var(--ink)] px-3.5 py-2 text-[13px] font-semibold text-[var(--ground)]"
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
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const primeiro = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const faltas = faltasDe(item);
  const numero = lerValorDigitado(valor);
  const mensal =
    numero === null ? null : valorMensalNormalizado(numero, item.periodicidade as Periodicidade);

  async function salvarTudo() {
    setSalvando(true);
    let algum = false;

    if (faltas.includes("valor") && valor.trim()) {
      const d = new FormData();
      d.set("id", item.id);
      d.set("valorPeriodo", valor);
      algum = (await gravar(alterarValor, d, item.id)) || algum;
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
    (faltas.includes("data") && data !== "") ||
    (faltas.includes("categoria") && categoria !== "");

  if (resolvido) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3.5 py-3 text-[13.5px] text-emerald-700 dark:text-emerald-400">
        <IconeCheck className="size-4" />
        Resolvido nesta revisão.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[12.5px] text-[var(--ink-3)]">
        {/* Só o que falta NESTE item aparece. Repetir os catorze campos a cada
            passo transformaria a revisão em doze formulários completos. */}
        Falta {faltas.map((f) => ROTULO_FALTA[f]).join(", ")}.
      </p>

      {faltas.includes("valor") && (
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
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
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
          />
          <span className="mt-1 block min-h-[16px] text-[12px] text-[var(--ink-3)] tabular-nums">
            {mensal
              ? `${formatarBRL(numero)} ${ROTULOS_PERIODICIDADE[item.periodicidade].toLowerCase()} = ${formatarBRL(mensal)}/mês`
              : `Cobrança ${ROTULOS_PERIODICIDADE[item.periodicidade].toLowerCase()}`}
          </span>
        </label>
      )}

      {faltas.includes("data") && (
        <div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
              Renova ou vence em
            </span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              autoFocus={!faltas.includes("valor")}
              className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] tabular-nums outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="button"
            onClick={() => void semPrazo()}
            disabled={salvando}
            className="mt-1.5 text-[12.5px] text-[var(--ink-3)] underline-offset-2 hover:text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            Este contrato não tem prazo determinado
          </button>
        </div>
      )}

      {faltas.includes("categoria") && (
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
            Categoria
          </span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            onKeyDown={aoTeclar}
            autoFocus={!faltas.includes("valor") && !faltas.includes("data")}
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
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
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar e ir ao próximo"}
        </button>
        <button
          type="button"
          onClick={aoResolver}
          className="text-[13px] text-[var(--ink-3)] hover:underline"
        >
          Pular
        </button>
        <Link
          href={`/custos/${item.id}`}
          className="ml-auto text-[12.5px] text-[var(--ink-3)] no-underline hover:underline"
        >
          Abrir o cadastro completo
        </Link>
      </div>
    </div>
  );
}

const ROTULO_FALTA: Record<Falta, string> = {
  valor: "o valor",
  data: "a data de renovação",
  categoria: "a categoria",
};
