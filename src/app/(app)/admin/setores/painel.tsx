"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  alterarHierarquia,
  alterarResponsaveis,
  alternarAtivo,
  apagarSetor,
  criarSetor,
  renomearSetor,
  reverterSetor,
} from "./acoes";
import { FormaDeCriar, ListaOrganizacao, type LinhaOrganizacao } from "../organizacao";
import { useAviso } from "@/components/avisos";
import { PainelLateral } from "@/components/painel";
import { Selecao } from "@/components/campos";
import { IconeUsuarios } from "@/components/icones";

type Pessoa = { id: string; nome: string };

/**
 * A tela de setores, com o painel de responsáveis por cima.
 *
 * Gestor e responsável pelo dado são campos separados de propósito, e o segundo
 * é o que costuma faltar: o esquema diz que ele é "o papel que determina a data
 * real de go-live". Um setor sem responsável pelo dado é um setor cujo custo vai
 * envelhecer sem que ninguém sinta falta — e é por isso que a coluna mostra
 * quando ele não existe, em vez de deixar o campo vazio passar despercebido.
 */
export function PainelDeSetores({
  linhas,
  colaboradores,
}: {
  linhas: LinhaOrganizacao[];
  colaboradores: Pessoa[];
}) {
  const [responsaveis, setResponsaveis] = useState<LinhaOrganizacao | null>(null);
  const opcoesPai = linhas.filter((l) => l.ativo).map((l) => ({ valor: l.id, rotulo: l.nome }));

  return (
    <>
      <div className="mt-7">
        <FormaDeCriar
          acao={criarSetor}
          rotulos={{
            singular: "setor",
            campoPai: "setorPaiId",
            rotuloPai: "Subordinado a",
            exemplo: "Ex.: Núcleo de Inovação",
          }}
          opcoesPai={opcoesPai}
        />
      </div>

      <ListaOrganizacao
        linhas={linhas}
        acoes={{
          renomear: renomearSetor,
          alterarPai: alterarHierarquia,
          alternarAtivo,
          apagar: apagarSetor,
          reverter: reverterSetor,
        }}
        rotulos={{
          singular: "setor",
          plural: "Setores",
          campoPai: "setorPaiId",
          rotuloPai: "Subordinado a",
        }}
        aoAbrirExtra={(linha) => ({
          rotulo: "Responsáveis",
          icone: <IconeUsuarios className="size-4" />,
          aoEscolher: () => setResponsaveis(linha),
        })}
      />

      <PainelDeResponsaveis
        setor={responsaveis}
        colaboradores={colaboradores}
        aoFechar={() => setResponsaveis(null)}
      />
    </>
  );
}

function PainelDeResponsaveis({
  setor,
  colaboradores,
  aoFechar,
}: {
  setor: LinhaOrganizacao | null;
  colaboradores: Pessoa[];
  aoFechar: () => void;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  const opcoes = colaboradores.map((c) => ({ valor: c.id, rotulo: c.nome }));

  async function salvar(dados: FormData) {
    if (!setor) return;
    setEnviando(true);
    dados.set("id", setor.id);
    const r = await alterarResponsaveis(dados);
    setEnviando(false);

    avisar(
      r.ok
        ? { mensagem: r.mensagem ?? "Salvo.", detalhe: r.detalhe }
        : { mensagem: r.erro, tom: "erro" },
    );
    if (r.ok) {
      aoFechar();
      router.refresh();
    }
  }

  return (
    <PainelLateral
      aberto={setor !== null}
      titulo={setor ? `Responsáveis por ${setor.nome}` : ""}
      aoFechar={aoFechar}
    >
      {setor && (
        <form action={salvar} className="space-y-5">
          <Selecao
            rotulo="Gestor do setor"
            nome="gestorId"
            opcoes={opcoes}
            vazio="Sem gestor definido"
            dica="Quem responde pelas decisões de contratação e cancelamento."
          />
          <Selecao
            rotulo="Responsável pelo dado"
            nome="responsavelDadoId"
            opcoes={opcoes}
            vazio="Sem responsável definido"
            dica="Quem mantém os custos do setor em dia. Pode ser a mesma pessoa."
          />
          <p className="text-[12.5px] leading-relaxed text-[var(--ink-3)]">
            São papéis diferentes de propósito. O gestor decide; o responsável pelo dado é quem faz
            o número existir — e um setor sem ele é um setor cujo custo envelhece sem que ninguém
            sinta falta.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[14px] font-medium text-white disabled:opacity-50"
            >
              {enviando ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-lg border border-[var(--rule)] px-4 py-2 text-[14px] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </PainelLateral>
  );
}
