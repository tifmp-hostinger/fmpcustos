import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { escopoDeItens, listarCategorias, listarSetores } from "@/lib/consultas";
import { formatarBRL } from "@/lib/dinheiro";
import { FormularioCusto } from "../formulario";
import { PropostaEmAberto } from "./rateio/proposta";
import { Historico } from "./historico";

export const dynamic = "force-dynamic";

function paraInput(data: Date | null): string | null {
  return data ? data.toISOString().slice(0, 10) : null;
}

export default async function EditarCusto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirSessao();

  const item = await prisma.itemCusto.findFirst({
    // "ambos" para que um item na lixeira ainda abra pelo link direto: o
    // histórico dele continua sendo consultável, e restaurar é possível.
    where: { id, ...escopoDeItens(usuario, "ambos", true) },
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
          criadoEm: true,
          criadoPorId: true,
          criadoPor: { select: { colaborador: { select: { nome: true } } } },
          parcelas: {
            select: {
              id: true,
              aceite: true,
              percentual: true,
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
  const donoIntegral =
    item.rateios.length === 1 &&
    item.rateios[0].setorId === usuario.setorId &&
    Number(item.rateios[0].percentual) === 100;
  const podeRatear =
    (global || (podeLancar(usuario.papel) && donoIntegral)) && item.propostas.length === 0;
  const proposta = item.propostas[0];
  const valorMensal = item.valorMensalNormalizado?.toString() ?? null;

  const [categorias, setores, fornecedores] = await Promise.all([
    listarCategorias(),
    listarSetores(),
    prisma.fornecedor.findMany({ select: { nome: true }, orderBy: { nome: "asc" }, take: 500 }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav aria-label="Você está em" className="text-[12px] text-[var(--ink-3)]">
        <Link
          href="/custos"
          className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]"
        >
          Custos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">Editar</span>
      </nav>

      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">{item.descricao}</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        {valorMensal ? (
          <>
            <strong className="tabular-nums">{formatarBRL(valorMensal)}/mês</strong> ·{" "}
          </>
        ) : null}
        Toda alteração fica no histórico, no fim desta página, com autor e data.
      </p>

      {item.excluidoEm && (
        <p className="mt-4 rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--accent)]/8 px-4 py-3 text-sm">
          Este custo está na lixeira desde {item.excluidoEm.toLocaleDateString("pt-BR")} e não entra
          em nenhum total. Ele é apagado de vez 30 dias depois disso —{" "}
          <Link
            href={{ pathname: "/custos", query: { f: "lixeira" } }}
            className="text-[var(--accent)]"
          >
            restaure pela lixeira
          </Link>{" "}
          se ainda for necessário.
        </p>
      )}

      <FormularioCusto
        categorias={categorias}
        setores={setores}
        fornecedores={fornecedores.map((f) => f.nome)}
        podeEscolherSetor={global}
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

      {proposta ? (
        <section className="mt-10">
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
                // O aceite passa a existir também aqui, na página do custo.
                // Antes ele só aparecia na tela inicial de quem recebia a
                // fatia: quem abrisse o custo pelo link via a proposta e não
                // tinha como decidir.
                minhaVez:
                  p.aceite === "PENDENTE" &&
                  (global || (podeLancar(usuario.papel) && usuario.setorId === p.setorId)),
              })),
            }}
            valorMensal={valorMensal}
            podeCancelar={proposta.criadoPorId === usuario.id || global}
          />
        </section>
      ) : (
        <section className="mt-10 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
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
              <li key={r.setorId} className="flex items-baseline justify-between gap-3 text-[14px]">
                <span>{r.setor.nome}</span>
                <span className="tabular-nums text-[var(--ink-2)]">
                  {Number(r.percentual).toFixed(2).replace(".", ",")}%
                  {valorMensal && (
                    <span className="ml-2 text-[var(--ink-3)]">
                      {formatarBRL((Number(valorMensal) * Number(r.percentual)) / 100)}
                      /mês
                    </span>
                  )}
                </span>
              </li>
            ))}
            {item.rateios.length === 0 && (
              <li className="text-[14px] text-[var(--ink-3)]">
                Sem setor responsável — não rateado.
              </li>
            )}
          </ul>

          {!podeRatear && !global && (
            <p className="mt-3 text-[12px] text-[var(--ink-3)]">
              {item.rateios.length > 1
                ? "Custo compartilhado: alterações de rateio são feitas pela Controladoria ou pelo administrador."
                : "Só o gestor da área responsável (ou a Controladoria) pode propor um rateio."}
            </p>
          )}
        </section>
      )}

      <Historico itemId={item.id} />
    </main>
  );
}
