import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { escopoDeItens, listarCategorias, listarSetores } from "@/lib/consultas";
import { FormularioCusto } from "../formulario";
import { excluirCusto } from "../acoes";

export const dynamic = "force-dynamic";

function paraInput(data: Date | null): string | null {
  return data ? data.toISOString().slice(0, 10) : null;
}

export default async function EditarCusto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string | string[] }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const usuario = await exigirSessao();

  const item = await prisma.itemCusto.findFirst({
    where: { id, ...escopoDeItens(usuario) },
    include: {
      fornecedor: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { setorId: true, percentual: true, setor: { select: { nome: true } } },
        orderBy: { percentual: "desc" },
      },
      propostas: {
        where: { status: "PENDENTE" },
        select: {
          id: true,
          justificativa: true,
          criadoPor: { select: { colaborador: { select: { nome: true } } } },
          parcelas: {
            select: { aceite: true, percentual: true, setor: { select: { nome: true } } },
          },
        },
        take: 1,
      },
    },
  });
  if (!item) notFound();

  const global = vePorInteiro(usuario.papel);
  const donoIntegral =
    item.rateios.length === 1 &&
    item.rateios[0].setorId === usuario.setorId &&
    Number(item.rateios[0].percentual) === 100;
  const podeRatear =
    (global || (podeLancar(usuario.papel) && donoIntegral)) && item.propostas.length === 0;
  const proposta = item.propostas[0];

  const [categorias, setores] = await Promise.all([listarCategorias(), listarSetores()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav aria-label="Você está em" className="text-[12px] text-[var(--ink-3)]">
        <Link href="/custos" className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]">Custos</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">Editar</span>
      </nav>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">{item.descricao}</h1>
      {erro === "tem-historico" && (
        <p className="mt-4 rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--accent)]/8 px-4 py-3 text-sm text-[var(--ink)]">
          Este custo tem lançamentos mensais registrados e por isso não pode ser excluído — apagar
          destruiria o histórico. Para encerrá-lo, mude a situação para <strong>Cancelado</strong>.
        </p>
      )}
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        Alterações ficam registradas na auditoria, com autor e data.
      </p>

      <FormularioCusto
        categorias={categorias}
        setores={setores}
        podeEscolherSetor={vePorInteiro(usuario.papel)}
        setorFixo={usuario.setorNome}
        valores={{
          id: item.id,
          descricao: item.descricao,
          fornecedor: item.fornecedor?.nome ?? "",
          categoriaId: item.categoriaId,
          natureza: item.natureza,
          periodicidade: item.periodicidade,
          comportamento: item.comportamento,
          moeda: item.moeda,
          status: item.status,
          valorPeriodo: item.valorPeriodo?.toString() ?? null,
          quantidade: item.quantidade ? Number(item.quantidade) : null,
          valorUnitario: item.valorUnitario?.toString() ?? null,
          dataInicio: paraInput(item.dataInicio),
          dataFim: paraInput(item.dataFim),
          observacoes: item.observacoes,
          setorId: item.rateios[0]?.setorId ?? usuario.setorId,
        }}
      />

      <section className="mt-10 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
            Rateio entre setores
          </h2>
          {podeRatear && (
            <Link
              href={`/custos/${item.id}/rateio`}
              className="text-[13px] font-medium text-[var(--accent)] no-underline hover:underline"
            >
              {item.rateios.length > 1 ? "Alterar rateio" : "Dividir entre setores"}
            </Link>
          )}
        </div>

        <ul className="mt-3 space-y-1.5">
          {item.rateios.map((r) => (
            <li key={r.setorId} className="flex items-baseline justify-between text-[14px]">
              <span>{r.setor.nome}</span>
              <span className="tabular-nums">{Number(r.percentual).toFixed(0)}%</span>
            </li>
          ))}
          {item.rateios.length === 0 && (
            <li className="text-[14px] text-[var(--ink-3)]">Sem setor responsável — não rateado.</li>
          )}
        </ul>

        {proposta && (
          <div className="mt-4 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3.5 text-[13px]">
            <p className="font-semibold text-[var(--accent)]">
              Proposta de rateio aguardando aceite
            </p>
            <p className="mt-1 text-[var(--ink-2)]">
              Proposta por {proposta.criadoPor.colaborador.nome}
              {proposta.justificativa ? ` — “${proposta.justificativa}”` : ""}.
            </p>
            <ul className="mt-2 space-y-1">
              {proposta.parcelas.map((pc, i) => (
                <li key={i} className="flex items-baseline justify-between">
                  <span>{pc.setor.nome}</span>
                  <span className="tabular-nums">
                    {Number(pc.percentual).toFixed(0)}% ·{" "}
                    {pc.aceite === "ACEITO" ? "aceito" : pc.aceite === "REJEITADO" ? "recusado" : "aguardando"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-[var(--ink-3)]">
              O aceite de cada fatia aparece na tela inicial do gestor do setor que a recebe.
            </p>
          </div>
        )}

        {!podeRatear && !proposta && !global && (
          <p className="mt-3 text-[12px] text-[var(--ink-3)]">
            {item.rateios.length > 1
              ? "Custo compartilhado: alterações de rateio são feitas pela Controladoria ou pelo administrador."
              : "Só o gestor da área responsável (ou a Controladoria) pode propor um rateio."}
          </p>
        )}
      </section>

      {podeLancar(usuario.papel) && (
        <form action={excluirCusto} className="mt-10 border-t border-[var(--rule)] pt-6">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="text-sm text-[var(--accent)] underline underline-offset-4"
          >
            Excluir este custo
          </button>
          <p className="mt-1 text-xs text-[var(--ink-3)]">
            A exclusão fica registrada na auditoria, com autor e data.
          </p>
        </form>
      )}
    </main>
  );
}
