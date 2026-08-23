import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { escopoDeItens, listarSetores } from "@/lib/consultas";
import { formatarBRL } from "@/lib/dinheiro";
import { FormularioRateio } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaRateio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirSessao();

  const item = await prisma.itemCusto.findFirst({
    where: { id, ...escopoDeItens(usuario) },
    select: {
      id: true,
      descricao: true,
      valorMensalNormalizado: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { setorId: true, percentual: true, setor: { select: { nome: true } } },
      },
    },
  });
  if (!item) notFound();

  const global = vePorInteiro(usuario.papel);
  const dono =
    global ||
    (podeLancar(usuario.papel) &&
      item.rateios.length === 1 &&
      item.rateios[0].setorId === usuario.setorId &&
      Number(item.rateios[0].percentual) === 100);
  if (!dono) redirect(`/custos/${id}`);

  const setores = await listarSetores();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <nav aria-label="Você está em" className="text-[12px] text-[var(--ink-3)]">
        <Link href="/custos" className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]">
          Custos
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/custos/${id}`}
          className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]"
        >
          {item.descricao}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">Rateio</span>
      </nav>

      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">
        Dividir entre <em className="text-[var(--accent)]">setores</em>
      </h1>
      <p className="mt-2 text-[14px] text-[var(--ink-2)]">
        {item.descricao}
        {item.valorMensalNormalizado && (
          <> · {formatarBRL(item.valorMensalNormalizado.toString())}/mês</>
        )}
        . Defina qual fração do custo cabe a cada setor — a soma precisa dar 100%.
      </p>

      <FormularioRateio
        itemId={item.id}
        setores={setores}
        aplicaDireto={global}
        inicial={item.rateios.map((r) => ({
          setorId: r.setorId,
          pct: Number(r.percentual).toString().replace(".", ","),
        }))}
      />
    </main>
  );
}
