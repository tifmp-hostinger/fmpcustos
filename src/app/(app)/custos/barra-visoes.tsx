"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apagarVisao, recriarVisao, salvarVisao } from "./visoes";
import { useAviso } from "@/components/avisos";
import { MenuDeLinha } from "@/components/menu";
import { IconeLixeira, IconeMais } from "@/components/icones";
import { enderecoDoRecorte } from "@/lib/filtros";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

export type VisaoNaTela = {
  id: string;
  nome: string;
  recorte: string;
  descricao: string;
  institucional: boolean;
  minha: boolean;
  podeApagar: boolean;
};

/**
 * A BARRA DE VISÕES SALVAS
 *
 * Fica no topo, acima das abas de natureza, porque é o atalho mais curto que a
 * tela oferece: um clique para o recorte que a pessoa usa toda semana, sem
 * refazer quatro filtros.
 *
 * "Salvar esta visão" só aparece quando o recorte atual NÃO está salvo. Um botão
 * permanente convida a salvar a mesma coisa várias vezes, e trinta atalhos
 * parecidos deixam de ser atalho — viram uma segunda lista para procurar dentro.
 *
 * A visão carrega, junto do nome, a frase do que ela filtra. "Contratos de TI" é
 * um nome, não uma definição: seis meses depois ninguém lembra se incluía os
 * cancelados, e um atalho de que se desconfia não é usado.
 */
