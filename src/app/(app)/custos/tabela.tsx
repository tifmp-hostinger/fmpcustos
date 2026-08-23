"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  alterarSituacao,
  definirDataFim,
  duplicarItem,
  excluirItem,
  marcarSemPrazo,
  restaurarItem,
  reverterCampo,
} from "./acoes-rapidas";
import { useAviso } from "@/components/avisos";
import { MenuDeLinha, type ItemMenu } from "@/components/menu";
import { formatarBRL } from "@/lib/dinheiro";
import { ROTULOS_PERIODICIDADE, ROTULOS_STATUS, STATUS_ITEM } from "@/lib/opcoes";
import {
  IconeCopiar,
  IconeSeta,
  IconeEditar,
  IconeEncerrar,
  IconeHistorico,
  IconeLixeira,
  IconeRateio,
  IconeRestaurar,
} from "@/components/icones";
import type { Resultado } from "@/lib/acoes";
import type { StatusItem } from "@/generated/prisma/enums";

/**
 * A LISTA DE CUSTOS
 *
 * Duas decisões estruturam esta tela.
 *
 * A primeira: **as duas tarefas mais frequentes não vão para um menu**. Mudar a
 * situação e preencher a data de renovação eram, respectivamente, cinco cliques
 * e uma travessia de formulário inteiro — e são exatamente o que se faz dezenas
 * de vezes num fechamento. Viraram edição na própria célula. Pagar dois cliques
 * de menu por noventa por cento do trabalho real seria pagar caro.
 *
 * A segunda: **valor nunca se edita na lista**. Alterar valor exige contexto —
 * a nota, a competência, a conferência contra quantidade × unitário. Isso mora
 * no formulário, onde o equivalente mensal recalcula ao vivo. A lista mostra e
 * leva até lá.
 *
 * O resto vive no menu de três pontos, que fica sempre renderizado (nunca só no
 * hover) e responde também ao clique com o botão direito na linha — o gesto que
 * a pessoa já traz da planilha.
 */

export type LinhaCusto = {
  id: string;
  descricao: string;
  fornecedor: string | null;
  categoria: string | null;
  periodicidade: string;
  valorPeriodo: string | null;
  valorMensal: string | null;
  status: StatusItem;
  dataFim: string | null;
  semPrazo: boolean;
  setores: Array<{ nome: string; percentual: string }>;
  temLancamentos: boolean;
  /** Regras de permissão resolvidas no servidor: a tela não recalcula nem adivinha. */
  podeEditar: boolean;
  podeRatear: boolean;
  motivoBloqueio: string | null;
  naLixeira: boolean;
};

