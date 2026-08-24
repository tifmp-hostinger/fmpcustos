"use client";

import { useEffect, useState, useTransition } from "react";
import {
  alterarSetorEmLote,
  alterarSituacaoEmLote,
  exportarSelecao,
  marcarSemPrazoEmLote,
  reverterLote,
  somarSelecao,
} from "./acoes-lote";
import { useAviso } from "@/components/avisos";
import { DialogoDeConfirmacao } from "@/components/dialogo";
import { STATUS_ITEM } from "@/lib/opcoes";
import { IconeFechar } from "@/components/icones";
import type { Resultado } from "@/lib/acoes";

/**
 * A barra que aparece quando há custos selecionados.
 *
 * Ela responde a uma pergunta antes de qualquer ação: **quanto dinheiro está
 * selecionado?** "14 custos" não diz nada; "14 custos · R$ 187.320,00/mês" faz
 * a pessoa parar e reler quando o número está errado. E a soma vem do
 * servidor, não do que a tela tem em memória — uma confirmação sobre catorze
 * contratos precisa dizer um número que veio do banco.
 *
 * A fricção é proporcional ao risco, nunca uniforme:
 *  - até 4 itens, a ação acontece e o aviso oferece Desfazer;
 *  - de 5 em diante, confirmação com a contagem e a soma;
 *  - de 20 em diante, a confirmação passa a ser digitada — escrever "37"
 *    exige ler o 37.
 *
 * Modal em toda ação seria pior que nenhum: quem vê confirmação sempre clica
 * "Sim" por reflexo, e aí ela deixa de proteger justamente quando importa.
 */

const LIMITE_CONFIRMACAO = 5;
const LIMITE_DIGITAR = 20;

type Pendente =
  | { tipo: "situacao"; valor: string; rotulo: string }
  | { tipo: "setor"; valor: string; rotulo: string }
  | { tipo: "semPrazo"; valor: ""; rotulo: string };

export function BarraDeSelecao({
  ids,
  setores,
  podeTransferir,
  aoLimpar,
  aoConcluir,
}: {
  ids: string[];
  setores: Array<{ valor: string; rotulo: string }>;
  podeTransferir: boolean;
  aoLimpar: () => void;
  aoConcluir: () => void;
}) {
  const avisar = useAviso();
  const [, transicao] = useTransition();
  const [resumo, setResumo] = useState<{
    quantidade: number;
    mensal: string;
    descricoes: string[];
  }>({ quantidade: 0, mensal: "—", descricoes: [] });
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [aplicando, setAplicando] = useState(false);

  // A soma é buscada quando a seleção muda. `cancelado` evita que a resposta
  // de uma seleção antiga sobrescreva a de uma nova — com cliques rápidos, a
  // barra mostraria o total de uma seleção que não existe mais.
  useEffect(() => {
    if (ids.length === 0) return;
    let cancelado = false;
    somarSelecao(ids).then((r) => {
      if (!cancelado) setResumo(r);
    });
    return () => {
      cancelado = true;
    };
  }, [ids]);

  if (ids.length === 0) return null;

  async function aplicar(acao: Pendente) {
    setAplicando(true);
    const dados = new FormData();
    dados.set("ids", ids.join(","));

    let r: Resultado;
    if (acao.tipo === "situacao") {
      dados.set("status", acao.valor);
      r = await alterarSituacaoEmLote(dados);
    } else if (acao.tipo === "setor") {
      dados.set("setorId", acao.valor);
      r = await alterarSetorEmLote(dados);
    } else {
      r = await marcarSemPrazoEmLote(dados);
    }

    setAplicando(false);
    setPendente(null);

    if (!r.ok) {
      avisar({ mensagem: r.erro, tom: "erro" });
      return;
    }

    // O estado anterior é capturado aqui fora: dentro do closure o
    // estreitamento do tipo se perde, e um `!` esconderia o caso em que a ação
    // não devolveu nada para desfazer.
    const paraDesfazer = r.desfazer?.acao === "reverterLote" ? r.desfazer.itens : null;

    avisar({
      mensagem: r.mensagem ?? "Pronto.",
      detalhe: r.detalhe,
      duracao: r.duracao ?? 10_000,
      aoDesfazer: paraDesfazer
        ? async () => {
            const volta = new FormData();
            volta.set("itens", JSON.stringify(paraDesfazer));
            const resposta = await reverterLote(volta);
            transicao(() => aoConcluir());
            return resposta.ok
              ? { ok: true, mensagem: resposta.mensagem }
              : { ok: false, erro: resposta.erro };
          }
        : undefined,
    });
    aoConcluir();
  }

  function pedir(acao: Pendente) {
    // Poucos itens não passam por modal: o Desfazer do aviso já é a saída, e
    // confirmar tudo ensina a confirmar sem ler.
    if (ids.length < LIMITE_CONFIRMACAO) void aplicar(acao);
    else setPendente(acao);
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-5">
        <div
          // Barra de ferramentas de verdade: agrupa comandos que valem para a
          // seleção, e o leitor de tela anuncia isso em vez de ler seis
          // controles soltos no fim da página.
          role="toolbar"
          aria-label="Ações para os custos selecionados"
          data-barra="selecao"
          className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[var(--rule)] bg-[var(--ink)] px-4 py-3 text-[var(--ground)] shadow-xl shadow-black/20 motion-safe:animate-[surgir_150ms_ease-out]"
        >
          <p className="text-[13.5px] whitespace-nowrap">
            <strong className="tabular-nums">{ids.length}</strong>{" "}
            {ids.length === 1 ? "custo selecionado" : "custos selecionados"}
            {/* O dinheiro é o que faz a pessoa reler a seleção antes de agir. */}
            <span className="ml-2 opacity-70 tabular-nums">{resumo.mensal}/mês</span>
          </p>

          <span aria-hidden className="h-5 w-px bg-[var(--ground)]/20" />

          <SeletorDeAcao
            rotulo="Situação"
            opcoes={STATUS_ITEM}
            desabilitado={aplicando}
            aoEscolher={(valor, rotulo) => pedir({ tipo: "situacao", valor, rotulo })}
          />

          {podeTransferir && (
            <SeletorDeAcao
              rotulo="Mover para setor"
              opcoes={setores}
              desabilitado={aplicando}
              aoEscolher={(valor, rotulo) => pedir({ tipo: "setor", valor, rotulo })}
            />
          )}

          <button
            type="button"
            disabled={aplicando}
            onClick={() => pedir({ tipo: "semPrazo", valor: "", rotulo: "sem prazo determinado" })}
            className="rounded-lg border border-[var(--ground)]/25 px-2.5 py-1.5 text-[12.5px] whitespace-nowrap hover:bg-[var(--ground)]/10 disabled:opacity-50"
          >
            Sem prazo determinado
          </button>

          <button
            type="button"
            onClick={() => void baixarCsv(ids)}
            className="rounded-lg border border-[var(--ground)]/25 px-2.5 py-1.5 text-[12.5px] whitespace-nowrap hover:bg-[var(--ground)]/10"
          >
            Exportar
          </button>

          <button
            type="button"
            onClick={aoLimpar}
            aria-label="Limpar seleção"
            title="Limpar seleção (Esc)"
            className="-mr-1 rounded-lg p-1.5 opacity-70 hover:opacity-100"
          >
            <IconeFechar className="size-4" />
          </button>
        </div>
      </div>

      <DialogoDeConfirmacao
        aberto={pendente !== null}
        titulo={
          pendente?.tipo === "setor"
            ? `Mover ${ids.length} custos para ${pendente.rotulo}?`
            : pendente?.tipo === "semPrazo"
              ? `Marcar ${ids.length} custos como sem prazo?`
              : `Mudar ${ids.length} custos para “${pendente?.rotulo}”?`
        }
        rotuloConfirmar={aplicando ? "Aplicando…" : "Confirmar"}
        exigeDigitar={ids.length >= LIMITE_DIGITAR ? String(ids.length) : undefined}
        perigoso={pendente?.tipo === "situacao" && ehEncerramento(pendente.valor)}
        aoFechar={() => setPendente(null)}
        aoConfirmar={() => pendente && void aplicar(pendente)}
      >
        <p>
          Somam <strong className="tabular-nums">{resumo.mensal}/mês</strong> em itens correntes.
        </p>
        {resumo.descricoes.length > 0 && (
          <p className="text-[13px] text-[var(--ink-3)]">
            {resumo.descricoes.join(", ")}
            {ids.length > resumo.descricoes.length &&
              ` e mais ${ids.length - resumo.descricoes.length}`}
            .
          </p>
        )}
        <p className="text-[13px] text-[var(--ink-3)]">
          {pendente?.tipo === "setor"
            ? "Custos compartilhados entre setores não são movidos — o rateio deles é alterado um a um."
            : "Dá para desfazer logo depois, pelo aviso que aparece."}
        </p>
      </DialogoDeConfirmacao>
    </>
  );
}

