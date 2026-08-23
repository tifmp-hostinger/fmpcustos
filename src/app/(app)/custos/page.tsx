import Link from "next/link";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { escopoDeItens, listarSetores } from "@/lib/consultas";
import { formatarBRL } from "@/lib/dinheiro";
import { IconeBusca, IconeMais } from "@/components/icones";
import { TabelaDeCustos, type LinhaCusto } from "./tabela";
import type { StatusItem } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

/**
 * Filtros rápidos, na ordem em que fazem sentido para quem opera.
 *
 * "Falta dado" e "Excluídos" são os dois novos. O primeiro converte o
 * diagnóstico do painel ("12 itens sem data de término") em fila de trabalho —
 * antes ele era um número que não levava a lugar nenhum. O segundo é a âncora
 * permanente do desfazer: quem só percebe o erro no dia seguinte, quando o
 * aviso já sumiu, encontra o item aqui.
 */
const FILTROS: Array<{
  chave: string;
  rotulo: string;
  status: StatusItem[] | null;
  lixeira?: boolean;
  pendencia?: boolean;
}> = [
  { chave: "ativos", rotulo: "Ativos", status: ["ATIVO"] },
  { chave: "analise", rotulo: "Em análise", status: ["EM_ANALISE", "CANCELAMENTO_SOLICITADO"] },
  { chave: "pendencia", rotulo: "Falta dado", status: null, pendencia: true },
  { chave: "encerrados", rotulo: "Encerrados", status: ["CANCELADO", "SUBSTITUIDO"] },
  { chave: "todos", rotulo: "Todos", status: null },
  { chave: "lixeira", rotulo: "Excluídos", status: null, lixeira: true },
];

