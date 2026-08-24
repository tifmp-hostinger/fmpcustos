import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { comEscopo, listarSetores } from "@/lib/consultas";
import { formatarBRL } from "@/lib/dinheiro";
import { fatiasIniciais } from "@/lib/rateio";
import { EditorDeRateio } from "./formulario";
import { PropostaEmAberto } from "./proposta";

export const dynamic = "force-dynamic";

/**
 * Rota de página do rateio.
 *
 * O caminho principal passou a ser o painel lateral aberto direto da lista —
 * dividir um custo entre setores não deveria custar sair de onde se está. Esta
 * página continua existindo porque link direto tem que funcionar: é o endereço
 * que se cola num e-mail para o gestor da outra área, e o destino do "Dividir
 * entre setores" para quem chegou pela página do custo.
 */
export default async function PaginaRateio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirSessao();

  const item = await prisma.itemCusto.findFirst({
    where: comEscopo(usuario, [{ id }], "fora", true),
    select: {
      id: true,
      descricao: true,
      valorMensalNormalizado: true,
      rateios: {
        where: { vigenciaFim: null },
        select: { setorId: true, percentual: true },
      },
      propostas: {
        where: { status: "PENDENTE" },
        select: {
          id: true,
          justificativa: true,
          criadoEm: true,
          criadoPorId: true,
          criadoPor: { select: { colaborador: { select: { nome: true } } } },
          parcelas: {
            select: {
              id: true,
              percentual: true,
              aceite: true,
              comentario: true,
              setorId: true,
              setor: { select: { nome: true } },
            },
          },
        },
        take: 1,
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

  const [setores, modelos] = await Promise.all([
    listarSetores(),
    prisma.modeloRateio.findMany({
      select: {
        id: true,
        nome: true,
        parcelas: { select: { setorId: true, percentual: true }, orderBy: { percentual: "desc" } },
      },
      orderBy: { nome: "asc" },
      take: 20,
    }),
  ]);
  const valorMensal = item.valorMensalNormalizado?.toString() ?? null;
  const proposta = item.propostas[0] ?? null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <nav aria-label="Você está em" className="text-meta text-[var(--ink-3)]">
        <Link
          href="/custos"
          className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]"
        >
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

      <h1 className="mt-2 titulo-pagina">
        Dividir entre <em className="text-[var(--accent)]">setores</em>
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        {item.descricao}
        {valorMensal && <> · {formatarBRL(valorMensal)}/mês</>}. Um dos setores absorve o restante,
        então a soma fecha sozinha — não é preciso somar de cabeça.
      </p>

      {proposta ? (
        <div className="mt-8">
          <PropostaEmAberto
            proposta={{
              id: proposta.id,
              justificativa: proposta.justificativa,
              criadoEm: proposta.criadoEm.toISOString(),
              autor: proposta.criadoPor.colaborador.nome,
              souOAutor: proposta.criadoPorId === usuario.id,
              parcelas: proposta.parcelas.map((p) => ({
                id: p.id,
                setorNome: p.setor.nome,
                percentual: p.percentual.toString(),
                aceite: p.aceite,
                comentario: p.comentario,
                minhaVez:
                  p.aceite === "PENDENTE" &&
                  (global || (podeLancar(usuario.papel) && usuario.setorId === p.setorId)),
              })),
            }}
            valorMensal={valorMensal}
            podeCancelar={proposta.criadoPorId === usuario.id || global}
          />
        </div>
      ) : (
        <div className="mt-8">
          <EditorDeRateio
            itemId={item.id}
            descricao={item.descricao}
            valorMensal={valorMensal}
            setores={setores}
            aplicaDireto={global}
            modelos={modelos.map((m) => ({
              id: m.id,
              nome: m.nome,
              parcelas: m.parcelas.map((p) => ({
                setorId: p.setorId,
                percentual: p.percentual.toString(),
              })),
            }))}
            inicial={fatiasIniciais(item.rateios, usuario.setorId)}
          />
        </div>
      )}
    </main>
  );
}
