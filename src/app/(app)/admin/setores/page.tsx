import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { formatarBRL } from "@/lib/dinheiro";
import { podeApagar } from "@/lib/organizacao";
import { PainelDeSetores } from "./painel";
import type { LinhaOrganizacao } from "../organizacao";

export const dynamic = "force-dynamic";

const CORRENTES = ["ATIVO", "EM_ANALISE"] as const;

/**
 * Setores, com o dinheiro de cada um à vista.
 *
 * Até aqui, criar um setor exigia SQL. O efeito prático não era "dá trabalho":
 * era que ninguém criava — os custos de uma área nova iam para o setor mais
 * parecido, e o rateio da FMP passava a descrever a estrutura de dois anos atrás.
 *
 * A coluna do dinheiro não é enfeite: inativar um setor sem saber que passam
 * R$ 30 mil por mês por ele é uma decisão cega, e o tamanho do que se fez só
 * apareceria no painel, depois.
 */
export default async function Setores() {
  await exigirAdmin();

  const [setores, colaboradores, rateios] = await Promise.all([
    prisma.setor.findMany({
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      select: {
        id: true,
        nome: true,
        codigo: true,
        ativo: true,
        setorPaiId: true,
        setorPai: { select: { nome: true } },
        gestorId: true,
        gestor: { select: { nome: true } },
        responsavelDadoId: true,
        responsavelDado: { select: { nome: true } },
        _count: {
          select: {
            colaboradores: true,
            contratos: true,
            orcamentos: true,
            centrosCusto: true,
            subsetores: true,
            acessos: true,
            parcelasProposta: true,
            parcelasModelo: true,
          },
        },
      },
    }),
    prisma.colaborador.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    // A soma vem daqui, e não de um `_count`: o que interessa é a FRAÇÃO
    // rateada a cada setor, não o valor cheio do custo compartilhado — senão um
    // item 50/50 apareceria inteiro nas duas linhas.
    prisma.rateio.findMany({
      where: {
        vigenciaFim: null,
        itemCusto: {
          excluidoEm: null,
          status: { in: [...CORRENTES] },
          valorMensalNormalizado: { not: null },
        },
      },
      select: {
        setorId: true,
        percentual: true,
        itemCusto: { select: { valorMensalNormalizado: true } },
      },
    }),
  ]);

  const somaPorSetor = new Map<string, { total: Decimal; itens: number }>();
  for (const r of rateios) {
    // `itemCusto` é opcional no esquema — um rateio pode pender de lançamento em
    // vez de item. O filtro já exclui esses, mas o tipo continua nulável e um
    // `!` esconderia a mudança no dia em que o filtro mudar.
    if (!r.itemCusto) continue;
    const atual = somaPorSetor.get(r.setorId) ?? { total: new Decimal(0), itens: 0 };
    const cheio = new Decimal(String(r.itemCusto.valorMensalNormalizado ?? 0));
    atual.total = atual.total.plus(cheio.mul(String(r.percentual)).div(100));
    atual.itens += 1;
    somaPorSetor.set(r.setorId, atual);
  }

  // O total de rateios inclui os históricos e os de itens fora do corrente; o
  // veredito de "pode apagar" precisa do número CRU, não do que a soma vê.
  const rateiosTotais = await prisma.rateio.groupBy({
    by: ["setorId"],
    _count: { _all: true },
  });
  const totalDeRateios = new Map(rateiosTotais.map((g) => [g.setorId, g._count._all]));

  const linhas: LinhaOrganizacao[] = setores.map((s) => {
    const uso = somaPorSetor.get(s.id) ?? { total: new Decimal(0), itens: 0 };
    const c = s._count;
    const veredito = podeApagar({
      "custos rateados": totalDeRateios.get(s.id) ?? 0,
      "pessoas lotadas": c.colaboradores,
      contratos: c.contratos,
      orçamentos: c.orcamentos,
      "centros de custo": c.centrosCusto,
      subsetores: c.subsetores,
      "acessos de usuário": c.acessos,
      "fatias em proposta": c.parcelasProposta,
      "modelos de rateio": c.parcelasModelo,
    });

    const extras: string[] = [];
    if (s.gestor) extras.push(`gestor: ${s.gestor.nome}`);
    if (s.responsavelDado) extras.push(`dado: ${s.responsavelDado.nome}`);
    if (c.colaboradores > 0) {
      extras.push(`${c.colaboradores} ${c.colaboradores === 1 ? "pessoa" : "pessoas"}`);
    }

    return {
      id: s.id,
      nome: s.nome,
      codigo: s.codigo,
      ativo: s.ativo,
      paiId: s.setorPaiId,
      paiNome: s.setorPai?.nome ?? null,
      custos: totalDeRateios.get(s.id) ?? 0,
      correntes: uso.itens,
      mensal: uso.itens > 0 ? formatarBRL(uso.total) : "—",
      extras,
      travadoPor: veredito.motivo,
    };
  });

  const totalGeral = [...somaPorSetor.values()].reduce((s, v) => s.plus(v.total), new Decimal(0));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="sobrancelha">Administração</p>
      <h1 className="mt-2 titulo-pagina">Setores</h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">
        A estrutura pela qual o custo da FMP é dividido. {linhas.filter((l) => l.ativo).length}{" "}
        ativos, somando <strong className="tabular-nums">{formatarBRL(totalGeral)}/mês</strong>.
      </p>

      <PainelDeSetores linhas={linhas} colaboradores={colaboradores} />
    </main>
  );
}
