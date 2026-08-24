import { prisma } from "@/lib/db";
import type { Prisma, StatusItem } from "@/generated/prisma/client";
import { setoresVisiveis, type UsuarioSessao } from "@/lib/sessao";
import {
  FALTAS,
  SITUACOES,
  SEM_CATEGORIA,
  SEM_FORNECEDOR,
  SEM_SETOR,
  type Filtros,
} from "@/lib/filtros";

/**
 * Filtro de itens de custo respeitando o escopo de setor do usuário.
 * Só rateios VIGENTES contam: um item transferido para outro setor (rateio
 * antigo com vigenciaFim preenchida) deixa de pertencer ao setor de origem.
 *
 * `lixeira` escolhe de que lado da exclusão reversível se está olhando. O
 * padrão exclui os itens na lixeira de toda consulta do sistema — item que a
 * pessoa acabou de excluir não pode continuar aparecendo em lista nem somando
 * em painel.
 */
export function escopoDeItens(
  usuario: UsuarioSessao,
  lixeira: "fora" | "dentro" | "ambos" = "fora",
  /**
   * Inclui os custos em que o setor da pessoa tem uma fatia PROPOSTA, ainda não
   * aceita. Sem isso, o gestor que recebe uma proposta não consegue abrir o
   * custo para decidir: ele não é dono de nenhuma fatia vigente, então o item
   * fica fora do escopo dele e a página responde 404 — inclusive pelo link do
   * próprio cartão de aceite, na tela inicial. Pedir uma decisão sobre algo que
   * a pessoa não pode nem abrir é o oposto de fluido.
   */
  incluirPropostas = false,
) {
  const exclusao =
    lixeira === "fora"
      ? { excluidoEm: null }
      : lixeira === "dentro"
        ? { excluidoEm: { not: null } }
        : {};

  const setores = setoresVisiveis(usuario);
  if (setores === null) return exclusao;

  const caminhos: Prisma.ItemCustoWhereInput[] = [
    { rateios: { some: { setorId: { in: setores }, vigenciaFim: null } } },
  ];
  if (incluirPropostas) {
    caminhos.push({
      propostas: {
        some: { status: "PENDENTE", parcelas: { some: { setorId: { in: setores } } } },
      },
    });
  }

  // `AND` em vez de `OR` no topo: quem chama acrescenta o próprio `OR` (a busca
  // por texto, por exemplo), e dois `OR` no mesmo objeto fariam um sobrescrever
  // o outro — o escopo de setor sumiria em silêncio na primeira busca.
  return { ...exclusao, AND: [{ OR: caminhos }] };
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

/** Só entra em "falta dado" o que ainda está em jogo. */
const STATUS_EM_JOGO: StatusItem[] = ["ATIVO", "EM_ANALISE", "PENDENTE_APURACAO"];

function faltando(chave: string): Prisma.ItemCustoWhereInput {
  switch (chave) {
    case "valor":
      return { valorPeriodo: null };
    case "data":
      // "Sem prazo determinado" é uma resposta, não uma lacuna: quem marcou
      // isso já resolveu a pendência e não pode continuar sendo cobrado.
      return { dataFim: null, semPrazoDeterminado: false };
    case "categoria":
      return { categoriaId: null };
    case "fornecedor":
      return { fornecedorId: null };
    default:
      return {};
  }
}

/**
 * O `where` da lista — a definição única do que cada recorte significa.
 *
 * Os pedaços entram por `AND` porque `escopoDeItens` já usa `OR` para o escopo
 * de setor e a busca usa `OR` para os campos de texto: dois `OR` no mesmo
 * objeto fariam um sobrescrever o outro em silêncio.
 */
export function whereDaLista(f: Filtros, usuario: UsuarioSessao): Prisma.ItemCustoWhereInput {
  const partes: Prisma.ItemCustoWhereInput[] = [];
  const situacao = SITUACOES.find((s) => s.chave === f.situacao)!;

  if (situacao.status) partes.push({ status: { in: [...situacao.status] } });

  if (f.situacao === "pendencia") {
    partes.push({ status: { in: STATUS_EM_JOGO } });
    partes.push(f.falta ? faltando(f.falta) : { OR: FALTAS.map((x) => faltando(x.chave)) });
  }

  if (f.situacao === "renovacao") {
    // Truncado para o início do dia em UTC: `dataFim` é @db.Date, e comparar
    // com o horário corrente faria a renovação sumir no dia em que ela vence.
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setUTCDate(limite.getUTCDate() + 90);
    partes.push({
      status: { in: ["ATIVO", "EM_ANALISE"] },
      dataFim: { not: null, gte: hoje, lte: limite },
    });
  }

  if (f.setor) {
    partes.push(
      f.setor === SEM_SETOR
        ? { rateios: { none: { vigenciaFim: null } } }
        : { rateios: { some: { setorId: f.setor, vigenciaFim: null } } },
    );
  }
  if (f.categoria) {
    partes.push(
      f.categoria === SEM_CATEGORIA ? { categoriaId: null } : { categoriaId: f.categoria },
    );
  }
  if (f.fornecedor) {
    partes.push(
      f.fornecedor === SEM_FORNECEDOR ? { fornecedorId: null } : { fornecedorId: f.fornecedor },
    );
  }

  if (f.busca) {
    partes.push({
      OR: [
        { descricao: { contains: f.busca, mode: "insensitive" } },
        { fornecedor: { nome: { contains: f.busca, mode: "insensitive" } } },
        { categoria: { nome: { contains: f.busca, mode: "insensitive" } } },
        { observacoes: { contains: f.busca, mode: "insensitive" } },
      ],
    });
  }

  return {
    ...escopoDeItens(usuario, f.situacao === "lixeira" ? "dentro" : "fora"),
    ...(partes.length > 0 ? { AND: partes } : {}),
  };
}
