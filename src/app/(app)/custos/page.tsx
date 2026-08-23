import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { escopoDeItens } from "@/lib/consultas";
import { formatarBRL } from "@/lib/dinheiro";
import { ROTULOS_PERIODICIDADE, ROTULOS_STATUS } from "@/lib/opcoes";

export const dynamic = "force-dynamic";

export default async function Custos() {
  const usuario = await exigirSessao();

  const itens = await prisma.itemCusto.findMany({
    where: escopoDeItens(usuario),
    select: {
      id: true,
      descricao: true,
      natureza: true,
      periodicidade: true,
      valorPeriodo: true,
      valorMensalNormalizado: true,
      status: true,
      moeda: true,
      fornecedor: { select: { nome: true } },
      categoria: { select: { nome: true } },
      rateios: { select: { setor: { select: { nome: true } } }, take: 1 },
    },
    orderBy: { atualizadoEm: "desc" },
  });

  const escopo = vePorInteiro(usuario.papel)
    ? "todos os setores"
    : (usuario.setorNome ?? "seu setor");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Custos</h1>
          <p className="mt-1.5 text-[var(--ink-2)]">
            {itens.length} {itens.length === 1 ? "lançamento" : "lançamentos"} em {escopo}.
          </p>
        </div>
        {podeLancar(usuario.papel) && (
          <Link
            href="/custos/novo"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[15px] font-medium text-white no-underline"
          >
            Cadastrar custo
          </Link>
        )}
      </div>

      {itens.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-[var(--rule)] px-6 py-12 text-center">
          <p className="font-medium">Nenhum custo cadastrado ainda.</p>
          <p className="mt-1.5 text-sm text-[var(--ink-3)]">
            {podeLancar(usuario.papel)
              ? "Comece pelos contratos e assinaturas que a sua área paga todo mês."
              : "Quando o gestor da sua área lançar os custos, eles aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--rule)] text-[11px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
                <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                <th className="px-4 py-3 text-left font-semibold">Fornecedor</th>
                <th className="px-4 py-3 text-left font-semibold">Setor</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Equivale/mês</th>
                <th className="px-4 py-3 text-left font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-b border-[var(--rule)] last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/custos/${item.id}`} className="font-medium no-underline hover:underline">
                      {item.descricao}
                    </Link>
                    {item.categoria && (
                      <span className="block text-[11px] text-[var(--ink-3)]">
                        {item.categoria.nome}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-2)]">{item.fornecedor?.nome ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-2)]">
                    {item.rateios[0]?.setor.nome ?? "Não rateado"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {item.valorPeriodo ? formatarBRL(item.valorPeriodo.toString()) : "—"}
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {ROTULOS_PERIODICIDADE[item.periodicidade]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {item.valorMensalNormalizado
                      ? formatarBRL(item.valorMensalNormalizado.toString())
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        item.status === "ATIVO"
                          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                          : "bg-[var(--accent)]/12 text-[var(--accent)]"
                      }`}
                    >
                      {ROTULOS_STATUS[item.status]}
                    </span>
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
