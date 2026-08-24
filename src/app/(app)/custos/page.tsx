import Link from "next/link";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { formatarBRL } from "@/lib/dinheiro";
import {
  AGRUPAMENTOS,
  FALTAS,
  RECORTES,
  SEM_SETOR,
  SITUACOES,
  TODOS_OS_ANOS,
  anoEfetivo,
  chipsAtivos,
  faltasDe,
  situacoesDe,
  lerFiltros,
  temRecorte,
  urlDaLista,
  type Filtros,
  type ParamsBrutos,
} from "@/lib/filtros";
import { comEscopo, whereDaLista } from "@/lib/consultas";
import { IconeBusca, IconeFechar, IconeMais, IconeSeta } from "@/components/icones";
import { TabelaDeCustos, type LinhaCusto } from "./tabela";
import { ModoRevisao } from "./revisao";
import { AplicarAoTrocar } from "./aplicar";

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

/** Só o que está em jogo entra em total: cancelado é histórico, não compromisso. */
const CORRENTES = ["ATIVO", "EM_ANALISE"] as const;
const RENOVAM = ["RECORRENTE", "PESSOAL"] as const;
const ACONTECEM = ["PONTUAL", "CAPEX"] as const;

export default async function Custos({ searchParams }: { searchParams: Promise<ParamsBrutos> }) {
  const params = await searchParams;
  const usuario = await exigirSessao();
  const f = lerFiltros(params);
  const global = vePorInteiro(usuario.papel);
  const situacao = SITUACOES.find((s) => s.chave === f.situacao)!;
  const recorte = RECORTES.find((r) => r.chave === f.natureza)!;
  const anoAtual = new Date().getUTCFullYear();
  const ano = anoEfetivo(f, anoAtual);
  const where = whereDaLista(f, usuario, anoAtual);

  const [itens, total, setores, categorias, fornecedores, porMes, noPeriodo, porNatureza] =
    await Promise.all([
      prisma.itemCusto.findMany({
        where,
        select: {
          id: true,
          descricao: true,
          natureza: true,
          periodicidade: true,
          moeda: true,
          cambio: true,
          valorPeriodo: true,
          valorMensalNormalizado: true,
          valorEmReais: true,
          status: true,
          dataInicio: true,
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
        // Numa aba que mede período, "os 500 maiores" precisa ser pelo valor da
        // cobrança: ordenar por valor mensal traria os 500 primeiros de uma coluna
        // que é nula para toda compra avulsa.
        orderBy:
          recorte.medida === "periodo"
            ? [{ valorEmReais: { sort: "desc", nulls: "last" } }, { atualizadoEm: "desc" }]
            : [
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
      // Os totais somam NO BANCO, sobre o recorte inteiro — não sobre as linhas
      // carregadas. Somar em memória dá o mesmo número enquanto a lista couber no
      // teto e passa a mentir em silêncio no dia em que não couber, que é
      // justamente o dia em que alguém mais precisa do número.
      prisma.itemCusto.aggregate({
        where: { ...where, status: { in: [...CORRENTES] }, natureza: { in: [...RENOVAM] } },
        _sum: { valorMensalNormalizado: true },
        _count: { _all: true },
      }),
      prisma.itemCusto.aggregate({
        where: { ...where, status: { in: [...CORRENTES] }, natureza: { in: [...ACONTECEM] } },
        _sum: { valorEmReais: true },
        _count: { _all: true },
      }),
      // Quais abas existem de verdade. Uma aba "Pessoal" permanentemente vazia é
      // ruído fixo, e o sistema não oferece o que já sabe que vai negar.
      prisma.itemCusto.groupBy({
        by: ["natureza"],
        where: comEscopo(usuario, [{ status: { in: [...CORRENTES, "PENDENTE_APURACAO"] } }]),
        _count: { _all: true },
      }),
    ]);

  const nomes = {
    setores: new Map(setores.map((s) => [s.id, s.nome])),
    categorias: new Map(categorias.map((c) => [c.id, c.nome])),
    fornecedores: new Map(fornecedores.map((x) => [x.id, x.nome])),
  };

  const totalMensal = new Decimal(String(porMes._sum.valorMensalNormalizado ?? 0));
  const totalPeriodo = new Decimal(String(noPeriodo._sum.valorEmReais ?? 0));

  // As abas que têm item, mais a corrente e mais "Tudo" — a corrente porque
  // sumir a aba em que a pessoa está seria trocar a tela debaixo dela.
  const comItem = new Set(porNatureza.filter((g) => g._count._all > 0).map((g) => g.natureza));
  const abas = RECORTES.filter(
    (r) =>
      r.chave === f.natureza ||
      r.chave === "tudo" ||
      r.chave === "recorrente" ||
      r.naturezas?.some((n) => comItem.has(n)),
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
      natureza: i.natureza,
      periodicidade: i.periodicidade,
      moeda: i.moeda,
      cambio: i.cambio?.toString() ?? null,
      valorPeriodo: i.valorPeriodo?.toString() ?? null,
      valorMensal: i.valorMensalNormalizado?.toString() ?? null,
      valorEmReais: i.valorEmReais?.toString() ?? null,
      status: i.status,
      dataInicio: i.dataInicio ? i.dataInicio.toISOString().slice(0, 10) : null,
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
        <h1 className="font-serif text-3xl font-bold tracking-tight">Custos</h1>
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

      {/* A NATUREZA, COMO DIVISÃO DA TELA.
          Não é um filtro entre outros: trocar de aba troca a pergunta, a
          unidade do total e as colunas que fazem sentido. Vem antes da situação
          porque decide o que as outras escolhas significam. */}
      <nav
        aria-label="Natureza do custo"
        data-abas="natureza"
        className="mt-5 flex flex-wrap gap-1 border-b border-[var(--rule)]"
      >
        {abas.map((r) => (
          <Link
            key={r.chave}
            href={urlDaLista({
              ...f,
              natureza: r.chave,
              // O ano e a ordenação pertencem à aba anterior: "ordenar por valor
              // mensal" não significa nada numa aba que mede período, e um ano
              // preso ao trocar para recorrente filtraria sem dizer por quê.
              ano: "",
              ordem: undefined,
              dir: undefined,
              destaque: "",
            })}
            aria-current={r.chave === f.natureza ? "page" : undefined}
            data-aba={r.chave}
            className={`-mb-px border-b-2 px-3.5 py-2 text-[14px] no-underline transition-colors ${
              r.chave === f.natureza
                ? "border-[var(--accent)] font-semibold text-[var(--accent)]"
                : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
            }`}
          >
            {r.rotulo}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        <Total
          recorte={recorte}
          mensal={totalMensal}
          periodo={totalPeriodo}
          quantidadeMensal={porMes._count._all}
          quantidadePeriodo={noPeriodo._count._all}
          ano={ano}
        />
        <p data-contagem="itens" className="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
          {itens.length < total ? (
            <>
              Exibindo {itens.length} de {total}
            </>
          ) : (
            <>
              {total} {total === 1 ? "custo" : "custos"}
            </>
          )}{" "}
          · {situacao.rotulo.toLowerCase()} ·{" "}
          {global ? "todos os setores" : (usuario.setorNome ?? "sua área")}
        </p>
        <p className="mt-1 max-w-2xl text-[12.5px] text-[var(--ink-3)]">{recorte.resumo}</p>
      </div>

      {/* O ano só existe onde o total mede período: numa aba de compromisso
          mensal ele não teria o que recortar. */}
      {recorte.medida === "periodo" && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-[var(--ink-3)]">Exercício:</span>
          {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
            <Link
              key={a}
              href={urlDaLista({ ...f, ano: String(a), destaque: "" })}
              aria-current={ano === String(a) ? "true" : undefined}
              className={chipClasse(ano === String(a))}
            >
              {a}
            </Link>
          ))}
          <Link
            href={urlDaLista({ ...f, ano: TODOS_OS_ANOS, destaque: "" })}
            aria-current={ano === "" ? "true" : undefined}
            className={chipClasse(ano === "")}
          >
            todos os anos
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
          {situacoesDe(f.natureza).map((x) => (
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

        {/* Agrupar é uma forma de OLHAR, não um filtro: nada sai da lista, o
            mesmo conjunto se reorganiza. Por isso mora junto da busca e não
            entre os chips, que dizem o que foi tirado de vista. */}
        <form action="/custos" className="flex items-center gap-1.5">
          <input type="hidden" name="nat" value={f.natureza} />
          <input type="hidden" name="f" value={f.situacao} />
          {f.ano && <input type="hidden" name="ano" value={f.ano} />}
          {f.busca && <input type="hidden" name="q" value={f.busca} />}
          {f.setor && <input type="hidden" name="setor" value={f.setor} />}
          {f.categoria && <input type="hidden" name="categoria" value={f.categoria} />}
          {f.fornecedor && <input type="hidden" name="fornecedor" value={f.fornecedor} />}
          {f.falta && <input type="hidden" name="falta" value={f.falta} />}
          <label htmlFor="agrupar" className="text-[12px] text-[var(--ink-3)]">
            Agrupar:
          </label>
          <select
            id="agrupar"
            name="g"
            defaultValue={f.agrupar}
            data-controle="agrupar"
            className="rounded-full border border-[var(--rule)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--ink-2)] outline-none focus:border-[var(--accent)]"
          >
            {AGRUPAMENTOS.map((a) => (
              <option key={a.chave} value={a.chave}>
                {a.rotulo}
              </option>
            ))}
          </select>
          <noscript>
            <button type="submit" className="text-[12px] underline">
              Aplicar
            </button>
          </noscript>
          <AplicarAoTrocar />
        </form>

        <form action="/custos" className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs">
          {/* Os campos escondidos preservam o recorte quando a busca é enviada:
              sem eles, buscar dentro de um setor jogaria a pessoa para a lista
              inteira e ela concluiria que o filtro não funciona. */}
          <input type="hidden" name="nat" value={f.natureza} />
          <input type="hidden" name="f" value={f.situacao} />
          {f.ano && <input type="hidden" name="ano" value={f.ano} />}
          {f.agrupar && <input type="hidden" name="g" value={f.agrupar} />}
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
          {faltasDe(f.natureza).map((x) => (
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
          colunas={{
            mensal: recorte.medida !== "periodo",
            renovacao: recorte.medida !== "periodo",
            aquisicao: recorte.medida === "periodo",
            // Só em "Tudo": nas outras a natureza é o título da aba, e repeti-la
            // em cada linha seria dizer a mesma coisa 500 vezes.
            natureza: recorte.naturezas === null,
          }}
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
          Exibindo os {TETO} maiores de {total}. O total acima conta os {total} —{" "}
          {/* Dito porque a diferença importa: o corte é de exibição, não de
              cálculo, e sem essa frase o número grande pareceria não bater com
              as linhas que dá para contar na tela. */}
          quem some é a linha, não o dinheiro. Filtre ou busque para alcançar o resto.
        </p>
      )}

      {/* A nota de reconciliação encolheu porque o motivo dela encolheu: a
          lista não soma mais as quatro naturezas na mesma coluna, então o total
          de "Recorrente" e o do painel passaram a ser o mesmo número. Sobrou uma
          divergência real e só uma — com escopo de setor, o painel conta a
          FRAÇÃO rateada e a lista conta o item inteiro. */}
      {f.setor && f.setor !== SEM_SETOR && totalMensal.greaterThan(0) && (
        <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-[var(--ink-3)]">
          Este total soma o <strong>valor cheio</strong> de cada custo que passa pelo setor. O
          panorama do setor soma a <strong>fração rateada</strong> a ele — num custo dividido, os
          dois números diferem sem que nenhum esteja errado.
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

/**
 * O número da aba, com a unidade que ele de fato tem.
 *
 * Este componente é o coração da mudança. Antes existia um "/mês" só, somando
 * as quatro naturezas — e o rodapé da tela pedia desculpa por ele divergir do
 * painel. Um compromisso mensal e um gasto do exercício não são a mesma espécie
 * de número: um se projeta (×12), o outro se compara com o ano anterior. Dar a
 * cada um a sua unidade é o que torna os dois utilizáveis.
 *
 * Em "Tudo" saem DOIS números, nunca um. Somar compromisso mensal com gasto
 * anual produziria um valor que não responde a pergunta nenhuma, e a tentação
 * de somá-los é exatamente o defeito que se está corrigindo.
 */
function Total({
  recorte,
  mensal,
  periodo,
  quantidadeMensal,
  quantidadePeriodo,
  ano,
}: {
  recorte: (typeof RECORTES)[number];
  mensal: Decimal;
  periodo: Decimal;
  quantidadeMensal: number;
  quantidadePeriodo: number;
  ano: string;
}) {
  const deQuando = ano ? `em ${ano}` : "de todos os anos";

  if (recorte.medida === "mensal") {
    if (mensal.isZero()) return null;
    return (
      <p className="text-[15px]">
        <strong className="font-serif text-[26px] leading-none font-bold tabular-nums">
          {formatarBRL(mensal)}
        </strong>
        <span className="ml-1 text-[var(--ink-2)]">/mês</span>
        {/* A projeção não é um segundo total: é o mesmo número na escala em que
            as decisões de contrato são tomadas. */}
        <span className="ml-2.5 text-[13px] text-[var(--ink-3)]">
          · <span className="tabular-nums">{formatarBRL(mensal.mul(12))}</span> em 12 meses, ao
          ritmo de hoje
        </span>
      </p>
    );
  }

  if (recorte.medida === "periodo") {
    if (periodo.isZero()) return null;
    return (
      <p className="text-[15px]">
        <strong className="font-serif text-[26px] leading-none font-bold tabular-nums">
          {formatarBRL(periodo)}
        </strong>
        <span className="ml-1.5 text-[var(--ink-2)]">{deQuando}</span>
        <span className="ml-2.5 text-[13px] text-[var(--ink-3)]">
          · {quantidadePeriodo} {quantidadePeriodo === 1 ? "lançamento" : "lançamentos"}
        </span>
      </p>
    );
  }

  // "Tudo": dois números com rótulos distintos, lado a lado, nunca somados.
  if (mensal.isZero() && periodo.isZero()) return null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[15px]">
      {mensal.greaterThan(0) && (
        <span>
          <strong className="font-serif text-[22px] leading-none font-bold tabular-nums">
            {formatarBRL(mensal)}
          </strong>
          <span className="ml-1 text-[13px] text-[var(--ink-2)]">
            /mês em {quantidadeMensal} recorrentes
          </span>
        </span>
      )}
      {periodo.greaterThan(0) && (
        <span>
          <strong className="font-serif text-[22px] leading-none font-bold tabular-nums">
            {formatarBRL(periodo)}
          </strong>
          <span className="ml-1 text-[13px] text-[var(--ink-2)]">
            {deQuando} em {quantidadePeriodo} pontuais e investimentos
          </span>
        </span>
      )}
    </p>
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
