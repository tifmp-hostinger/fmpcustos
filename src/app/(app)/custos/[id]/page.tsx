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

export default async function EditarCusto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirSessao();

  const item = await prisma.itemCusto.findFirst({
    where: { id, ...escopoDeItens(usuario) },
    include: { fornecedor: true, rateios: { where: { vigenciaFim: null }, take: 1 } },
  });
  if (!item) notFound();

  const [categorias, setores] = await Promise.all([listarCategorias(), listarSetores()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav aria-label="Você está em" className="text-[12px] text-[var(--ink-3)]">
        <Link href="/custos" className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]">Custos</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">Editar</span>
      </nav>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">{item.descricao}</h1>
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