export function BarraDeVisoes({
  visoes,
  recorteAtual,
  podePublicar,
}: {
  visoes: VisaoNaTela[];
  /** A query string da tela agora, para comparar e para salvar. */
  recorteAtual: string;
  podePublicar: boolean;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [, transicao] = useTransition();
  const [abrindo, setAbrindo] = useState(false);

  const atual = visoes.find((v) => v.recorte === recorteAtual);
  // Um recorte vazio é a tela padrão. Salvá-la como visão é guardar um atalho
  // para o lugar onde a pessoa já está.
  const vaziaOuSalva = recorteAtual === "" || atual !== undefined;

  async function apagar(visao: VisaoNaTela) {
    const dados = new FormData();
    dados.set("id", visao.id);
    const r = await apagarVisao(dados);

    if (!r.ok) {
      avisar({ mensagem: r.erro, tom: "erro" });
      return;
    }
    const paraDesfazer = r.desfazer?.acao === "reverterCampo" ? r.desfazer.antes : null;
    avisar({
      mensagem: r.mensagem ?? "Apagada.",
      aoDesfazer: paraDesfazer
        ? async () => {
            const volta = new FormData();
            volta.set("antes", JSON.stringify(paraDesfazer));
            const resposta: Resultado = await recriarVisao(volta);
            transicao(() => router.refresh());
            return resposta.ok
              ? { ok: true, mensagem: resposta.mensagem }
              : { ok: false, erro: resposta.erro };
          }
        : undefined,
    });
    transicao(() => router.refresh());
  }

  if (visoes.length === 0 && vaziaOuSalva) return null;

  return (
    <>
      <div data-barra="visoes" className="faixa-rolante -mx-6 mt-5 items-center gap-1.5 px-6">
        {visoes.length > 0 && <span className="sobrancelha mr-1.5">Visões</span>}

        {visoes.map((v) => {
          const ativa = v.recorte === recorteAtual;
          return (
            <span
              key={v.id}
              data-visao={v.nome}
              data-ativa={ativa ? "sim" : "nao"}
              // Mesma pílula das outras da tela, num peso abaixo: a visão ativa
              // é vermelha de fio e lavagem, não de preenchimento, porque ela
              // já se anuncia pelo recorte inteiro que a tela está mostrando.
              className={`flex items-center rounded-full border-[1.5px] text-meta transition-all duration-200 ${
                ativa
                  ? "border-[var(--accent)] bg-[var(--accent-wash)] text-[var(--accent)]"
                  : "border-[var(--rule-2)] text-[var(--ink-2)] hover:border-[var(--accent)]"
              }`}
            >
              <Link
                href={enderecoDoRecorte(v.recorte) as never}
                // O título carrega a definição: o nome é um apelido, e um apelido
                // de que se desconfia não é clicado.
                title={`${v.descricao}${v.institucional ? " · da instituição" : ""}`}
                className={`py-1.5 pl-3 no-underline ${v.podeApagar ? "pr-1.5" : "pr-3"} ${
                  ativa ? "font-semibold text-[var(--accent)]" : "text-[var(--ink-2)]"
                }`}
              >
                {v.nome}
                {v.institucional && (
                  <span
                    aria-label="da instituição"
                    title="Visão da instituição"
                    className="ml-1.5 opacity-60"
                  >
                    ★
                  </span>
                )}
              </Link>
              {v.podeApagar && (
                <MenuDeLinha
                  rotulo={`Ações da visão ${v.nome}`}
                  itens={[
                    {
                      rotulo: "Apagar visão",
                      icone: <IconeLixeira className="size-4" />,
                      perigoso: true,
                      aoEscolher: () => void apagar(v),
                    },
                  ]}
                />
              )}
            </span>
          );
        })}

        {/* Só quando há o que salvar. Um botão permanente convida a salvar a
            mesma coisa três vezes com nomes diferentes. */}
        {!vaziaOuSalva && (
          <button
            type="button"
            data-acao="salvar-visao"
            onClick={() => setAbrindo(true)}
            className="flex items-center gap-1 rounded-full border-[1.5px] border-dashed border-[var(--rule-2)] px-3 py-1.5 text-meta text-[var(--ink-3)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <IconeMais className="size-3.5" />
            Salvar esta visão
          </button>
        )}
      </div>

      {abrindo && (
        <FormaDeSalvar
          recorte={recorteAtual}
          podePublicar={podePublicar}
          aoFechar={() => setAbrindo(false)}
          aoSalvar={() => {
            setAbrindo(false);
            transicao(() => router.refresh());
          }}
        />
      )}
    </>
  );
}

function FormaDeSalvar({
  recorte,
  podePublicar,
  aoFechar,
  aoSalvar,
}: {
  recorte: string;
  podePublicar: boolean;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const avisar = useAviso();
  const [nome, setNome] = useState("");
  const [institucional, setInstitucional] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    const dados = new FormData();
    dados.set("nome", nome.trim());
    dados.set("recorte", recorte);
    dados.set("institucional", String(institucional));
    const r = await salvarVisao(dados);
    setEnviando(false);

    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    avisar({ mensagem: r.mensagem ?? "Salva.", detalhe: r.detalhe, duracao: 12_000 });
    aoSalvar();
  }

  return (
    <div className="mt-3 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-4">
      <label className="block">
        <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
          Nome desta visão
        </span>
        <input
          value={nome}
          autoFocus
          onChange={(e) => {
            setNome(e.target.value);
            setErro(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nome.trim()) {
              e.preventDefault();
              void enviar();
            }
            if (e.key === "Escape") aoFechar();
          }}
          placeholder="Ex.: Softwares de TI que renovam este ano"
          maxLength={60}
          className="w-full max-w-md rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]"
        />
      </label>
      {erro && (
        <p role="alert" className="mt-1.5 text-meta text-[var(--accent)]">
          {erro}
        </p>
      )}

      {podePublicar && (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            name="institucional"
            checked={institucional}
            onChange={(e) => setInstitucional(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--accent)]"
          />
          <span className="text-dado">
            <span className="font-medium">Visão da instituição</span>
            <span className="mt-0.5 block text-meta text-[var(--ink-3)]">
              Aparece para todo mundo, não só para você. Cada pessoa vê os custos da própria área
              dentro dela — a visão guarda o recorte, nunca o resultado.
            </span>
          </span>
        </label>
      )}

      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          disabled={enviando || nome.trim() === ""}
          onClick={() => void enviar()}
          className={classesDeBotao("primario")}
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={aoFechar} className={classesDeBotao("contorno")}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
