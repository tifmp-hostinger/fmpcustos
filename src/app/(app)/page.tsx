import Link from "next/link";
import {
  custoMensalCorrente,
  custoPorCategoria,
  custoPorFornecedor,
  custoPorSetor,
  pendenciasDeDado,
  renovacoesProximas,
  setoresQueLancaram,
} from "@/lib/metricas";
import { formatarBRL } from "@/lib/dinheiro";
import { exigirSessao, setoresVisiveis, vePorInteiro } from "@/lib/sessao";
import { BarrasRanqueadas, Indicador } from "@/components/graficos";

export const dynamic = "force-dynamic";

const RECORRENTE = ["RECORRENTE"] as const;

export default async function Painel() {
  const usuario = await exigirSessao();
  const escopo = { setorIds: setoresVisiveis(usuario) };
  const global = vePorInteiro(usuario.papel);

  const [mensal, porSetor, porCategoria, porFornecedor, renovacoes, pendencias, setores] =
    await Promise.all([
      custoMensalCorrente(escopo, [...RECORRENTE]),
      custoPorSetor(escopo, [...RECORRENTE]),
      custoPorCategoria(escopo, [...RECORRENTE]),
      custoPorFornecedor(escopo, [...RECORRENTE]),
      renovacoesProximas(escopo, 90),
      pendenciasDeDado(escopo),
      global ? setoresQueLancaram() : Promise.resolve([]),
    ]);

  const lancaram = setores.filter((s) => s.lancou).length;
  const anual = mensal.mul(12);
  const maiorFornecedor = porFornecedor[0];
  const naoRateado = porSetor.find((s) => s.chave === "nao-rateado");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        {global ? "Painel corporativo" : `Painel · ${usuario.setorNome ?? "seu setor"}`}
      </h1>
      <p className="mt-1.5 max-w-2xl text-[var(--ink-2)]">
        Custo <strong>recorrente</strong>, exibido isoladamente. A plataforma nunca
        soma naturezas diferentes sem que isso seja pedido.
      </p>

      <section className="mt-8 grid gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Custo recorrente por mês"
          valor={formatarBRL(mensal)}
          nota="Equivalente mensal de todas as periodicidades"
        />
        <Indicador
          rotulo="Projeção para 12 meses"
          valor={formatarBRL(anual)}
          nota="Ao ritmo atual, sem reajuste"
        />
        <Indicador
          rotulo="Renovações em 90 dias"
          valor={String(renovacoes.length)}
          alerta={renovacoes.length > 0}
          nota={renovacoes.length > 0 ? "Exige decisão antes do vencimento" : "Nada vencendo"}
        />
        {global ? (
          <Indicador
            rotulo="Setores que já lançaram"
            valor={`${lancaram} de ${setores.length}`}
            alerta={lancaram < setores.length}
            nota="O total só é corporativo quando todos reportam"
          />
        ) : (
          <Indicador
            rotulo="Maior fornecedor"
            valor={maiorFornecedor ? `${maiorFornecedor.participacao.toFixed(0)}%` : "—"}
            nota={maiorFornecedor?.rotulo ?? "Nada cadastrado"}
          />
        )}
      </section>

      {global && lancaram < setores.length && (
        <p className="mt-4 rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-2)]">
          <strong>
            {setores.length - lancaram}{" "}
            {setores.length - lancaram === 1 ? "setor ainda não lançou" : "setores ainda não lançaram"}{" "}
            nenhum custo:
          </strong>{" "}
          {setores
            .filter((s) => !s.lancou)
            .map((s) => s.nome)
            .join(", ")}
          . O total acima é parcial e não representa o custo da FMP.
        </p>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {global && (
          <BarrasRanqueadas
            titulo="Custo por setor"
            descricao="Quanto cada área consome por mês, já com o rateio aplicado."
            fatias={porSetor}
            limite={13}
            vazio="Nenhum custo rateado ainda."
          />
        )}
        <BarrasRanqueadas
          titulo="Concentração por fornecedor"
          descricao="Onde há dependência — e, portanto, onde a negociação vale mais."
          fatias={porFornecedor}
        />
        <BarrasRanqueadas
          titulo="Custo por categoria"
          descricao="Em que tipo de coisa o dinheiro está indo."
          fatias={porCategoria}
        />

        <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
            Renovações nos próximos 90 dias
          </h3>
          <p className="mt-1 text-[12px] text-[var(--ink-3)]">
            Renovar por inércia é a forma mais cara de decidir.
          </p>
          {renovacoes.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-3)]">
              Nada vencendo. Contratos sem data de término não aparecem aqui —
              {pendencias.semVigencia > 0 && ` hoje são ${pendencias.semVigencia}.`}
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {renovacoes.map((r) => (
                <li key={r.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <Link href={`/custos/${r.id}`} className="truncate no-underline hover:underline">
                    {r.descricao}
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {r.fornecedor?.nome ?? "sem fornecedor"}
                      {r.rateios[0] ? ` · ${r.rateios[0].setor.nome}` : ""}
                    </span>
                  </Link>
                  <span className="shrink-0 text-right tabular-nums">
                    {r.dataFim?.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {r.valorMensalNormalizado
                        ? `${formatarBRL(r.valorMensalNormalizado.toString())}/mês`
                        : "sem valor"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
          O que falta para o número estar completo
        </h3>
        <p className="mt-1 text-[12px] text-[var(--ink-3)]">
          Um total que parece completo e não está é pior que nenhum total.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <Pendencia
            quantidade={pendencias.semValor}
            rotulo="itens sem valor informado"
            detalhe="Não entram em nenhuma soma."
          />
          <Pendencia
            quantidade={pendencias.semVigencia}
            rotulo="itens sem data de término"
            detalhe="Não geram alerta de renovação."
          />
          <Pendencia
            quantidade={pendencias.semCategoria}
            rotulo="itens sem categoria"
            detalhe="Somem do agrupamento por tipo."
          />
        </ul>
        {naoRateado && (
          <p className="mt-4 border-t border-[var(--rule)] pt-3 text-[13px] text-[var(--ink-2)]">
            <strong>{formatarBRL(naoRateado.valor)}</strong> por mês está sem setor
            responsável, e aparece como “Não rateado”.
          </p>
        )}
      </section>
    </main>
  );
}

function Pendencia({
  quantidade,
  rotulo,
  detalhe,
}: {
  quantidade: number;
  rotulo: string;
  detalhe: string;
}) {
  const limpo = quantidade === 0;
  return (
    <li>
      <span
        className={`text-xl font-semibold tabular-nums ${limpo ? "" : "text-[var(--accent)]"}`}
      >
        {quantidade}
      </span>
      <span className="mt-0.5 block text-[13px] text-[var(--ink-2)]">{rotulo}</span>
      <span className="mt-0.5 block text-[11px] text-[var(--ink-3)]">
        {limpo ? "Nada pendente." : detalhe}
      </span>
    </li>
  );
}
