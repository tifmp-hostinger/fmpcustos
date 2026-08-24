"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  alterarPai,
  alternarAtivo,
  apagarCategoria,
  criarCategoria,
  fundirCategorias,
  renomearCategoria,
  reverterCategoria,
} from "./acoes";
import { FormaDeCriar, ListaOrganizacao, type LinhaOrganizacao } from "../organizacao";
import { useAviso } from "@/components/avisos";
import { PainelLateral } from "@/components/painel";
import { IconeRateio } from "@/components/icones";
import { parecidos } from "@/lib/fornecedores";
import { classesDeBotao } from "@/components/botao";

export function PainelDeCategorias({
  linhas,
  orfaos,
}: {
  linhas: LinhaOrganizacao[];
  orfaos: { itens: number; mensal: string };
}) {
  const [fundindo, setFundindo] = useState<LinhaOrganizacao | null>(null);
  const opcoesPai = linhas.filter((l) => l.ativo).map((l) => ({ valor: l.id, rotulo: l.nome }));

  // Duplicata quase-igual, detectada com o mesmo casamento que já protege os
  // fornecedores: "Softwares" ao lado de "Software" parte o gráfico por tipo ao
  // meio sem que nada pareça errado em nenhuma das duas linhas.
  const nomes = linhas.filter((l) => l.ativo).map((l) => l.nome);
  const suspeitas = linhas
    .filter((l) => l.ativo)
    .map((l) => ({
      linha: l,
      parecidas: parecidos(
        l.nome,
        nomes.filter((n) => n !== l.nome),
      ),
    }))
    .filter((s) => s.parecidas.length > 0)
    // Cada par aparece duas vezes (A parece com B, B parece com A); manter só a
    // primeira metade evita a mesma sugestão escrita ao contrário logo abaixo.
    .filter((s, _i, todas) => {
      const primeira = s.parecidas[0].nome;
      const espelho = todas.find((o) => o.linha.nome === primeira);
      return !espelho || s.linha.nome < primeira;
    });

  return (
    <>
      {orfaos.itens > 0 && (
        <p className="mt-6 rounded-fmp-md border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-3 text-dado">
          <strong className="tabular-nums">{orfaos.mensal}/mês</strong> em{" "}
          <Link
            href={{ pathname: "/custos", query: { f: "pendencia", falta: "categoria" } }}
            className="font-medium text-[var(--accent)]"
          >
            {orfaos.itens} {orfaos.itens === 1 ? "custo sem categoria" : "custos sem categoria"}
          </Link>{" "}
          — enquanto isso durar, o gráfico por tipo está incompleto.
        </p>
      )}

      {suspeitas.length > 0 && (
        <div
          role="status"
          className="mt-4 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] px-4 py-3"
        >
          <p className="text-meta font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
            Podem ser a mesma coisa
          </p>
          <ul className="mt-2 space-y-1.5">
            {suspeitas.map((s) => (
              <li key={s.linha.id} className="text-dado">
                <strong>{s.linha.nome}</strong> e {s.parecidas.map((c) => c.nome).join(", ")} —{" "}
                <button
                  type="button"
                  onClick={() => setFundindo(s.linha)}
                  className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  fundir
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-meta text-[var(--ink-3)]">
            Duas categorias quase iguais partem o gráfico por tipo ao meio sem que nenhuma das duas
            pareça errada.
          </p>
        </div>
      )}

      <div className="mt-6">
        <FormaDeCriar
          acao={criarCategoria}
          rotulos={{
            singular: "categoria",
            campoPai: "categoriaPaiId",
            rotuloPai: "Dentro de",
            exemplo: "Ex.: Assinaturas de software",
          }}
          opcoesPai={opcoesPai}
        />
      </div>

      <ListaOrganizacao
        linhas={linhas}
        acoes={{
          renomear: renomearCategoria,
          alterarPai,
          alternarAtivo,
          apagar: apagarCategoria,
          reverter: reverterCategoria,
        }}
        rotulos={{
          singular: "categoria",
          plural: "Categorias",
          campoPai: "categoriaPaiId",
          rotuloPai: "Dentro de",
        }}
        aoAbrirExtra={(linha) => ({
          rotulo: "Fundir em outra",
          icone: <IconeRateio className="size-4" />,
          // Fundir uma categoria vazia não faz nada de útil e a tela precisa
          // dizer isso antes do clique, não depois.
          desabilitado: linha.custos === 0,
          motivo:
            linha.custos === 0 ? "Não tem custo nenhum — apagar ou inativar resolve." : undefined,
          aoEscolher: () => setFundindo(linha),
        })}
      />

      <PainelDeFusao
        origem={fundindo}
        destinos={linhas.filter((l) => l.ativo && l.id !== fundindo?.id)}
        aoFechar={() => setFundindo(null)}
      />
    </>
  );
}

/**
 * A fusão de duas categorias.
 *
 * É a ação que faltava para que "criar categoria pela tela" não fosse um jeito
 * novo de estragar o agrupamento. Sem ela, a saída para "Softwares" e
 * "Software" seria abrir cada custo e reclassificar um a um — e ninguém faz
 * isso, então as duas ficam.
 *
 * O painel diz quantos custos vão se mover e quanto dinheiro isso é ANTES do
 * clique. E diz o que acontece com a categoria absorvida: ela é inativada, não
 * apagada, porque as linhas de auditoria dos custos apontam para ela.
 */
function PainelDeFusao({
  origem,
  destinos,
  aoFechar,
}: {
  origem: LinhaOrganizacao | null;
  destinos: LinhaOrganizacao[];
  aoFechar: () => void;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [destinoId, setDestinoId] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Limpo durante a renderização, não num efeito: um painel que reabre já com a
  // escolha da vez anterior aceita confirmação sem leitura.
  const [ultimaOrigem, setUltimaOrigem] = useState(origem?.id ?? null);
  if (ultimaOrigem !== (origem?.id ?? null)) {
    setUltimaOrigem(origem?.id ?? null);
    setDestinoId("");
  }

  async function fundir() {
    if (!origem || !destinoId) return;
    setEnviando(true);
    const dados = new FormData();
    dados.set("origemId", origem.id);
    dados.set("destinoId", destinoId);
    const r = await fundirCategorias(dados);
    setEnviando(false);

    avisar(
      r.ok
        ? { mensagem: r.mensagem ?? "Pronto.", detalhe: r.detalhe, duracao: 14_000 }
        : { mensagem: r.erro, tom: "erro", duracao: 14_000 },
    );
    if (r.ok) {
      aoFechar();
      router.refresh();
    }
  }

  const destino = destinos.find((d) => d.id === destinoId);

  return (
    <PainelLateral
      aberto={origem !== null}
      titulo={origem ? `Fundir ${origem.nome}` : ""}
      aoFechar={aoFechar}
    >
      {origem && (
        <div className="space-y-5">
          <p className="text-dado text-[var(--ink-2)]">
            {/* O número é o TOTAL, e não só o corrente: é ele que vai se mover.
                Dizer "10" e mover 11 é a mentira pequena que corrói a confiança
                em tudo o mais que a tela afirma. */}
            {origem.custos === 1
              ? "O custo classificado"
              : `Os ${origem.custos} custos classificados`}{" "}
            como <strong>{origem.nome}</strong> {origem.custos === 1 ? "passa" : "passam"} para a
            categoria que você escolher.
            {origem.mensal !== "—" && (
              <>
                {" "}
                {origem.correntes < origem.custos
                  ? `${origem.correntes} deles estão correntes e somam `
                  : "Somam "}
                <span className="tabular-nums">{origem.mensal}/mês</span>; o resto é histórico, e
                vai junto.
              </>
            )}
          </p>

          <label className="block">
            <span className="mb-1.5 block text-dado font-medium text-[var(--ink-2)]">
              Passar para
            </span>
            <select
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]"
            >
              <option value="">Escolha a categoria que fica…</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({d.custos} {d.custos === 1 ? "custo" : "custos"})
                </option>
              ))}
            </select>
          </label>

          {destino && (
            <p className="rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--accent)]/8 px-3.5 py-2.5 text-dado">
              <strong>{destino.nome}</strong> fica com{" "}
              <strong className="tabular-nums">{destino.custos + origem.custos}</strong> custos.{" "}
              <strong>{origem.nome}</strong> é inativada — não apagada, para o histórico de cada
              custo continuar apontando para algo que existe.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={enviando || !destinoId}
              onClick={() => void fundir()}
              className={classesDeBotao("primario")}
            >
              {enviando ? "Fundindo…" : "Fundir"}
            </button>
            <button type="button" onClick={aoFechar} className={classesDeBotao("contorno")}>
              Cancelar
            </button>
          </div>

          <p className="text-meta text-[var(--ink-3)]">
            Isto não tem desfazer de um clique. Cada custo movido ganha uma linha no histórico
            dizendo de onde veio, então dá para refazer à mão — mas é trabalho.
          </p>
        </div>
      )}
    </PainelLateral>
  );
}
