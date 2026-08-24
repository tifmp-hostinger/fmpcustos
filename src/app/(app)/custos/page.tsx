import Link from "next/link";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { formatarBRL } from "@/lib/dinheiro";
import {
  FALTAS,
  SEM_SETOR,
  SITUACOES,
  chipsAtivos,
  lerFiltros,
  temRecorte,
  urlDaLista,
  type Filtros,
  type ParamsBrutos,
} from "@/lib/filtros";
import { whereDaLista } from "@/lib/consultas";
import { IconeBusca, IconeFechar, IconeMais, IconeSeta } from "@/components/icones";
import { TabelaDeCustos, type LinhaCusto } from "./tabela";
import { ModoRevisao } from "./revisao";

export const dynamic = "force-dynamic";

/**
 * Teto de linhas carregadas de uma vez.
 *
 * Não é paginação: é um corte declarado. O recorte de quais itens entram é
 * sempre o mesmo — os maiores por valor mensal — e a ordenação de exibição
 * acontece depois, sobre esse conjunto. Ordenar no banco com um teto faria a
 * própria escolha dos itens mudar a cada clique no cabeçalho, e a lista diria
 * "os 500 primeiros em ordem alfabética" achando que disse "os 500 maiores".
 */
const TETO = 500;

export default async function Custos({ searchParams }: { searchParams: Promise<ParamsBrutos> }) {
  const params = await searchParams;
  const usuario = await exigirSessao();
  const f = lerFiltros(params);
  const global = vePorInteiro(usuario.papel);
  const situacao = SITUACOES.find((s) => s.chave === f.situacao)!;
  const where = whereDaLista(f, usuario);

  const [itens, total, setores, categorias, fornecedores] = await Promise.all([
    prisma.itemCusto.findMany({
      where,
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
      take: TETO,
    }),
    prisma.itemCusto.count({ where }),
    prisma.setor.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.categoria.findMany({ select: { id: true, nome: true } }),
    prisma.fornecedor.findMany({ select: { id: true, nome: true } }),
  ]);

  const nomes = {
    setores: new Map(setores.map((s) => [s.id, s.nome])),
    categorias: new Map(categorias.map((c) => [c.id, c.nome])),
    fornecedores: new Map(fornecedores.map((x) => [x.id, x.nome])),
  };

  // O "/mês" do cabeçalho soma só itens correntes: apresentar um contrato
  // cancelado como despesa mensal em andamento seria mentira aritmética.
  const totalMensal = itens.reduce(
    (soma, i) =>
      i.valorMensalNormalizado && (i.status === "ATIVO" || i.status === "EM_ANALISE")
        ? soma.plus(i.valorMensalNormalizado.toString())
        : soma,
    new Decimal(0),
  );

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

  ordenar(linhas, f);
  const chips = chipsAtivos(f, nomes);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Custos</h1>
          <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
            {/* Contador honesto: quando há corte, a lista diz de quantos. */}
            {itens.length < total ? (
              <>
                Exibindo {itens.length} de {total} custos
              </>
            ) : (
              <>
                {total} {total === 1 ? "custo" : "custos"}
              </>
            )}{" "}
            · {situacao.rotulo.toLowerCase()} ·{" "}
            {global ? "todos os setores" : (usuario.setorNome ?? "sua área")}
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
          <div className="flex flex-wrap items-center gap-2">
            {/* Quem já tem os custos numa planilha não deveria descobrir a
                colagem por acaso: ela vive ao lado do cadastro avulso, com
                menos peso visual porque é o caminho menos frequente. */}
            <Link
              href="/custos/colar"
              className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-3.5 py-2.5 text-[13.5px] font-medium no-underline hover:border-[var(--ink-3)]"
            >
              Colar da planilha
            </Link>
            <Link
              href="/custos/novo"
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[14px] font-semibold text-white no-underline"
            >
              <IconeMais />
              Cadastrar custo
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
          {SITUACOES.map((x) => (
            <Link
              key={x.chave}
              // Trocar de situação preserva o recorte (setor, busca) e limpa o
              // que só existe dentro do recorte anterior: "falta: valor" não
              // significa nada em "Encerrados".
              href={urlDaLista({
                ...f,
                situacao: x.chave,
                falta: x.chave === "pendencia" ? f.falta : "",
                destaque: "",
              })}
              aria-current={x.chave === f.situacao ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-[13px] no-underline transition-colors ${
                x.chave === f.situacao
                  ? "bg-[var(--ink)] font-semibold text-[var(--ground)]"
                  : "border border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
              }`}
            >
              {x.rotulo}
            </Link>
          ))}
        </nav>

        <form action="/custos" className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs">
          {/* Os campos escondidos preservam o recorte quando a busca é enviada:
              sem eles, buscar dentro de um setor jogaria a pessoa para a lista
              inteira e ela concluiria que o filtro não funciona. */}
          <input type="hidden" name="f" value={f.situacao} />
          {f.setor && <input type="hidden" name="setor" value={f.setor} />}
          {f.categoria && <input type="hidden" name="categoria" value={f.categoria} />}
          {f.fornecedor && <input type="hidden" name="fornecedor" value={f.fornecedor} />}
          {f.falta && <input type="hidden" name="falta" value={f.falta} />}
          <IconeBusca className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            type="search"
            name="q"
            defaultValue={f.busca}
            placeholder="Buscar por nome, fornecedor ou observação…"
            aria-label="Buscar custos"
            className="w-full rounded-full border border-[var(--rule)] bg-[var(--surface)] py-2 pr-4 pl-9 text-[14px] outline-none focus:border-[var(--accent)]"
          />
        </form>
      </div>

      {/* Sub-filtros da fila de pendência: cada tipo de falta é um trabalho
          diferente, e preencher doze datas seguidas é mais rápido do que
          alternar entre data, valor e categoria a cada linha. */}
      {f.situacao === "pendencia" && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-[var(--ink-3)]">O que falta:</span>
          <Link
            href={urlDaLista({ ...f, falta: "" })}
            aria-current={!f.falta ? "true" : undefined}
            className={chipClasse(!f.falta)}
          >
            qualquer coisa
          </Link>
          {FALTAS.map((x) => (
            <Link
              key={x.chave}
              href={urlDaLista({ ...f, falta: x.chave })}
              aria-current={f.falta === x.chave ? "true" : undefined}
              className={chipClasse(f.falta === x.chave)}
            >
              {x.rotulo}
            </Link>
          ))}
          {podeLancar(usuario.papel) && linhas.length > 0 && (
            <span className="ml-auto">
              {/* A fila percorrida de uma vez, sem sair da lista: é a diferença
                  entre doze aberturas de item e doze digitações seguidas. */}
              <ModoRevisao
                itens={linhas}
                categorias={categorias.map((c) => ({ valor: c.id, rotulo: c.nome }))}
              />
            </span>
          )}
        </div>
      )}

      {/* Recorte ativo, com o X que o remove. */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {/* Com um setor filtrado, o panorama dele fica a um clique: a lista
              responde "quais custos"; o panorama responde "quanto, comparado
              com quem, e o que vence". São perguntas diferentes. */}
          {f.setor && f.setor !== SEM_SETOR && nomes.setores.has(f.setor) && (
            <Link
              href={`/setores/${f.setor}`}
              className="flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 px-3 py-1 text-[12px] font-medium text-[var(--accent)] no-underline hover:bg-[var(--accent)]/8"
            >
              Panorama de {nomes.setores.get(f.setor)}
              <IconeSeta className="size-3" />
            </Link>
          )}
          {chips.map((c) => (
            <Link
              key={c.rotulo}
              href={c.url}
              className="flex items-center gap-1.5 rounded-full border border-[var(--ink-3)]/40 bg-[var(--surface)] py-1 pr-1.5 pl-3 text-[12px] text-[var(--ink-2)] no-underline hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {c.rotulo}
              <IconeFechar className="size-3" />
            </Link>
          ))}
          {temRecorte(f) && chips.length > 1 && (
            <Link
              href={urlDaLista({ situacao: f.situacao, ordem: f.ordem, dir: f.dir })}
              className="rounded-full px-2.5 py-1 text-[12px] text-[var(--ink-3)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      )}

      {linhas.length === 0 ? (
        <Vazio
          filtros={f}
          podeLancar={podeLancar(usuario.papel)}
          rotuloSituacao={situacao.rotulo}
        />
      ) : (
        <TabelaDeCustos
          itens={linhas}
          mostrarSetor={global}
          podeLancar={podeLancar(usuario.papel)}
          destacar={f.destaque || undefined}
          filtros={f}
          // Transferir custo entre setores é de quem enxerga por inteiro: para
          // os demais a lista vem vazia e a ação nem aparece na barra.
          setores={global ? setores.map((s) => ({ valor: s.id, rotulo: s.nome })) : []}
        />
      )}

      {itens.length < total && (
        <p className="mt-3 text-[12px] text-[var(--ink-3)]">
          Exibindo os {TETO} maiores por valor mensal, de {total}. Filtre por setor ou busque para
          alcançar o resto.
        </p>
      )}

      {/* Reconciliação declarada. O total daqui e o do painel medem coisas
          diferentes e vão divergir; duas telas com duas verdades e nenhuma
          explicação destroem a confiança nas duas. */}
      {totalMensal.greaterThan(0) && (
        <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-[var(--ink-3)]">
          O total desta lista soma o <strong>valor cheio</strong> de cada item exibido, de todas as
          naturezas. O painel inicial soma só os <strong>recorrentes</strong> e conta cada item pela
          fração rateada a cada setor — por isso os dois números podem divergir sem que nenhum
          esteja errado.
        </p>
      )}

      {f.situacao === "lixeira" && linhas.length > 0 && (
        <p className="mt-3 text-[12px] text-[var(--ink-3)]">
          Itens excluídos ficam aqui por 30 dias e depois são apagados de vez. Use o menu da linha
          para restaurar.
        </p>
      )}
    </main>
  );
}

function chipClasse(ativo: boolean): string {
  return `rounded-full px-2.5 py-1 text-[12px] no-underline transition-colors ${
    ativo
      ? "bg-[var(--ink-2)] font-medium text-[var(--ground)]"
      : "border border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
  }`;
}

/**
 * Ordena o conjunto já selecionado.
 *
 * Nulos vão sempre para o fim, nas duas direções: "sem data" não é uma data
 * muito antiga nem muito futura, é ausência — e empurrá-la para o topo faria a
 * primeira tela ser sempre a das lacunas, independente do que se pediu.
 */
function ordenar(linhas: LinhaCusto[], f: Filtros) {
  const sinal = f.dir === "asc" ? 1 : -1;
  const texto = (a: string | null, b: string | null) =>
    (a ?? "").localeCompare(b ?? "", "pt-BR", { sensitivity: "base" });
  const numero = (a: string | null, b: string | null) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1 * sinal; // nulo ao fim, invertendo o sinal aplicado depois
    if (b === null) return -1 * sinal;
    return Number(a) - Number(b);
  };

  linhas.sort((a, b) => {
    switch (f.ordem) {
      case "descricao":
        return sinal * texto(a.descricao, b.descricao);
      case "cobranca":
        return sinal * numero(a.valorPeriodo, b.valorPeriodo);
      case "renovacao":
        return (
          sinal *
          numero(
            a.dataFim ? String(Date.parse(a.dataFim)) : null,
            b.dataFim ? String(Date.parse(b.dataFim)) : null,
          )
        );
      case "situacao":
        return sinal * texto(a.status, b.status);
      case "setor":
        return sinal * texto(a.setores[0]?.nome ?? null, b.setores[0]?.nome ?? null);
      default:
        return sinal * numero(a.valorMensal, b.valorMensal);
    }
  });
}

function Vazio({
  filtros,
  podeLancar,
  rotuloSituacao,
}: {
  filtros: Filtros;
  podeLancar: boolean;
  rotuloSituacao: string;
}) {
  if (filtros.busca) {
    return (
      <Caixa>
        <p className="font-medium">Nada encontrado para “{filtros.busca}”.</p>
        <p className="mt-1.5 text-sm text-[var(--ink-3)]">
          {/* O termo é preservado no link de socorro: perder a busca aqui
              levava a pessoa para mais longe do que ela procurava. */}
          Tente outro termo, ou{" "}
          <Link
            href={urlDaLista({ situacao: "todos", busca: filtros.busca })}
            className="text-[var(--accent)]"
          >
            procure em todas as situações e setores
          </Link>
          .
        </p>
      </Caixa>
    );
  }

  if (filtros.situacao === "pendencia") {
    return (
      <Caixa>
        <p className="font-medium">
          {filtros.falta
            ? `Nenhum custo ${FALTAS.find((x) => x.chave === filtros.falta)!.rotulo}.`
            : "Nenhum dado faltando por aqui."}
        </p>
        <p className="mt-1.5 text-sm text-[var(--ink-3)]">
          Todo custo tem valor, categoria, fornecedor e prazo — o alerta de renovação cobre a área
          inteira.
        </p>
      </Caixa>
    );
  }

  if (filtros.situacao === "lixeira") {
    return (
      <Caixa>
        <p className="font-medium">A lixeira está vazia.</p>
        <p className="mt-1.5 text-sm text-[var(--ink-3)]">
          O que for excluído aparece aqui por 30 dias antes de sumir de vez.
        </p>
      </Caixa>
    );
  }

  if (temRecorte(filtros)) {
    return (
      <Caixa>
        <p className="font-medium">Nenhum custo com esse recorte.</p>
        <p className="mt-1.5 text-sm text-[var(--ink-3)]">
          <Link href={urlDaLista({ situacao: filtros.situacao })} className="text-[var(--accent)]">
            Limpe os filtros
          </Link>{" "}
          para ver todos os custos em “{rotuloSituacao.toLowerCase()}”.
        </p>
      </Caixa>
    );
  }

  return (
    <Caixa>
      <p className="font-medium">
        Nenhum custo{" "}
        {filtros.situacao === "ativos" ? "ativo" : `em “${rotuloSituacao.toLowerCase()}”`} por aqui.
      </p>
      <p className="mt-1.5 text-sm text-[var(--ink-3)]">
        {podeLancar ? (
          <>
            Cadastre o primeiro: comece pelos contratos e assinaturas pagos todo mês. Se já tem tudo
            numa planilha,{" "}
            <Link href="/custos/colar" className="text-[var(--accent)]">
              cole de uma vez
            </Link>
            .
          </>
        ) : (
          "Quando o gestor da sua área lançar os custos, eles aparecem aqui."
        )}
      </p>
    </Caixa>
  );
}

function Caixa({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-[var(--rule)] px-6 py-14 text-center">
      {children}
    </div>
  );
}
