"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ignorarAlerta, reabrirAlerta, reconhecerAlerta, reverterAlerta } from "./acoes";
import { useAviso } from "@/components/avisos";
import { IconeCheck } from "@/components/icones";
import type { Resultado } from "@/lib/acoes";

export type LinhaAlerta = {
  id: string;
  tipo: string;
  rotuloTipo: string;
  titulo: string;
  descricao: string | null;
  severidade: number;
  status: string;
  itemCustoId: string | null;
  setores: string[];
  criadoEm: string;
};

/**
 * A LISTA DE ALERTAS
 *
 * Ordenada por urgência e não por data, porque um contrato que vence em seis
 * dias importa mais que um cadastro incompleto de anteontem. Dentro da mesma
 * urgência, o mais antigo primeiro — o que está parado há mais tempo é o que
 * ninguém pegou.
 *
 * Cada linha é um link para o custo. Um alerta que só informa obriga a procurar
 * o item de novo dentro do sistema, e é nesse trecho que a intenção morre.
 *
 * O que foi reconhecido continua na tela, apagado, em vez de sumir: a diferença
 * entre "resolvi" e "vi" precisa ser visível para quem abre a lista depois — e
 * quem reconheceu por engano precisa achar de volta o que reconheceu.
 */
export function ListaDeAlertas({ alertas }: { alertas: LinhaAlerta[] }) {
  const avisar = useAviso();
  const router = useRouter();
  const [, transicao] = useTransition();
  const [otimista, setOtimista] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const linhas = alertas.map((a) => ({ ...a, status: otimista[a.id] ?? a.status }));

  async function executar(
    id: string,
    acao: (d: FormData) => Promise<Resultado>,
    novoStatus: string,
  ) {
    setOtimista((o) => ({ ...o, [id]: novoStatus }));
    setOcupado(id);

    const dados = new FormData();
    dados.set("id", id);
    const r = await acao(dados);
    setOcupado(null);

    if (!r.ok) {
      // Devolve a linha ao que era: rollback silencioso é pior que erro
      // visível, porque a pessoa acredita que a ação valeu.
      setOtimista((o) => {
        const proximo = { ...o };
        delete proximo[id];
        return proximo;
      });
      avisar({ mensagem: r.erro, tom: "erro" });
      return;
    }

    const paraDesfazer = r.desfazer?.acao === "reverterCampo" ? r.desfazer.antes : null;
    avisar({
      mensagem: r.mensagem ?? "Pronto.",
      aoDesfazer: paraDesfazer
        ? async () => {
            const volta = new FormData();
            volta.set("id", id);
            volta.set("antes", JSON.stringify(paraDesfazer));
            const resposta = await reverterAlerta(volta);
            setOtimista((o) => {
              const proximo = { ...o };
              delete proximo[id];
              return proximo;
            });
            transicao(() => router.refresh());
            return resposta.ok
              ? { ok: true, mensagem: resposta.mensagem }
              : { ok: false, erro: resposta.erro };
          }
        : undefined,
    });
    transicao(() => router.refresh());
  }

  if (linhas.length === 0) {
    return (
      <p className="mt-8 flex items-center gap-2.5 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--ink-2)]">
        <IconeCheck className="size-5 text-emerald-600" />
        Nada pendente. Nenhuma renovação a decidir, nenhum cadastro incompleto.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-2">
      {linhas.map((a) => {
        const visto = a.status === "RECONHECIDO";
        const fora = a.status === "IGNORADO";
        return (
          <li
            key={a.id}
            data-alerta={a.tipo}
            data-status={a.status}
            className={`rounded-fmp-md border p-4 transition-opacity ${
              fora || visto ? "opacity-55" : ""
            } ${
              a.severidade >= 4 && !fora && !visto
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                : "border-[var(--rule)] bg-[var(--surface)]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Etiqueta severidade={a.severidade} rotulo={a.rotuloTipo} />
                  {a.setores.length > 0 && (
                    <span className="text-micro text-[var(--ink-3)]">{a.setores.join(" · ")}</span>
                  )}
                  {visto && (
                    <span className="text-micro font-medium text-[var(--ink-3)]">
                      · visto, em andamento
                    </span>
                  )}
                  {fora && (
                    <span className="text-micro font-medium text-[var(--ink-3)]">· ignorado</span>
                  )}
                </p>
                {a.itemCustoId ? (
                  <Link
                    href={`/custos/${a.itemCustoId}`}
                    className="mt-1 block text-base font-semibold text-[var(--ink)] no-underline hover:text-[var(--accent-texto)]"
                  >
                    {a.titulo}
                  </Link>
                ) : (
                  <p className="mt-1 text-base font-semibold">{a.titulo}</p>
                )}
                {a.descricao && (
                  <p className="mt-1 text-dado leading-relaxed text-[var(--ink-2)]">
                    {a.descricao}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {fora || visto ? (
                  <Botao
                    rotulo="Reabrir"
                    ocupado={ocupado === a.id}
                    onClick={() => void executar(a.id, reabrirAlerta, "ABERTO")}
                  />
                ) : (
                  <>
                    <Botao
                      rotulo="Marcar como visto"
                      ocupado={ocupado === a.id}
                      onClick={() => void executar(a.id, reconhecerAlerta, "RECONHECIDO")}
                    />
                    <Botao
                      rotulo="Não se aplica"
                      discreto
                      ocupado={ocupado === a.id}
                      onClick={() => void executar(a.id, ignorarAlerta, "IGNORADO")}
                    />
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Botao({
  rotulo,
  onClick,
  ocupado,
  discreto,
}: {
  rotulo: string;
  onClick: () => void;
  ocupado: boolean;
  discreto?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ocupado}
      className={`rounded-lg border px-2.5 py-1.5 text-meta font-medium whitespace-nowrap disabled:opacity-50 ${
        discreto
          ? "border-transparent text-[var(--ink-3)] hover:border-[var(--rule)]"
          : "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
      }`}
    >
      {rotulo}
    </button>
  );
}

/**
 * A severidade em palavra, não em número.
 *
 * "Severidade 4" não diz nada a quem abre a tela; "vence em breve" diz. O número
 * existe no banco para ordenar, e a ordenação é o que ele faz de útil.
 */
function Etiqueta({ severidade, rotulo }: { severidade: number; rotulo: string }) {
  const urgente = severidade >= 4;
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-micro font-semibold tracking-[0.06em] uppercase ${
        urgente
          ? "bg-[var(--accent)]/15 text-[var(--accent-texto)]"
          : "bg-[var(--ink)]/8 text-[var(--ink-2)]"
      }`}
    >
      {rotulo}
    </span>
  );
}
