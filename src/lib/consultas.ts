import { prisma } from "@/lib/db";
import { setoresVisiveis, type UsuarioSessao } from "@/lib/sessao";

/**
 * Filtro de itens de custo respeitando o escopo de setor do usuário.
 * Só rateios VIGENTES contam: um item transferido para outro setor (rateio
 * antigo com vigenciaFim preenchida) deixa de pertencer ao setor de origem.
 */
export function escopoDeItens(usuario: UsuarioSessao) {
  const setores = setoresVisiveis(usuario);
  if (setores === null) return {};
  return { rateios: { some: { setorId: { in: setores }, vigenciaFim: null } } };
}

export async function listarCategorias() {
  const categorias = await prisma.categoria.findMany({
    select: { id: true, nome: true, categoriaPai: { select: { nome: true } } },
    orderBy: [{ categoriaPai: { nome: "asc" } }, { nome: "asc" }],
  });
  return categorias.map((c) => ({
    valor: c.id,
    rotulo: c.categoriaPai ? `${c.categoriaPai.nome} › ${c.nome}` : c.nome,
  }));
}

/** Fatias de rateio propostas ao setor do usuário, aguardando a decisão dele. */
export async function aceitesPendentesDoSetor(setorId: string | null) {
  if (!setorId) return [];
  const parcelas = await prisma.propostaRateioParcela.findMany({
    where: { setorId, aceite: "PENDENTE", proposta: { status: "PENDENTE" } },
    select: {
      id: true,
      percentual: true,
      proposta: {
        select: {
          justificativa: true,
          itemCusto: { select: { id: true, descricao: true, valorMensalNormalizado: true } },
          criadoPor: {
            select: {
              colaborador: { select: { nome: true, setor: { select: { nome: true } } } },
            },
          },
        },
      },
    },
    orderBy: { proposta: { criadoEm: "asc" } },
    take: 10,
  });
  return parcelas.map((p) => ({
    id: p.id,
    percentual: Number(p.percentual).toFixed(0),
    itemId: p.proposta.itemCusto.id,
    itemDescricao: p.proposta.itemCusto.descricao,
    valorMensal: p.proposta.itemCusto.valorMensalNormalizado?.toString() ?? null,
    proponente: p.proposta.criadoPor.colaborador.nome,
    setorProponente: p.proposta.criadoPor.colaborador.setor?.nome ?? null,
    justificativa: p.proposta.justificativa,
  }));
}

/** Propostas feitas pelo usuário que ainda aguardam aceite de alguém. */
export async function propostasDoUsuario(usuarioId: string) {
  const propostas = await prisma.propostaRateio.findMany({
    where: { criadoPorId: usuarioId, status: "PENDENTE" },
    select: {
      id: true,
      itemCusto: { select: { id: true, descricao: true } },
      parcelas: { select: { aceite: true, setor: { select: { nome: true } } } },
    },
    orderBy: { criadoEm: "desc" },
    take: 5,
  });
  return propostas.map((p) => ({
    id: p.id,
    itemId: p.itemCusto.id,
    itemDescricao: p.itemCusto.descricao,
    aguardando: p.parcelas.filter((x) => x.aceite === "PENDENTE").map((x) => x.setor.nome),
  }));
}

export async function listarSetores() {
  const setores = await prisma.setor.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  return setores.map((s) => ({ valor: s.id, rotulo: s.nome }));
}