export function TabelaDeCustos({
  itens,
  mostrarSetor,
  podeLancar,
  destacar,
}: {
  itens: LinhaCusto[];
  mostrarSetor: boolean;
  podeLancar: boolean;
  /** Item recém-alterado noutra tela: chega pela URL e pisca ao carregar. */
  destacar?: string;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [, transicao] = useTransition();

  // Estado otimista: a célula muda antes da resposta do servidor. Se a action
  // recusar, o valor volta — e um aviso explica. Rollback silencioso é pior que
  // erro visível, porque a pessoa acredita que salvou.
  const [otimista, setOtimista] = useState<Record<string, Partial<LinhaCusto>>>({});
  const [gravando, setGravando] = useState<Set<string>>(new Set());
  const [aceso, setAceso] = useState<string | undefined>(destacar);

  // Ajuste de estado durante a renderização — o padrão do React para "derivar
  // de uma prop que mudou". Num efeito, a linha destacada pela URL só acenderia
  // um quadro depois, exatamente quando a pessoa já está olhando para ela.
  const [destaqueVindoDaUrl, setDestaqueVindoDaUrl] = useState(destacar);
  if (destaqueVindoDaUrl !== destacar) {
    setDestaqueVindoDaUrl(destacar);
    setAceso(destacar);
  }

  const linhas = useMemo(
    () => itens.map((i) => ({ ...i, ...(otimista[i.id] ?? {}) })),
    [itens, otimista],
  );

  // O destaque some depois da animação; mantê-lo faria a linha reacender a
  // cada re-render da lista, o que vira ruído em vez de sinal.
  useEffect(() => {
    if (!aceso) return;
    const prazo = window.setTimeout(() => setAceso(undefined), 2200);
    return () => window.clearTimeout(prazo);
  }, [aceso]);

  const limparOtimista = useCallback((id: string) => {
    setOtimista((o) => {
      const proximo = { ...o };
      delete proximo[id];
      return proximo;
    });
  }, []);

  /**
   * O Desfazer de verdade: chama a ação inversa no servidor e devolve ao aviso
   * o que aconteceu. Um botão que não sabe o que reverter é enfeite; este sabe,
   * porque a action de ida devolveu junto o estado anterior.
   */
  const desfazer = useCallback(
    async (pedido: NonNullable<Extract<Resultado, { ok: true }>["desfazer"]>) => {
      const dados = new FormData();
      dados.set("id", pedido.id);

      const r =
        pedido.acao === "restaurarCusto"
          ? await restaurarItem(dados)
          : await (async () => {
              dados.set("antes", JSON.stringify(pedido.antes ?? {}));
              return reverterCampo(dados);
            })();

      limparOtimista(pedido.id);
      if (r.ok) setAceso(pedido.id);
      transicao(() => router.refresh());
      return r.ok ? { ok: true, mensagem: r.mensagem } : { ok: false, erro: r.erro };
    },
    [limparOtimista, router, transicao],
  );

  const executar = useCallback(
    async (
      id: string,
      acao: (dados: FormData) => Promise<Resultado>,
      dados: FormData,
      previsao?: Partial<LinhaCusto>,
    ) => {
      if (previsao) setOtimista((o) => ({ ...o, [id]: { ...o[id], ...previsao } }));
      setGravando((g) => new Set(g).add(id));

      const resultado = await acao(dados);

      setGravando((g) => {
        const proximo = new Set(g);
        proximo.delete(id);
        return proximo;
      });

      if (!resultado.ok) {
        // Devolve a célula ao valor real e diz o porquê, na mesma respiração.
        // Rollback silencioso é pior que erro visível: a pessoa acredita que
        // salvou e só descobre no fechamento.
        limparOtimista(id);
        avisar({ mensagem: resultado.erro, tom: "erro" });
        return;
      }

      if (resultado.mensagem) {
        avisar({
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
          // Exclusão ganha mais tempo de leitura que uma troca de situação.
          duracao: resultado.desfazer?.acao === "restaurarCusto" ? 10_000 : 8_000,
          aoDesfazer: resultado.desfazer ? () => desfazer(resultado.desfazer!) : undefined,
        });
      }
      if (resultado.destaqueId) setAceso(resultado.destaqueId);
      if (resultado.irPara) router.push(resultado.irPara as never);

      // A verdade continua sendo o servidor: o refresh troca o valor otimista
      // pelo gravado. Sem isso, dois palpites seguidos divergiriam do banco.
      transicao(() => router.refresh());
      limparOtimista(id);
    },
    [avisar, desfazer, limparOtimista, router, transicao],
  );

  if (linhas.length === 0) return null;

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
      <table className="w-full min-w-[860px] text-sm">
        <caption className="sr-only">
          Custos cadastrados. Use o menu de cada linha para editar, duplicar, dividir entre setores
          ou encerrar.
        </caption>
        <thead>
          <tr className="border-b border-[var(--rule)] text-[11px] tracking-[0.1em] text-[var(--ink-3)] uppercase">
            <th className="px-4 py-3 text-left font-semibold">Custo</th>
            {mostrarSetor && <th className="px-4 py-3 text-left font-semibold">Setor</th>}
            <th className="px-4 py-3 text-right font-semibold">Cobrança</th>
            <th className="px-4 py-3 text-right font-semibold">Por mês</th>
            <th className="px-4 py-3 text-left font-semibold">Renova em</th>
            <th className="px-4 py-3 text-left font-semibold">Situação</th>
            <th className="w-11 px-2 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((item) => (
            <Linha
              key={item.id}
              item={item}
              mostrarSetor={mostrarSetor}
              podeLancar={podeLancar}
              gravando={gravando.has(item.id)}
              aceso={aceso === item.id}
              executar={executar}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Linha({
  item,
  mostrarSetor,
  podeLancar,
  gravando,
  aceso,
  executar,
}: {
  item: LinhaCusto;
  mostrarSetor: boolean;
  podeLancar: boolean;
  gravando: boolean;
  aceso: boolean;
  executar: (
    id: string,
    acao: (dados: FormData) => Promise<Resultado>,
    dados: FormData,
    previsao?: Partial<LinhaCusto>,
  ) => Promise<void>;
}) {
  const abrirMenu = useRef<(() => void) | null>(null);
  const registrarAbertura = useCallback((abrir: (() => void) | null) => {
    abrirMenu.current = abrir;
  }, []);

  const bloqueado = !podeLancar || !item.podeEditar;
  const motivo = !podeLancar
    ? "Seu perfil permite consultar, não alterar."
    : (item.motivoBloqueio ?? undefined);

  const acoes: ItemMenu[] = item.naLixeira
    ? [
        {
          rotulo: "Restaurar",
          icone: <IconeRestaurar className="size-4" />,
          aoEscolher: () => {
            const d = new FormData();
            d.set("id", item.id);
            executar(item.id, restaurarItem, d);
          },
          desabilitado: bloqueado,
          motivo,
        },
      ]
    : [
        {
          rotulo: "Editar",
          icone: <IconeEditar className="size-4" />,
          href: `/custos/${item.id}`,
        },
        {
          rotulo: "Duplicar",
          icone: <IconeCopiar className="size-4" />,
          aoEscolher: () => {
            const d = new FormData();
            d.set("id", item.id);
            executar(item.id, duplicarItem, d);
          },
          desabilitado: bloqueado,
          motivo,
        },
        {
          rotulo: "Dividir entre setores",
          icone: <IconeRateio className="size-4" />,
          href: `/custos/${item.id}/rateio`,
          desabilitado: !item.podeRatear,
          motivo: item.podeRatear
            ? undefined
            : "Rateio de custo compartilhado é feito pela Controladoria.",
        },
        {
          rotulo: "Ver histórico",
          icone: <IconeHistorico className="size-4" />,
          href: `/custos/${item.id}#historico`,
        },
        {
          separadorAntes: true,
          // O nome muda com o que a ação realmente faz. Chamar de "excluir" o
          // que apenas encerra — ou oferecer "excluir" para um item com
          // histórico contábil, só para recusar depois do clique — é prometer
          // o que a tela já sabe que não vai cumprir.
          rotulo: item.temLancamentos ? "Encerrar custo" : "Excluir",
          icone: item.temLancamentos ? (
            <IconeEncerrar className="size-4" />
          ) : (
            <IconeLixeira className="size-4" />
          ),
          perigoso: true,
          desabilitado: bloqueado,
          motivo,
          aoEscolher: () => {
            const d = new FormData();
            d.set("id", item.id);
            if (item.temLancamentos) {
              d.set("status", "CANCELADO");
              executar(item.id, alterarSituacao, d, { status: "CANCELADO" });
            } else {
              executar(item.id, excluirItem, d, { naLixeira: true });
            }
          },
        },
      ];

  return (
    <tr
      // `group/linha` acende o menu quando o ponteiro entra OU quando o foco
      // chega por teclado — as duas coisas, nunca só a primeira.
      className={`group/linha border-b border-[var(--rule)] transition-colors last:border-0 hover:bg-[var(--ground)] focus-within:bg-[var(--ground)] ${
        item.naLixeira ? "opacity-55" : ""
      } ${aceso ? "motion-safe:animate-[destacar_2s_ease-out]" : ""}`}
      aria-busy={gravando || undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        abrirMenu.current?.();
      }}
    >
      <td className="px-4 py-3">
        <Link
          href={`/custos/${item.id}`}
          className="font-medium no-underline hover:text-[var(--accent)]"
        >
          {item.descricao}
        </Link>
        <span className="block text-[11px] text-[var(--ink-3)]">
          {item.fornecedor ?? "sem fornecedor"}
          {item.categoria ? ` · ${item.categoria}` : ""}
        </span>
      </td>

      {mostrarSetor && (
        <td className="px-4 py-3 text-[var(--ink-2)]">
          <Setores setores={item.setores} />
        </td>
      )}

      <td className="px-4 py-3 text-right tabular-nums">
        {item.valorPeriodo ? formatarBRL(item.valorPeriodo) : "—"}
        <span className="block text-[11px] text-[var(--ink-3)]">
          {ROTULOS_PERIODICIDADE[item.periodicidade]}
        </span>
      </td>

      <td className="px-4 py-3 text-right font-medium tabular-nums">
        {item.valorMensal ? formatarBRL(item.valorMensal) : "—"}
      </td>

      <td className="px-4 py-2">
        <CelulaData item={item} bloqueado={bloqueado} motivo={motivo} executar={executar} />
      </td>

      <td className="px-4 py-2">
        <CelulaSituacao item={item} bloqueado={bloqueado} motivo={motivo} executar={executar} />
      </td>

      <td className="px-2 py-3 text-right">
        <MenuDeLinha
          rotulo={`Ações de ${item.descricao}`}
          itens={acoes}
          registrarAbertura={registrarAbertura}
        />
      </td>
    </tr>
  );
}

/** Barra 100% empilhada: reconhecer 60/40 de relance vale mais que ler dois números. */
function Setores({ setores }: { setores: Array<{ nome: string; percentual: string }> }) {
  if (setores.length === 0) {
    return <span className="text-[var(--ink-3)]">Não rateado</span>;
  }
  if (setores.length === 1) return <>{setores[0].nome}</>;

  const titulo = setores
    .map((s) => `${s.nome} ${Number(s.percentual).toFixed(2).replace(".", ",")}%`)
    .join(" · ");

  return (
    <span title={titulo}>
      <span className="flex h-1.5 w-full max-w-[130px] overflow-hidden rounded-full bg-[var(--rule)]">
        {setores.map((s, i) => (
          <span
            key={s.nome}
            aria-hidden
            style={{ width: `${Number(s.percentual)}%` }}
            className={i % 2 === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink-3)]"}
          />
        ))}
      </span>
      <span className="mt-1 block text-[11px] text-[var(--ink-3)]">
        {setores.length} setores · {setores[0].nome} {Number(setores[0].percentual).toFixed(0)}%
      </span>
    </span>
  );
}

