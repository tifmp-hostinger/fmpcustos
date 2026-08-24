import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirSessao, setoresVisiveis, vePorInteiro } from "@/lib/sessao";
import { formatarBRL } from "@/lib/dinheiro";
import {
  custoMensalCorrente,
  custoPorCategoria,
  custoPorFornecedor,
  maioresItens,
  pendenciasDeDado,
  renovacoesProximas,
} from "@/lib/metricas";
import { SEM_CATEGORIA, SEM_FORNECEDOR, urlDaLista } from "@/lib/filtros";
import { BarrasRanqueadas, Indicador } from "@/components/graficos";
import { IconeAlerta, IconeCalendario, IconeSeta } from "@/components/icones";

export const dynamic = "force-dynamic";

const RECORRENTE = ["RECORRENTE"] as const;

/**
 * O panorama de um setor.
 *
 * Existe porque o gestor não tinha referência comparativa nenhuma: ele via a
 * própria lista e o próprio total, e não sabia se aquilo era muito ou pouco,
 * concentrado em quem, nem o que estava prestes a renovar. É o destino do chip
 * de setor na lista e da linha do painel corporativo.
 *
 * Cada número aqui é um link para a lista filtrada que o compõe — a mesma
 * definição de recorte que a lista usa, vinda de `src/lib/filtros.ts`. Se os
 * dois discordassem, a confiança nos dois cairia junto.
 */