function ehEncerramento(status: string): boolean {
  return status === "CANCELADO" || status === "SUBSTITUIDO";
}

/** Um `<select>` que dispara a ação e volta ao rótulo — nunca guarda estado. */
function SeletorDeAcao({
  rotulo,
  opcoes,
  desabilitado,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
  desabilitado?: boolean;
  aoEscolher: (valor: string, rotulo: string) => void;
}) {
  return (
    <select
      value=""
      disabled={desabilitado}
      aria-label={rotulo}
      onChange={(e) => {
        const escolhido = opcoes.find((o) => o.valor === e.target.value);
        if (escolhido) aoEscolher(escolhido.valor, escolhido.rotulo);
        // Volta ao rótulo: o seletor é um botão com opções, não um campo que
        // guarda escolha. Deixá-lo marcado sugeriria que o lote "está" naquele
        // valor, quando o que houve foi uma ação já concluída.
        e.target.value = "";
      }}
      className="rounded-lg border border-[var(--ground)]/25 bg-transparent px-2 py-1.5 text-[12.5px] text-[var(--ground)] outline-none disabled:opacity-50 [&>option]:text-[var(--ink)]"
    >
      <option value="">{rotulo}…</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}

/**
 * Exporta a seleção como CSV que o Excel brasileiro abre sem perguntar nada.
 *
 * Ponto e vírgula como separador e BOM no início: sem os dois, o Excel em
 * português joga a linha inteira na primeira coluna e estraga os acentos. As
 * colunas são as mesmas que a colagem lê — o arquivo volta para dentro do
 * sistema sem tradução nenhuma.
 *
 * As linhas vêm do servidor, não do que a barra tem em mãos: ela guarda só as
 * cinco primeiras descrições para caber na confirmação, e exportar cinco de
 * catorze em silêncio faria alguém conferir a planilha errada por um mês.
 */
async function baixarCsv(ids: string[]) {
  const linhas = await exportarSelecao(ids);
  if (linhas.length <= 1) return;

  const conteudo = linhas
    .map((linha) => linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  const arquivo = new Blob(["\ufeff" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = `custos-fmp-${linhas.length - 1}-itens.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
