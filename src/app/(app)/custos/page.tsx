import Link from "next/link";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { escopoDeItens } from "@/lib/consultas";
import { formatarBRL } from "@/lib/dinheiro";
import { ROTULOS_PERIODICIDADE, ROTULOS_STATUS } from "@/lib/opcoes";
import { IconeBusca, IconeMais } from "@/components/icones";
import type { StatusItem } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

/** Filtros rápidos, na ordem em que fazem sentido para quem opera. */
const FILTROS: Array<{ chave: string; rotulo: string; status: StatusItem[] | null }> = [
  { chave: "ativos", rotulo: "Ativos", status: ["ATIVO"] },
  { chave: "analise", rotulo: "Em análise", status: ["EM_ANALISE", "CANCELAMENTO_SOLICITADO"] },
  { chave: "apurar", rotulo: "Valor a apurar", status: ["PENDENTE_APURACAO"] },
  { chave: "encerrados", rotulo: "Encerrados", status: ["CANCELADO", "SUBSTITUIDO"] },
  { chave: "todos", rotulo: "Todos", status: null },
];

export default async function Custos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const { q, f } = await searchParams;
  const usuario = await exigirSessao();
  const filtro = FILTROS.find((x) => x.chave === f) ?? FILTROS[0];
  const busca = (q ?? "").trim();

  const itens = await prisma.itemCusto.findMany({
    where: {
      ...escopoDeItens(usuario),
      ...(filtro.status ? { status: { in: filtro.status } } : {}),
      ...(busca
        ? {
            OR: [
              { descricao: { contains: busca, mode: "insensitive" } },
              { fornecedor: { nome: { contains: busca, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      descricao: true,
      periodicidade: true,
      valorPeriodo: true,
      valorMensalNormalizado: true,
      status: true,
      dataFim: true,
      fornecedor: { select: { nome: true } },
      categoria: { select: { nome: true } },
      rateios: {
        where: { vigenciaFim: null },
        select: { setor: { select: { nome: true } } },
        take: 1,
      },
    },
    orderBy: [{ valorMensalNormalizado: { sort: "desc", nulls: "last" } }, { atualizadoEm: "desc" }],
  });

  const totalMensal = itens.reduce(
    (soma, i) => (i.valorMensalNormalizado ? soma.plus(i.valorMensalNormalizado.toString()) : soma),
    new Decimal(0),
  );
  const global = vePorInteiro(usuario.papel);
  const escopoTexto = global ? "todos os setores" : (usuario.setorNome ?? "sua área");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Custos</h1>
          <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
            {itens.length} {itens.length === 1 ? "item" : "itens"}
            {busca && <> para “{busca}”</>} · {filtro.rotulo.toLowerCase()} · {escopoTexto} ·{" "}
            <strong className="tabular-nums">{formatarBRL(totalMensal)}/mês</strong>
          </p>
        </div>
        {podeLancar(usuario.papel) && (
          <Link
            href="/custos/novo"
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[14px] font-semibold text-white no-underline"
          >
            <IconeMais />
            Cadastrar custo
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
          {FILTROS.map((x) => (
            <Link
              key={x.chave}
              href={{ pathname: "/custos", query: { f: x.chave, ...(busca ? { q: busca } : {}) } }}
              aria-current={x.chave === filtro.chave ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-[13px] no-underline transition-colors ${
                x.chave === filtro.chave
                  ? "bg-[var(--ink)] font-semibold text-[var(--ground)]"
                  : "border border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
              }`}
            >
              {x.rotulo}
            </Link>
          ))}
        </nav>

        <form action="/custos" className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs">
          <input type="hidden" name="f" value={filtro.chave} />
          <IconeBusca className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Buscar por nome ou fornecedor…"
            aria-label="Buscar custos"
            className="w-full rounded-full border border-[var(--rule)] bg-[var(--surface)] py-2 pl-9 pr-4 text-[14px] outline-none focus:border-[var(--accent)]"
          />
        </form>
      </div>

      {itens.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--rule)] px-6 py-14 text-center">
          {busca ? (
            <>
              <p className="font-medium">Nada encontrado para “{busca}”.</p>
              <p className="mt-1.5 text-sm text-[var(--ink-3)]">
                Tente outro termo, ou{" "}
                <Link href={{ pathname: "/custos", query: { f: "todos" } }} className="text-[var(--accent)]">
                  veja todos os itens
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                Nenhum custo {filtro.chave === "ativos" ? "ativo" : `em “${filtro.rotulo.toLowerCase()}”`}{" "}
                por aqui.
              </p>
              <p className="mt-1.5 text-sm text-[var(--ink-3)]">
                {podeLancar(usuario.papel)
                  ? "Cadastre o primeiro: comece pelos contratos e assinaturas pagos todo mês."
                  : "Quando o gestor da sua área lançar os custos, eles aparecem aqui."}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-[var(--rule)] text-[11px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
                <th className="px-4 py-3 text-left font-semibold">Custo</th>
                {global && <th className="px-4 py-3 text-left font-semibold">Setor</th>}
                <th className="px-4 py-3 text-right font-semibold">Cobrança</th>
                <th className="px-4 py-3 text-right font-semibold">Por mês</th>
                <th className="px-4 py-3 text-left font-semibold">Renova em</th>
                <th className="px-4 py-3 text-left font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--rule)] transition-colors last:border-0 hover:bg-[var(--ground)]"
                >
                  <td className="px-4 py-3">
                    <Link href={`/custos/${item.id}`} className="font-medium no-underline hover:text-[var(--accent)]">
                      {item.descricao}
                    </Link>
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {item.fornecedor?.nome ?? "sem fornecedor"}
                      {item.categoria ? ` · ${item.categoria.nome}` : ""}
                    </span>
                  </td>
                  {global && (
                    <td className="px-4 py-3 text-[var(--ink-2)]">
                      {item.rateios[0]?.setor.nome ?? "Não rateado"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.valorPeriodo ? formatarBRL(item.valorPeriodo.toString()) : "—"}
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {ROTULOS_PERIODICIDADE[item.periodicidade]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {item.valorMensalNormalizado
                      ? formatarBRL(item.valorMensalNormalizado.toString())
                      : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--ink-2)]">
                    {item.dataFim ? (
                      item.dataFim.toLocaleDateString("pt-BR", { timeZone: "UTC" })
                    ) : (
                      <span className="text-[var(--ink-3)]">sem data</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Situacao status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Situacao({ status }: { status: StatusItem }) {
  const estilo =
    status === "ATIVO"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
      : status === "CANCELADO" || status === "SUBSTITUIDO"
        ? "bg-[var(--ink-3)]/15 text-[var(--ink-3)]"
        : "bg-[var(--accent)]/12 text-[var(--accent)]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${estilo}`}>
      {ROTULOS_STATUS[status]}
    </span>
  );
}
