import { prisma } from "@/lib/db";
import type { Prisma, StatusItem } from "@/generated/prisma/client";
import { setoresVisiveis, type UsuarioSessao } from "@/lib/sessao";
import {
  RECORTES,
  SITUACOES,
  anoEfetivo,
  faltasDe,
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
 *
 * ATENÇÃO: o retorno tem uma chave `AND`. Espalhá-lo num objeto que também
 * define `AND` apaga o escopo inteiro em silêncio — nenhum erro, nenhum aviso,
 * só todo mundo enxergando tudo. Use `comEscopo` sempre que houver mais de um
 * filtro; espalhar só é seguro quando a única outra chave é `id`.
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

/**
 * Junta o escopo do usuário com os filtros da consulta.
 *
 * Existe por causa de um defeito que passou por uma revisão inteira sem ser
 * visto: `{ ...escopoDeItens(usuario), AND: partes }` parece combinar as duas
 * coisas e não combina — a segunda chave `AND` apaga a primeira, e com ela o
 * escopo de setor. O efeito era um gestor de TI abrindo a lista e enxergando os
 * contratos e os valores dos treze setores.
 *
 * Aqui o escopo entra como mais um elemento do `AND`, e não como um espalhamento
 * no mesmo nível. Não há chave para colidir: acrescentar um filtro novo não tem
 * como derrubar a permissão.
 */
export function comEscopo(
  usuario: UsuarioSessao,
  partes: Prisma.ItemCustoWhereInput[],
  lixeira: "fora" | "dentro" | "ambos" = "fora",
  incluirPropostas = false,
): Prisma.ItemCustoWhereInput {
  return { AND: [escopoDeItens(usuario, lixeira, incluirPropostas), ...partes] };
}

/**
 * As categorias que podem ser escolhidas.
 *
 * Só as ativas — inativar uma categoria precisa de fato tirá-la das listas de
 * escolha, senão a ação promete uma coisa e a tela mostra outra.
 *
 * `manter` é o que impede a inativação de reclassificar custos por acidente:
 * ao editar um custo que está numa categoria inativa, ela precisa continuar no
 * seletor. Sem isso o `<select>` chega sem o valor atual, marca a primeira
 * opção, e salvar — mesmo sem tocar no campo — mudaria a classificação em
 * silêncio.
 */
export async function listarCategorias(manter?: string | null) {
  const categorias = await prisma.categoria.findMany({
    where: manter ? { OR: [{ ativo: true }, { id: manter }] } : { ativo: true },
    select: { id: true, nome: true, ativo: true, categoriaPai: { select: { nome: true } } },
    orderBy: [{ categoriaPai: { nome: "asc" } }, { nome: "asc" }],
  });
  return categorias.map((c) => ({
    valor: c.id,
    rotulo:
      (c.categoriaPai ? `${c.categoriaPai.nome} › ${c.nome}` : c.nome) +
      // A etiqueta é o aviso de que aquela opção não é oferecida a mais
      // ninguém: quem editar o custo decide se troca ou mantém.
      (c.ativo ? "" : " (inativa)"),
  }));
}

/**
 * A cotação mais recente de cada moeda estrangeira.
 *
 * O formulário usa isto para SUGERIR a taxa — nunca para aplicá-la sozinho num
 * item já salvo. É a diferença entre "treze setores digitam treze dólares
 * diferentes" e "o total de junho muda quando o dólar mexe em agosto": a
 * cotação central resolve o primeiro problema sem criar o segundo.
 */
export async function cotacoesMaisRecentes(): Promise<
  Record<string, { taxa: string; data: string; fonte: string | null }>
> {
  const cotacoes = await prisma.cotacaoMoeda.findMany({
    where: { moeda: { not: "BRL" } },
    orderBy: [{ moeda: "asc" }, { data: "desc" }],
    select: { moeda: true, taxa: true, data: true, fonte: true },
  });

  const recentes: Record<string, { taxa: string; data: string; fonte: string | null }> = {};
  for (const c of cotacoes) {
    // A consulta já vem ordenada por data decrescente: a primeira de cada moeda
    // é a mais nova, e as seguintes são histórico.
    if (recentes[c.moeda]) continue;
    recentes[c.moeda] = {
      taxa: c.taxa.toString(),
      data: c.data.toISOString().slice(0, 10),
      fonte: c.fonte,
    };
  }
  return recentes;
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

/** Os setores que podem ser escolhidos. Mesma regra de `manter` das categorias. */
export async function listarSetores(manter?: string | null) {
  const setores = await prisma.setor.findMany({
    where: manter ? { OR: [{ ativo: true }, { id: manter }] } : { ativo: true },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: "asc" },
  });
  return setores.map((s) => ({
    valor: s.id,
    rotulo: s.ativo ? s.nome : `${s.nome} (inativo)`,
  }));
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
      //
      // E a cobrança só vale para o que RENOVA. Uma compra avulsa não tem data
      // de renovação por definição — exigi-la marcava toda compra pontual como
      // incompleta para sempre, e gerava um alerta que ninguém conseguiria
      // resolver a não ser inventando uma data.
      return {
        natureza: { in: ["RECORRENTE", "PESSOAL"] },
        dataFim: null,
        semPrazoDeterminado: false,
      };
    case "aquisicao":
      // O espelho da regra acima: para o que aconteceu uma vez, a data que
      // importa é a de quando aconteceu. Sem ela o item não entra em nenhum
      // recorte de ano e some do total do exercício.
      return { natureza: { in: ["PONTUAL", "CAPEX"] }, dataInicio: null };
    case "categoria":
      return { categoriaId: null };
    case "fornecedor":
      return { fornecedorId: null };
    case "cambio":
      // Moeda estrangeira sem taxa: o valor está lá, o real não existe.
      return { moeda: { not: "BRL" }, cambio: null };
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
export function whereDaLista(
  f: Filtros,
  usuario: UsuarioSessao,
  /** Ano corrente, para as abas que medem período. Ver `anoEfetivo`. */
  anoAtual = new Date().getUTCFullYear(),
): Prisma.ItemCustoWhereInput {
  const partes: Prisma.ItemCustoWhereInput[] = [];
  const situacao = SITUACOES.find((s) => s.chave === f.situacao)!;
  const recorte = RECORTES.find((r) => r.chave === f.natureza)!;

  // A natureza entra antes de tudo: ela não é um filtro entre outros, é o que a
  // página é. Somar assinatura mensal com compra avulsa numa coluna só não é
  // desorganização — é aritmética errada com aparência de relatório.
  if (recorte.naturezas) partes.push({ natureza: { in: [...recorte.naturezas] } });

  const ano = anoEfetivo(f, anoAtual);
  if (ano) {
    // O que aconteceu uma vez se mede por QUANDO aconteceu. `dataInicio` é a
    // data do fato; o item sem data fica de fora do exercício, e é por isso que
    // "sem data de aquisição" é uma pendência própria.
    partes.push({
      dataInicio: {
        gte: new Date(Date.UTC(Number(ano), 0, 1)),
        lt: new Date(Date.UTC(Number(ano) + 1, 0, 1)),
      },
    });
  }

  if (situacao.status) partes.push({ status: { in: [...situacao.status] } });

  if (f.situacao === "pendencia") {
    partes.push({ status: { in: STATUS_EM_JOGO } });
    partes.push(
      f.falta ? faltando(f.falta) : { OR: faltasDe(f.natureza).map((x) => faltando(x.chave)) },
    );
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

  return comEscopo(usuario, partes, f.situacao === "lixeira" ? "dentro" : "fora");
}