export default async function PaginaSetor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirSessao();

  // Quem não vê por inteiro só abre o panorama da própria área. Um gestor
  // consultando o custo do setor vizinho é decisão de governança, não de tela.
  const visiveis = setoresVisiveis(usuario);
  if (visiveis !== null && !visiveis.includes(id)) notFound();

  const setor = await prisma.setor.findUnique({
    where: { id },
    select: { id: true, nome: true, codigo: true, ativo: true },
  });
  if (!setor) notFound();

  const escopo = { setorIds: [id] };
  const [mensal, maiores, renovacoes, pendencias, porCategoria, porFornecedor, totalCorporativo] =
    await Promise.all([
      custoMensalCorrente(escopo, [...RECORRENTE]),
      maioresItens(escopo, [...RECORRENTE], 8),
      renovacoesProximas(escopo, 90),
      pendenciasDeDado(escopo),
      custoPorCategoria(escopo, [...RECORRENTE]),
      custoPorFornecedor(escopo, [...RECORRENTE]),
      vePorInteiro(usuario.papel)
        ? custoMensalCorrente({ setorIds: null }, [...RECORRENTE])
        : Promise.resolve(null),
    ]);

  const totalPendencias = pendencias.semValor + pendencias.semVigencia + pendencias.semCategoria;
  const participacao =
    totalCorporativo && totalCorporativo.greaterThan(0)
      ? mensal.div(totalCorporativo).mul(100)
      : null;

  const daLista = (extra: Parameters<typeof urlDaLista>[0]) => urlDaLista({ setor: id, ...extra });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <nav aria-label="Você está em" className="text-[12px] text-[var(--ink-3)]">
        <Link href="/" className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">{setor.nome}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">{setor.nome}</h1>
          <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
            Custo recorrente, já com o rateio aplicado
            {participacao && (
              <>
                {" "}
                — <strong>{participacao.toFixed(1).replace(".", ",")}%</strong> do total da FMP
              </>
            )}
            .
          </p>
        </div>
        <Link
          href={daLista({ situacao: "ativos" })}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-[14px] font-medium no-underline hover:border-[var(--ink-3)]"
        >
          Ver todos os custos <IconeSeta className="size-4" />
        </Link>
      </div>

      <section className="mt-7 grid gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Custo por mês"
          valor={formatarBRL(mensal)}
          nota="Itens ativos e em análise"
          href={daLista({ situacao: "ativos" })}
        />
        <Indicador
          rotulo="Projeção para 12 meses"
          valor={formatarBRL(mensal.mul(12))}
          nota="Ao ritmo atual, sem reajuste"
        />
        <Indicador
          rotulo="Renovações em 90 dias"
          valor={String(renovacoes.length)}
          alerta={renovacoes.length > 0}
          nota={renovacoes.length > 0 ? "Exigem decisão" : "Nada vencendo"}
          href={daLista({ situacao: "renovacao", ordem: "renovacao", dir: "asc" })}
        />
        <Indicador
          rotulo="Cadastros incompletos"
          valor={String(totalPendencias)}
          alerta={totalPendencias > 0}
          nota={totalPendencias > 0 ? "Deixam o número parcial" : "Nada faltando"}
          href={totalPendencias > 0 ? daLista({ situacao: "pendencia" }) : undefined}
        />
      </section>

      {totalPendencias > 0 && (
        <section className="mt-4 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.11em] text-[var(--accent)] uppercase">
            <IconeAlerta />O que falta para o número estar completo
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[
              { n: pendencias.semValor, rotulo: "sem valor", falta: "valor" },
              { n: pendencias.semVigencia, rotulo: "sem data de renovação", falta: "data" },
              { n: pendencias.semCategoria, rotulo: "sem categoria", falta: "categoria" },
            ]
              .filter((x) => x.n > 0)
              .map((x) => (
                <li key={x.falta}>
                  <Link
                    href={daLista({ situacao: "pendencia", falta: x.falta })}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--surface)] px-3 py-1.5 text-[13px] no-underline hover:bg-[var(--accent)]/10"
                  >
                    <strong className="tabular-nums">{x.n}</strong>
                    <span className="text-[var(--ink-2)]">{x.rotulo}</span>
                    <IconeSeta className="size-3.5 text-[var(--accent)]" />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
          <h2 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
            Maiores custos
          </h2>
          <p className="mt-1 text-[12px] text-[var(--ink-3)]">
            Já pela fatia que cabe a {setor.nome}, não pelo valor cheio do contrato.
          </p>
          {maiores.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-3)]">Nenhum custo cadastrado ainda.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--rule)]">
              {maiores.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/custos/${m.id}`}
                    className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:text-[var(--accent)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{m.descricao}</span>
                      <span className="block text-[11px] text-[var(--ink-3)]">
                        {m.fornecedor?.nome ?? "sem fornecedor"}
                      </span>
                    </span>
                    <span className="shrink-0 text-[14px] tabular-nums">
                      {m.valorMensalDoEscopo.isZero()
                        ? "—"
                        : `${formatarBRL(m.valorMensalDoEscopo)}/mês`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
            <IconeCalendario className="size-4" />
            Renovações nos próximos 90 dias
          </h2>
          <p className="mt-1 text-[12px] text-[var(--ink-3)]">
            Renovar por inércia é a forma mais cara de decidir.
          </p>
          {renovacoes.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-3)]">
              Nada vencendo.{" "}
              {pendencias.semVigencia > 0 && (
                <>
                  Atenção:{" "}
                  <Link
                    href={daLista({ situacao: "pendencia", falta: "data" })}
                    className="text-[var(--accent)]"
                  >
                    {pendencias.semVigencia}{" "}
                    {pendencias.semVigencia === 1 ? "item não tem" : "itens não têm"} data
                  </Link>{" "}
                  e por isso {pendencias.semVigencia === 1 ? "nunca aparece" : "nunca aparecem"}{" "}
                  aqui.
                </>
              )}
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {renovacoes.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/custos/${r.id}`}
                    className="flex items-baseline justify-between gap-3 text-[13px] no-underline hover:text-[var(--accent)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.descricao}</span>
                      <span className="block text-[11px] text-[var(--ink-3)]">
                        {r.fornecedor?.nome ?? "sem fornecedor"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      {r.dataFim?.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      <span className="block text-[11px] text-[var(--ink-3)]">
                        {r.valorMensalNormalizado
                          ? `${formatarBRL(r.valorMensalNormalizado.toString())}/mês`
                          : "sem valor"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <BarrasRanqueadas
          titulo="Por categoria"
          descricao="Em que tipo de coisa o dinheiro da área está indo."
          fatias={porCategoria}
          recorte={(chave) => ({
            situacao: "ativos",
            setor: id,
            categoria: chave === SEM_CATEGORIA ? SEM_CATEGORIA : chave,
          })}
        />
        <BarrasRanqueadas
          titulo="Por fornecedor"
          descricao="Onde a área tem dependência — e onde a negociação vale mais."
          fatias={porFornecedor}
          recorte={(chave) => ({
            situacao: "ativos",
            setor: id,
            fornecedor: chave === SEM_FORNECEDOR ? SEM_FORNECEDOR : chave,
          })}
        />
      </div>

      {/* Reconciliação declarada: os dois números desta página medem coisas
          diferentes e vão divergir do total da lista. Duas telas com duas
          verdades e nenhuma explicação destroem a confiança nas duas. */}
      <p className="mt-5 text-[12px] leading-relaxed text-[var(--ink-3)]">
        Os totais desta página contam <strong>só custos recorrentes</strong>, e cada custo entra
        pela fração rateada a {setor.nome} — um item dividido meio a meio com outra área entra pela
        metade. A lista de custos soma o valor cheio de cada item, incluindo os pontuais, então os
        dois números podem divergir sem que nenhum esteja errado.
      </p>
    </main>
  );
}