/**
 * Data de renovação editável na célula.
 *
 * Doze datas em doze digitações: Enter grava e o foco pula para a próxima linha
 * que ainda não tem data, Esc cancela. É o que transforma "12 itens sem data de
 * término" de diagnóstico em fila de trabalho.
 */
function CelulaData({
  item,
  bloqueado,
  motivo,
  executar,
}: {
  item: LinhaCusto;
  bloqueado: boolean;
  motivo?: string;
  executar: (
    id: string,
    acao: (dados: FormData) => Promise<Resultado>,
    dados: FormData,
    previsao?: Partial<LinhaCusto>,
  ) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  function gravar(valor: string) {
    setEditando(false);
    if (valor === (item.dataFim ?? "")) return;
    const dados = new FormData();
    dados.set("id", item.id);
    dados.set("dataFim", valor);
    executar(item.id, definirDataFim, dados, { dataFim: valor || null });
  }

  if (editando) {
    return (
      <input
        ref={campo}
        type="date"
        autoFocus
        defaultValue={item.dataFim ?? ""}
        aria-label={`Data de renovação de ${item.descricao}`}
        onBlur={(e) => gravar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            gravar(e.currentTarget.value);
            // O foco vai para a próxima linha sem data: é a fila de pendências
            // resolvida de cima para baixo, sem tirar as mãos do teclado.
            const proxima = document.querySelector<HTMLElement>("[data-sem-data='true']");
            requestAnimationFrame(() => proxima?.focus());
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditando(false);
          }
        }}
        className="w-[150px] rounded-lg border border-[var(--accent)] bg-[var(--surface)] px-2 py-1 text-[13px] tabular-nums outline-none"
      />
    );
  }

  if (item.dataFim) {
    return (
      <BotaoDeCelula bloqueado={bloqueado} motivo={motivo} aoAtivar={() => setEditando(true)}>
        <span className="tabular-nums">
          {new Date(`${item.dataFim}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
        </span>
      </BotaoDeCelula>
    );
  }

  if (item.semPrazo) {
    return (
      <BotaoDeCelula bloqueado={bloqueado} motivo={motivo} aoAtivar={() => setEditando(true)}>
        <span className="text-[var(--ink-3)]">sem prazo</span>
      </BotaoDeCelula>
    );
  }

  return (
    <BotaoDeCelula
      bloqueado={bloqueado}
      motivo={motivo}
      pendente
      atributos={{ "data-sem-data": "true" }}
      aoAtivar={() => setEditando(true)}
    >
      informar
    </BotaoDeCelula>
  );
}

/** Situação editável na célula: o selo colorido é o próprio gatilho. */
function CelulaSituacao({
  item,
  bloqueado,
  motivo,
  executar,
}: {
  item: LinhaCusto;
  bloqueado: boolean;
  motivo?: string;
  executar: (
    id: string,
    acao: (dados: FormData) => Promise<Resultado>,
    dados: FormData,
    previsao?: Partial<LinhaCusto>,
  ) => Promise<void>;
}) {
  const opcoes: ItemMenu[] = STATUS_ITEM.map((s) => ({
    rotulo: s.rotulo,
    aoEscolher: () => {
      const dados = new FormData();
      dados.set("id", item.id);
      dados.set("status", s.valor);
      executar(item.id, alterarSituacao, dados, { status: s.valor as StatusItem });
    },
  }));

  if (!item.dataFim && !item.semPrazo) {
    opcoes.push({
      separadorAntes: true,
      rotulo: "Marcar como sem prazo determinado",
      aoEscolher: () => {
        const dados = new FormData();
        dados.set("id", item.id);
        executar(item.id, marcarSemPrazo, dados, { semPrazo: true, dataFim: null });
      },
    });
  }

  if (bloqueado) {
    return <Selo status={item.status} title={motivo} />;
  }

  // O selo É o gatilho. Colocar um menu de três pontos ao lado dele criaria
  // dois alvos para a mesma ação — e a linha já tem um menu de três pontos na
  // ponta direita, com outro conteúdo. Dois desenhos iguais, duas coisas
  // diferentes: é assim que se ensina a pessoa a não confiar na tela.
  return (
    <MenuDeLinha
      rotulo={`Situação de ${item.descricao}: ${ROTULOS_STATUS[item.status]}. Alterar`}
      itens={opcoes}
      conteudoGatilho={
        <>
          <Selo status={item.status} />
          <IconeSeta aria-hidden className="size-3 rotate-90 text-[var(--ink-3)]" />
        </>
      }
      classeGatilho="flex items-center gap-1 rounded-full py-0.5 pr-1 transition-colors hover:bg-[var(--rule)]/50"
    />
  );
}

function BotaoDeCelula({
  children,
  aoAtivar,
  bloqueado,
  motivo,
  pendente,
  atributos,
}: {
  children: React.ReactNode;
  aoAtivar: () => void;
  bloqueado: boolean;
  motivo?: string;
  pendente?: boolean;
  atributos?: Record<string, string>;
}) {
  if (bloqueado) {
    return (
      <span title={motivo} className="px-1 text-[var(--ink-2)]">
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={aoAtivar}
      {...atributos}
      className={`rounded-md border border-dashed px-1.5 py-1 text-left text-[13px] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] ${
        pendente
          ? "border-[var(--ink-3)]/50 text-[var(--ink-3)]"
          : "border-transparent text-[var(--ink-2)]"
      }`}
    >
      {children}
    </button>
  );
}

function Selo({ status, title }: { status: StatusItem; title?: string }) {
  const estilo =
    status === "ATIVO"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
      : status === "CANCELADO" || status === "SUBSTITUIDO"
        ? "bg-[var(--ink-3)]/15 text-[var(--ink-3)]"
        : "bg-[var(--accent)]/12 text-[var(--accent)]";
  return (
    // O rótulo textual anda sempre junto da cor: relatório de fundação é
    // impresso em preto e branco, e daltonismo existe.
    <span
      title={title}
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${estilo}`}
    >
      {ROTULOS_STATUS[status]}
    </span>
  );
}
