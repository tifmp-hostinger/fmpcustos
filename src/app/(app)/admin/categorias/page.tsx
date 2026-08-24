import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { formatarBRL } from "@/lib/dinheiro";
import { podeApagar } from "@/lib/organizacao";
import { PainelDeCategorias } from "./painel";
import type { LinhaOrganizacao } from "../organizacao";

export const dynamic = "force-dynamic";

const CORRENTES = ["ATIVO", "EM_ANALISE"] as const;

/**
 * Categorias, com o dinheiro de cada uma à vista.
 *
 * O importador de planilha se recusa a criar categoria sozinho — de propósito,
 * para não nascerem "Softwares", "software" e "SW". Mas essa recusa só faz
 * sentido se existir um caminho de gente para criar a categoria certa, e até
 * aqui esse caminho era um `INSERT`.
 *
 * A coluna "sem categoria" no fim da tela não é um detalhe: enquanto ela tiver
 * dinheiro, o gráfico por tipo está incompleto, e um gráfico incompleto que não
 * declara isso é pior que gráfico nenhum.
 */
export default async function Categorias() {
  await exigirAdmin();

  const [categorias, itens, semCategoria] = await Promise.all([
    prisma.categoria.findMany({
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      select: {
        id: true,
        nome: true,
        codigo: true,
        ativo: true,
        categoriaPaiId: true,
        categoriaPai: { select: { nome: true } },
        _count: { select: { itens: true, servicos: true, orcamentos: true, subcategorias: true } },
      },
    }),
    prisma.itemCusto.findMany({
      where: {
        excluidoEm: null,
        status: { in: [...CORRENTES] },
        valorMensalNormalizado: { not: null },
        categoriaId: { not: null },
      },
      select: { categoriaId: true, valorMensalNormalizado: true },
    }),
    prisma.itemCusto.aggregate({
      where: {
        excluidoEm: null,
        status: { in: [...CORRENTES] },
        valorMensalNormalizado: { not: null },
        categoriaId: null,
      },
      _sum: { valorMensalNormalizado: true },
      _count: { _all: true },
    }),
  ]);

  const soma = new Map<string, { total: Decimal; itens: number }>();
  for (const item of itens) {
    if (!item.categoriaId) continue;
    const atual = soma.get(item.categoriaId) ?? { total: new Decimal(0), itens: 0 };
    atual.total = atual.total.plus(String(item.valorMensalNormalizado ?? 0));
    atual.itens += 1;
    soma.set(item.categoriaId, atual);
  }

  const linhas: LinhaOrganizacao[] = categorias.map((c) => {
    const uso = soma.get(c.id) ?? { total: new Decimal(0), itens: 0 };
    const n = c._count;
    const veredito = podeApagar({
      custos: n.itens,
      serviços: n.servicos,
      orçamentos: n.orcamentos,
      subcategorias: n.subcategorias,
    });

    const extras: string[] = [];
    if (n.subcategorias > 0) {
      extras.push(`${n.subcategorias} ${n.subcategorias === 1 ? "subcategoria" : "subcategorias"}`);
    }

    return {
      id: c.id,
      nome: c.nome,
      codigo: c.codigo,
      ativo: c.ativo,
      paiId: c.categoriaPaiId,
      paiNome: c.categoriaPai?.nome ?? null,
      // O total, e não só o corrente: é o número que a fusão vai mover, e
      // prometer um e mover outro é o tipo de mentira pequena que corrói a
      // confiança na tela inteira.
      custos: n.itens,
      correntes: uso.itens,
      mensal: uso.itens > 0 ? formatarBRL(uso.total) : "—",
      extras,
      travadoPor: veredito.motivo,
    };
  });

  const total = [...soma.values()].reduce((s, v) => s.plus(v.total), new Decimal(0));
  const orfaos = {
    itens: semCategoria._count._all,
    mensal: new Decimal(String(semCategoria._sum.valorMensalNormalizado ?? 0)),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-[12px] font-semibold tracking-[0.14em] text-[var(--ink-3)] uppercase">
        Administração
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">Categorias</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        Como o custo da FMP é agrupado por tipo. {linhas.filter((l) => l.ativo).length} ativas,
        somando <strong className="tabular-nums">{formatarBRL(total)}/mês</strong>.
      </p>

      <PainelDeCategorias
        linhas={linhas}
        orfaos={{ ...orfaos, mensal: formatarBRL(orfaos.mensal) }}
      />
    </main>
  );
}
