import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { formatarCambio, formatarMoeda } from "@/lib/dinheiro";
import { urlDaLista } from "@/lib/filtros";
import { ConverterPendentes, NovaCotacao } from "./formularios";

export const dynamic = "force-dynamic";

const ESTRANGEIRAS = ["USD", "EUR"] as const;

export default async function Cambio() {
  await exigirAdmin();

  const [cotacoes, emAberto, convertidos] = await Promise.all([
    prisma.cotacaoMoeda.findMany({
      orderBy: [{ data: "desc" }, { moeda: "asc" }],
      take: 40,
      select: {
        id: true,
        moeda: true,
        taxa: true,
        data: true,
        fonte: true,
        registradoPor: { select: { colaborador: { select: { nome: true } } } },
      },
    }),
    // Custos que existem, têm valor, e não são contados por ninguém.
    prisma.itemCusto.groupBy({
      by: ["moeda"],
      where: { moeda: { not: "BRL" }, cambio: null, excluidoEm: null, valorPeriodo: { not: null } },
      _count: { _all: true },
    }),
    prisma.itemCusto.groupBy({
      by: ["moeda"],
      where: { moeda: { not: "BRL" }, cambio: { not: null }, excluidoEm: null },
      _count: { _all: true },
    }),
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  const maisRecente = new Map<string, (typeof cotacoes)[number]>();
  for (const c of cotacoes) if (!maisRecente.has(c.moeda)) maisRecente.set(c.moeda, c);

  const pendentes = new Map(emAberto.map((g) => [g.moeda, g._count._all]));
  const jaConvertidos = new Map(convertidos.map((g) => [g.moeda, g._count._all]));
  const totalPendente = [...pendentes.values()].reduce((s, n) => s + n, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-[12px] font-semibold tracking-[0.14em] text-[var(--ink-3)] uppercase">
        Administração
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">Câmbio</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        Custos em dólar e euro entram nos totais convertidos em real. A cotação registrada aqui é a{" "}
        <strong>sugestão</strong> que aparece no cadastro — cada custo guarda a taxa com que foi
        convertido, e é essa taxa que vale, para sempre.
      </p>

      {totalPendente > 0 && (
        <section className="mt-6 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
          <h2 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--accent)] uppercase">
            {totalPendente} {totalPendente === 1 ? "custo está" : "custos estão"} fora dos totais
          </h2>
          <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
            {totalPendente === 1 ? "Ele tem" : "Eles têm"} valor cadastrado e nenhuma cotação. Até
            que a taxa seja informada,{" "}
            {totalPendente === 1 ? "ele não é somado" : "não são somados"} em lugar nenhum.
          </p>
          <ul className="mt-3 space-y-3">
            {ESTRANGEIRAS.filter((m) => (pendentes.get(m) ?? 0) > 0).map((moeda) => {
              const cotacao = maisRecente.get(moeda);
              const n = pendentes.get(moeda) ?? 0;
              return (
                <li key={moeda}>
                  <Link
                    href={urlDaLista({ natureza: "tudo", situacao: "pendencia", falta: "cambio" })}
                    className="text-[13.5px] font-medium text-[var(--accent)] no-underline hover:underline"
                  >
                    Ver {n} em {moeda}
                  </Link>
                  {cotacao ? (
                    <ConverterPendentes
                      moeda={moeda}
                      quantidade={n}
                      taxa={formatarCambio(cotacao.taxa)}
                    />
                  ) : (
                    <p className="mt-1 text-[12.5px] text-[var(--ink-3)]">
                      Registre uma cotação de {moeda} abaixo para poder converter em lote.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <NovaCotacao hoje={hoje} />
      </div>

      <section className="mt-8">
        <h2 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
          Situação por moeda
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ESTRANGEIRAS.map((moeda) => {
            const cotacao = maisRecente.get(moeda);
            return (
              <div
                key={moeda}
                className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-4"
              >
                <p className="text-[13px] font-semibold">
                  {moeda} — {formatarMoeda(1, moeda)}
                </p>
                <p className="mt-1 text-[20px] font-bold tabular-nums">
                  {cotacao ? `R$ ${formatarCambio(cotacao.taxa)}` : "sem cotação"}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--ink-3)]">
                  {cotacao
                    ? `${cotacao.data.toLocaleDateString("pt-BR", { timeZone: "UTC" })}${cotacao.fonte ? ` · ${cotacao.fonte}` : ""}`
                    : "Nenhuma registrada"}
                </p>
                <p className="mt-2 text-[12.5px] text-[var(--ink-2)]">
                  {jaConvertidos.get(moeda) ?? 0} convertidos · {pendentes.get(moeda) ?? 0} sem
                  cotação
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
          Cotações registradas
        </h2>
        {cotacoes.length === 0 ? (
          <p className="mt-3 text-[13.5px] text-[var(--ink-3)]">
            Nenhuma ainda. Enquanto não houver, quem cadastrar um custo em dólar precisa digitar a
            taxa à mão — o que funciona, e produz treze dólares diferentes em treze setores.
          </p>
        ) : (
          <table className="mt-3 w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--rule)] text-left text-[12px] tracking-[0.08em] text-[var(--ink-3)] uppercase">
                <th className="py-2 font-medium">Data</th>
                <th className="py-2 font-medium">Moeda</th>
                <th className="py-2 text-right font-medium">Taxa</th>
                <th className="py-2 font-medium">Fonte</th>
                <th className="py-2 font-medium">Registrada por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {cotacoes.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 tabular-nums">
                    {c.data.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </td>
                  <td className="py-2">{c.moeda}</td>
                  <td className="py-2 text-right tabular-nums">{formatarCambio(c.taxa)}</td>
                  <td className="py-2 text-[var(--ink-3)]">{c.fonte ?? "—"}</td>
                  <td className="py-2 text-[var(--ink-3)]">
                    {c.registradoPor?.colaborador.nome ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