/** Query string repetida (?q=a&q=b) chega como array — normaliza para o primeiro. */
function unico(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function Custos({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    f?: string | string[];
    setor?: string | string[];
    destaque?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const usuario = await exigirSessao();
  const filtro = FILTROS.find((x) => x.chave === unico(params.f)) ?? FILTROS[0];
  const busca = unico(params.q).trim().slice(0, 120);
  const setorFiltrado = unico(params.setor);
  const global = vePorInteiro(usuario.papel);

  const itens = await prisma.itemCusto.findMany({
    where: {
      ...escopoDeItens(usuario, filtro.lixeira ? "dentro" : "fora"),
      ...(filtro.status ? { status: { in: filtro.status } } : {}),
      // Falta dado: sem valor, sem categoria, ou sem prazo nem marcação de que
      // não há prazo. Cancelado não entra — dado faltando em contrato encerrado
      // não é trabalho, é história.
      ...(filtro.pendencia
        ? {
            status: { in: ["ATIVO", "EM_ANALISE", "PENDENTE_APURACAO"] },
            OR: [
              { valorPeriodo: null },
              { categoriaId: null },
              { AND: [{ dataFim: null }, { semPrazoDeterminado: false }] },
            ],
          }
        : {}),
      ...(setorFiltrado
        ? { rateios: { some: { setorId: setorFiltrado, vigenciaFim: null } } }
        : {}),
      ...(busca
        ? {
            OR: [
              { descricao: { contains: busca, mode: "insensitive" } },
              { fornecedor: { nome: { contains: busca, mode: "insensitive" } } },
              { observacoes: { contains: busca, mode: "insensitive" } },
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
      semPrazoDeterminado: true,
      excluidoEm: true,
      fornecedor: { select: { nome: true } },
      categoria: { select: { nome: true } },
      rateios: {
        where: { vigenciaFim: null },
        select: { setorId: true, percentual: true, setor: { select: { nome: true } } },
        orderBy: { percentual: "desc" },
      },
      _count: { select: { lancamentos: true } },
    },
    orderBy: [
      { valorMensalNormalizado: { sort: "desc", nulls: "last" } },
      { atualizadoEm: "desc" },
    ],
    take: 500,
  });

  const setores = global ? await listarSetores() : [];

  // O "/mês" do cabeçalho soma só itens correntes: apresentar um contrato
  // cancelado como despesa mensal em andamento seria mentira aritmética.
  const totalMensal = itens.reduce(
    (soma, i) =>
      i.valorMensalNormalizado && (i.status === "ATIVO" || i.status === "EM_ANALISE")
        ? soma.plus(i.valorMensalNormalizado.toString())
        : soma,
    new Decimal(0),
  );

  const escopoTexto = global
    ? setorFiltrado
      ? (setores.find((s) => s.valor === setorFiltrado)?.rotulo ?? "um setor")
      : "todos os setores"
    : (usuario.setorNome ?? "sua área");

  const linhas: LinhaCusto[] = itens.map((i) => {
    // Permissão resolvida aqui, uma vez, com os dados que a consulta já trouxe:
    // a tela nunca oferece uma ação que a action vai recusar depois do clique.
    const soDoMeuSetor =
      i.rateios.length === 1 &&
      i.rateios[0].setorId === usuario.setorId &&
      Number(i.rateios[0].percentual) === 100;
    const podeEditar = global || soDoMeuSetor;
    return {
      id: i.id,
      descricao: i.descricao,
      fornecedor: i.fornecedor?.nome ?? null,
      categoria: i.categoria?.nome ?? null,
      periodicidade: i.periodicidade,
      valorPeriodo: i.valorPeriodo?.toString() ?? null,
      valorMensal: i.valorMensalNormalizado?.toString() ?? null,
      status: i.status,
      dataFim: i.dataFim ? i.dataFim.toISOString().slice(0, 10) : null,
      semPrazo: i.semPrazoDeterminado,
      setores: i.rateios.map((r) => ({
        nome: r.setor.nome,
        percentual: r.percentual?.toString() ?? "0",
      })),
      temLancamentos: i._count.lancamentos > 0,
      podeEditar,
      podeRatear: podeEditar && !i.excluidoEm,
      motivoBloqueio: podeEditar
        ? null
        : "Custo compartilhado entre setores — alterações passam pela Controladoria.",
      naLixeira: i.excluidoEm !== null,
    };
  });

  const consulta = (extra: Record<string, string | undefined>) => ({
    pathname: "/custos" as const,
    query: Object.fromEntries(
      Object.entries({
        f: filtro.chave,
        q: busca || undefined,
        setor: setorFiltrado || undefined,
        ...extra,
      }).filter(([, v]) => v !== undefined && v !== ""),
    ),
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Custos</h1>
          <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
            {itens.length} {itens.length === 1 ? "item" : "itens"}
            {busca && <> para “{busca}”</>} · {filtro.rotulo.toLowerCase()} · {escopoTexto}
            {totalMensal.greaterThan(0) && (
              <>
                {" "}
                · <strong className="tabular-nums">{formatarBRL(totalMensal)}/mês</strong> em itens
                correntes
              </>
            )}
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
              href={{
                pathname: "/custos",
                query: {
                  f: x.chave,
                  ...(busca ? { q: busca } : {}),
                  ...(setorFiltrado ? { setor: setorFiltrado } : {}),
                },
              }}
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
          {setorFiltrado && <input type="hidden" name="setor" value={setorFiltrado} />}
          <IconeBusca className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Buscar por nome, fornecedor ou observação…"
            aria-label="Buscar custos"
            className="w-full rounded-full border border-[var(--rule)] bg-[var(--surface)] py-2 pr-4 pl-9 text-[14px] outline-none focus:border-[var(--accent)]"
          />
        </form>
      </div>

      {/* Filtro por setor: é o que faz "Marketing R$ 12.400/mês" no painel
          virar um link para a lista cujo total é exatamente esse número. */}
      {global && setores.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[var(--ink-3)]">Setor:</span>
          <Link
            href={consulta({ setor: undefined })}
            aria-current={!setorFiltrado ? "true" : undefined}
            className={`rounded-full px-2.5 py-1 text-[12px] no-underline ${
              !setorFiltrado
                ? "bg-[var(--ink-2)] font-medium text-[var(--ground)]"
                : "border border-[var(--rule)] text-[var(--ink-2)]"
            }`}
          >
            todos
          </Link>
          {setores.map((s) => (
            <Link
              key={s.valor}
              href={consulta({ setor: s.valor })}
              aria-current={setorFiltrado === s.valor ? "true" : undefined}
              className={`rounded-full px-2.5 py-1 text-[12px] no-underline ${
                setorFiltrado === s.valor
                  ? "bg-[var(--ink-2)] font-medium text-[var(--ground)]"
                  : "border border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
              }`}
            >
              {s.rotulo}
            </Link>
          ))}
        </div>
      )}

      {linhas.length === 0 ? (
        <Vazio
          busca={busca}
          filtro={filtro.chave}
          rotuloFiltro={filtro.rotulo}
          podeLancar={podeLancar(usuario.papel)}
        />
      ) : (
        <TabelaDeCustos
          itens={linhas}
          mostrarSetor={global}
          podeLancar={podeLancar(usuario.papel)}
          destacar={unico(params.destaque) || undefined}
        />
      )}

      {itens.length === 500 && (
        <p className="mt-3 text-[12px] text-[var(--ink-3)]">
          Exibindo os 500 maiores. Filtre por setor ou busque para ver o resto.
        </p>
      )}

      {filtro.lixeira && linhas.length > 0 && (
        <p className="mt-3 text-[12px] text-[var(--ink-3)]">
          Itens excluídos ficam aqui por 30 dias e depois são apagados de vez. Use o menu da linha
          para restaurar.
        </p>
      )}
    </main>
  );
}

function Vazio({
  busca,
  filtro,
  rotuloFiltro,
  podeLancar,
}: {
  busca: string;
  filtro: string;
  rotuloFiltro: string;
  podeLancar: boolean;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-[var(--rule)] px-6 py-14 text-center">
      {busca ? (
        <>
          <p className="font-medium">Nada encontrado para “{busca}”.</p>
          <p className="mt-1.5 text-sm text-[var(--ink-3)]">
            {/* O termo é preservado no link de socorro: perder a busca aqui
                levava a pessoa para mais longe do que ela procurava. */}
            Tente outro termo, ou{" "}
            <Link
              href={{ pathname: "/custos", query: { f: "todos", q: busca } }}
              className="text-[var(--accent)]"
            >
              procure em todas as situações
            </Link>
            .
          </p>
        </>
      ) : filtro === "pendencia" ? (
        <>
          <p className="font-medium">Nenhum dado faltando por aqui.</p>
          <p className="mt-1.5 text-sm text-[var(--ink-3)]">
            Todo custo tem valor, categoria e prazo — o alerta de renovação cobre a área inteira.
          </p>
        </>
      ) : filtro === "lixeira" ? (
        <>
          <p className="font-medium">A lixeira está vazia.</p>
          <p className="mt-1.5 text-sm text-[var(--ink-3)]">
            O que for excluído aparece aqui por 30 dias antes de sumir de vez.
          </p>
        </>
      ) : (
        <>
          <p className="font-medium">
            Nenhum custo {filtro === "ativos" ? "ativo" : `em “${rotuloFiltro.toLowerCase()}”`} por
            aqui.
          </p>
          <p className="mt-1.5 text-sm text-[var(--ink-3)]">
            {podeLancar
              ? "Cadastre o primeiro: comece pelos contratos e assinaturas pagos todo mês."
              : "Quando o gestor da sua área lançar os custos, eles aparecem aqui."}
          </p>
        </>
      )}
    </div>
  );
}
