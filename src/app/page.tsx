import { prisma } from "@/lib/db";
import { completudePorSetor, custoTotal, renovacoesEmAberto } from "@/lib/metricas";
import { formatarBRL } from "@/lib/dinheiro";

export const dynamic = "force-dynamic";

function competenciaAtual() {
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
}

export default async function Painel() {
  const competencia = competenciaAtual();

  const [setores, categorias, capacidades, fornecedores, contratos, itens] = await Promise.all([
    prisma.setor.count({ where: { ativo: true } }),
    prisma.categoria.count(),
    prisma.capacidade.count(),
    prisma.fornecedor.count(),
    prisma.contrato.count(),
    prisma.itemCusto.count(),
  ]);

  const [recorrente, completude, renovacoes] = await Promise.all([
    custoTotal({ naturezas: ["RECORRENTE"], de: competencia, ate: competencia }),
    completudePorSetor(competencia),
    renovacoesEmAberto(90),
  ]);

  const reportaram = completude.filter((c) => c.reportouCompetencia).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        FMP · Inteligência de custos
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-bold tracking-tight">
        Painel <em className="text-[var(--accent)]">corporativo</em>
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-2)]">
        Competência {String(competencia.mes).padStart(2, "0")}/{competencia.ano}. Custo recorrente,
        exibido isoladamente: a plataforma nunca soma naturezas diferentes sem que isso seja pedido.
      </p>

      <section className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
        <Indicador rotulo="Custo recorrente na competência" valor={formatarBRL(recorrente)} />
        <Indicador
          rotulo="Setores que reportaram"
          valor={`${reportaram} de ${setores}`}
          alerta={reportaram < setores}
        />
        <Indicador rotulo="Renovações em 90 dias" valor={String(renovacoes.length)} />
      </section>

      {reportaram < setores && (
        <p className="mt-4 rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-2)]">
          <strong>{setores - reportaram} setores ainda não reportaram esta competência.</strong> O
          total acima é parcial e não representa o custo da FMP. Nenhuma visão consolidada desta
          plataforma é exibida sem este aviso.
        </p>
      )}

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        Completude por setor
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-[var(--rule)] text-[11px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
              <th className="px-4 py-3 text-left font-semibold">Setor</th>
              <th className="px-4 py-3 text-right font-semibold">Itens ativos</th>
              <th className="px-4 py-3 text-right font-semibold">Sem valor</th>
              <th className="px-4 py-3 text-right font-semibold">Sem rateio</th>
              <th className="px-4 py-3 text-left font-semibold">Reportou</th>
            </tr>
          </thead>
          <tbody>
            {completude.map((c) => (
              <tr key={c.setorId} className="border-b border-[var(--rule)] last:border-0">
                <td className="px-4 py-2.5 font-medium">{c.setorNome}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.itensAtivos}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.itensSemValor}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.itensSemRateio}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      c.reportouCompetencia
                        ? "rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                        : "rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]"
                    }
                  >
                    {c.reportouCompetencia ? "Sim" : "Pendente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        Estado do cadastro
      </h2>
      <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
        <Indicador rotulo="Setores" valor={String(setores)} />
        <Indicador rotulo="Categorias" valor={String(categorias)} />
        <Indicador rotulo="Capacidades funcionais" valor={String(capacidades)} />
        <Indicador rotulo="Fornecedores" valor={String(fornecedores)} />
        <Indicador rotulo="Contratos" valor={String(contratos)} />
        <Indicador rotulo="Itens de custo" valor={String(itens)} />
      </dl>

      <p className="mt-10 text-xs text-[var(--ink-3)]">
        Esqueleto da Entrega 1. CAPEX e pessoal estão declarados no modelo (enum{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">Natureza</code>) e ainda sem
        entidades próprias — a decisão de construir ou integrar continua em aberto.
      </p>
    </main>
  );
}

function Indicador({
  rotulo,
  valor,
  alerta,
}: {
  rotulo: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] px-5 py-4">
      <dd
        className={`text-2xl font-semibold tabular-nums tracking-tight ${
          alerta ? "text-[var(--accent)]" : ""
        }`}
      >
        {valor}
      </dd>
      <dt className="mt-1.5 text-xs leading-snug text-[var(--ink-3)]">{rotulo}</dt>
    </div>
  );
}
