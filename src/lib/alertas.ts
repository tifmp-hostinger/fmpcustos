import { prisma } from "@/lib/db";
import { formatarBRL } from "@/lib/dinheiro";
import type { Prisma } from "@/generated/prisma/client";
import type { StatusAlerta, TipoAlerta } from "@/generated/prisma/enums";

/**
 * GERAÇÃO DE ALERTAS
 *
 * O modelo `Alerta` existia desde o primeiro esquema e nunca teve uma linha. O
 * sistema inteiro dependia de alguém lembrar de abri-lo — e um sistema de custo
 * que só funciona quando lembram dele não funciona. Uma renovação passava
 * despercebida até o contrato já ter renovado sozinho por mais um ano.
 *
 * Três regras governam tudo o que está aqui.
 *
 * **Um alerta é uma frase com uma decisão dentro, não um aviso.** "Contrato
 * vence" não diz o que fazer nem quanto custa errar. "Antivírus corporativo
 * renova em 12 dias — R$ 1.240,00/mês; renovar sem decidir vale R$ 14.880,00 no
 * ano" diz as duas coisas. O título carrega o dinheiro porque é o dinheiro que
 * faz alguém parar.
 *
 * **Alerta que não se resolve sozinho vira cemitério.** Se preencher a data não
 * apagar o alerta de data faltando, a lista acumula coisas já resolvidas, as
 * pessoas param de ler, e o alerta que importa passa junto com o lixo. Toda
 * varredura fecha o que deixou de ser verdade — não é limpeza, é a condição para
 * a lista continuar sendo lida.
 *
 * **Repetir é o mesmo que não avisar.** A rotina roda todo dia; trinta dias
 * produziriam trinta alertas idênticos. Existe um alerta ABERTO de cada tipo por
 * custo, garantido por índice único parcial no banco — e a varredura ATUALIZA o
 * que já existe em vez de duplicar, para que a urgência suba conforme a data se
 * aproxima sem gerar linha nova.
 *
 * O que este módulo deliberadamente NÃO gera: REAJUSTE_ACIMA_INDICE,
 * VARIACAO_ANOMALA, ESTOURO_ORCAMENTO e LICENCA_OCIOSA. Os quatro dependem de
 * série de competências, orçamento aprovado e inventário de licenças — dados que
 * o sistema ainda não tem. Inventá-los a partir do cadastro daria alertas
 * plausíveis e falsos, que é a única coisa pior que alerta nenhum.
 */

const CORRENTES = ["ATIVO", "EM_ANALISE"] as const;
const ABERTOS: StatusAlerta[] = ["ABERTO", "RECONHECIDO"];

/** Faixas de aviso para renovação, da mais distante para a mais urgente. */
const FAIXAS = [
  { dias: 90, severidade: 2 },
  { dias: 60, severidade: 3 },
  { dias: 30, severidade: 4 },
  { dias: 7, severidade: 5 },
] as const;

export type Varredura = {
  criados: number;
  atualizados: number;
  resolvidos: number;
  porTipo: Record<string, number>;
};

type Proposto = {
  tipo: TipoAlerta;
  itemCustoId: string;
  titulo: string;
  descricao: string | null;
  severidade: number;
  referencia: Date | null;
};

export function hojeUTC(): Date {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  return hoje;
}

function emDias(data: Date): number {
  return Math.round((data.getTime() - hojeUTC().getTime()) / 86_400_000);
}

const porMes = (v: Prisma.Decimal | null) => (v === null ? null : formatarBRL(v));

/**
 * Varre o cadastro e sincroniza os alertas com o que é verdade AGORA.
 *
 * Devolve o que fez em cada categoria — a rotina que a chama registra isso, e um
 * número que muda sem explicação é a primeira coisa que se olha quando alguém
 * pergunta por que recebeu (ou por que não recebeu) um e-mail.
 */
export async function varrerAlertas(): Promise<Varredura> {
  const propostos = [
    ...(await renovacoes()),
    ...(await dadosIncompletos()),
    ...(await cambiosAusentes()),
    ...(await rateiosIncompletos()),
  ];

  const existentes = await prisma.alerta.findMany({
    where: { status: { in: ABERTOS }, itemCustoId: { not: null } },
    select: {
      id: true,
      tipo: true,
      itemCustoId: true,
      titulo: true,
      descricao: true,
      severidade: true,
      referencia: true,
    },
  });

  const chave = (tipo: string, itemId: string) => `${tipo} ${itemId}`;
  const propostosPorChave = new Map(propostos.map((a) => [chave(a.tipo, a.itemCustoId), a]));
  const existentesPorChave = new Map(
    existentes.map((a) => [chave(a.tipo, a.itemCustoId!), a] as const),
  );

  const resultado: Varredura = { criados: 0, atualizados: 0, resolvidos: 0, porTipo: {} };

  // 1. O que deixou de ser verdade é fechado. Primeiro na ordem, porque é o que
  //    mantém a lista legível — e uma lista que ninguém lê não avisa nada.
  const obsoletos = existentes.filter((a) => !propostosPorChave.has(chave(a.tipo, a.itemCustoId!)));
  if (obsoletos.length > 0) {
    await prisma.alerta.updateMany({
      where: { id: { in: obsoletos.map((a) => a.id) } },
      data: { status: "RESOLVIDO", resolvidoEm: new Date(), resolvidoPor: "rotina" },
    });
    resultado.resolvidos = obsoletos.length;
  }

  // 2. O que já existe é atualizado no lugar: a urgência sobe conforme a data se
  //    aproxima, sem produzir uma segunda linha dizendo quase a mesma coisa.
  for (const proposto of propostos) {
    const atual = existentesPorChave.get(chave(proposto.tipo, proposto.itemCustoId));
    resultado.porTipo[proposto.tipo] = (resultado.porTipo[proposto.tipo] ?? 0) + 1;

    if (!atual) {
      await prisma.alerta.create({ data: proposto });
      resultado.criados++;
      continue;
    }

    const mudou =
      atual.titulo !== proposto.titulo ||
      atual.descricao !== proposto.descricao ||
      atual.severidade !== proposto.severidade;
    if (!mudou) continue;

    await prisma.alerta.update({
      where: { id: atual.id },
      data: {
        titulo: proposto.titulo,
        descricao: proposto.descricao,
        severidade: proposto.severidade,
        referencia: proposto.referencia,
        // Um alerta que subiu de urgência volta a ser ABERTO mesmo se já tinha
        // sido reconhecido: "vi, depois eu cuido" vale para 60 dias e não vale
        // para 7. Reabrir é a única forma de dizer que a situação mudou.
        ...(proposto.severidade > atual.severidade ? { status: "ABERTO" as const } : {}),
      },
    });
    resultado.atualizados++;
  }

  return resultado;
}

/** Contratos que vencem ou renovam dentro de 90 dias. */
async function renovacoes(): Promise<Proposto[]> {
  const hoje = hojeUTC();
  const limite = new Date(hoje);
  limite.setUTCDate(limite.getUTCDate() + 90);

  const itens = await prisma.itemCusto.findMany({
    where: {
      excluidoEm: null,
      status: { in: [...CORRENTES] },
      dataFim: { not: null, gte: hoje, lte: limite },
    },
    select: {
      id: true,
      descricao: true,
      dataFim: true,
      valorMensalNormalizado: true,
      fornecedor: { select: { nome: true } },
    },
  });

  return itens.map((item) => {
    const dias = emDias(item.dataFim!);
    const faixa = FAIXAS.reduce((atual, f) => (dias <= f.dias ? f : atual), FAIXAS[0]);
    const mensal = porMes(item.valorMensalNormalizado);
    const anual = item.valorMensalNormalizado
      ? formatarBRL(item.valorMensalNormalizado.mul(12))
      : null;

    return {
      tipo: "RENOVACAO_PROXIMA" as const,
      itemCustoId: item.id,
      titulo:
        dias === 0
          ? `${item.descricao} vence hoje`
          : `${item.descricao} renova em ${dias} ${dias === 1 ? "dia" : "dias"}`,
      // O custo de deixar passar, em número: é o que transforma "vence" numa
      // decisão em vez de num aviso.
      descricao: [
        item.fornecedor?.nome,
        mensal && `${mensal} por mês`,
        anual && `renovar sem decidir vale ${anual} no ano`,
        `vence em ${item.dataFim!.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`,
      ]
        .filter(Boolean)
        .join(" · "),
      severidade: faixa.severidade,
      referencia: item.dataFim,
    };
  });
}

/** Itens em jogo com lacuna que impede o número de estar completo. */
async function dadosIncompletos(): Promise<Proposto[]> {
  const itens = await prisma.itemCusto.findMany({
    where: {
      excluidoEm: null,
      status: { in: [...CORRENTES, "PENDENTE_APURACAO"] },
      OR: [
        { valorPeriodo: null },
        { dataFim: null, semPrazoDeterminado: false },
        { categoriaId: null },
      ],
    },
    select: {
      id: true,
      descricao: true,
      valorPeriodo: true,
      dataFim: true,
      semPrazoDeterminado: true,
      categoriaId: true,
    },
  });

  return itens.map((item) => {
    // Uma linha por item, listando o que falta — e não uma linha por lacuna.
    // Três alertas sobre o mesmo contrato ensinam a ignorar os três.
    const faltas: string[] = [];
    const consequencias: string[] = [];

    if (item.valorPeriodo === null) {
      faltas.push("o valor");
      consequencias.push("não entra em nenhuma soma");
    }
    if (item.dataFim === null && !item.semPrazoDeterminado) {
      faltas.push("a data de renovação");
      consequencias.push("nunca vai gerar alerta de renovação");
    }
    if (item.categoriaId === null) {
      faltas.push("a categoria");
      consequencias.push("some do agrupamento por tipo");
    }

    return {
      tipo: "DADO_INCOMPLETO" as const,
      itemCustoId: item.id,
      titulo: `${item.descricao} está sem ${listar(faltas)}`,
      descricao: `Enquanto ficar assim, ${listar(consequencias)}.`,
      // Sem valor pesa mais que sem categoria: um tira o item do total, o outro
      // só o tira de um gráfico.
      severidade: item.valorPeriodo === null ? 3 : 2,
      referencia: null,
    };
  });
}

/** Moeda estrangeira sem cotação: o custo existe e não é somado por ninguém. */
async function cambiosAusentes(): Promise<Proposto[]> {
  const itens = await prisma.itemCusto.findMany({
    where: {
      excluidoEm: null,
      status: { in: [...CORRENTES] },
      moeda: { not: "BRL" },
      cambio: null,
      valorPeriodo: { not: null },
    },
    select: { id: true, descricao: true, moeda: true },
  });

  return itens.map((item) => ({
    tipo: "CAMBIO_AUSENTE" as const,
    itemCustoId: item.id,
    titulo: `${item.descricao} está em ${item.moeda} sem cotação`,
    descricao:
      "O valor está cadastrado e o custo não entra em nenhum total até que a taxa seja informada.",
    // A mais alta das pendências de cadastro: as outras deixam o item
    // incompleto, esta deixa o total da FMP incompleto sem parecer que falta nada.
    severidade: 4,
    referencia: null,
  }));
}

/** Custo sem dono, ou dividido de um jeito que não fecha 100%. */
async function rateiosIncompletos(): Promise<Proposto[]> {
  const itens = await prisma.itemCusto.findMany({
    where: { excluidoEm: null, status: { in: [...CORRENTES] } },
    select: {
      id: true,
      descricao: true,
      valorMensalNormalizado: true,
      rateios: { where: { vigenciaFim: null }, select: { percentual: true } },
    },
  });

  const propostos: Proposto[] = [];
  for (const item of itens) {
    const mensal = porMes(item.valorMensalNormalizado);

    if (item.rateios.length === 0) {
      propostos.push({
        tipo: "RATEIO_INCOMPLETO",
        itemCustoId: item.id,
        titulo: `${item.descricao} não tem setor responsável`,
        descricao: [mensal && `${mensal}/mês`, "ninguém responde por este custo"]
          .filter(Boolean)
          .join(" · "),
        severidade: 4,
        referencia: null,
      });
      continue;
    }

    const soma = item.rateios.reduce((s, r) => s + Number(r.percentual), 0);
    // Tolerância de um centésimo: um terço para três setores é 33,33 + 33,33 +
    // 33,34, e cobrar exatidão binária daria alerta em rateio correto.
    if (Math.abs(soma - 100) <= 0.01) continue;

    const diferenca = Math.abs(soma - 100)
      .toFixed(2)
      .replace(".", ",");
    propostos.push({
      tipo: "RATEIO_INCOMPLETO",
      itemCustoId: item.id,
      titulo: `O rateio de ${item.descricao} soma ${soma.toFixed(2).replace(".", ",")}%, não 100%`,
      descricao:
        soma < 100
          ? `Falta alocar ${diferenca}% — essa parte não aparece em nenhum setor.`
          : `Há ${diferenca}% a mais — a soma dos setores excede o custo real.`,
      severidade: 4,
      referencia: null,
    });
  }
  return propostos;
}

/** "o valor, a data e a categoria" — em vez de "o valor, a data, a categoria". */
function listar(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}

export const ROTULO_TIPO: Record<TipoAlerta, string> = {
  RENOVACAO_PROXIMA: "Renovação próxima",
  REAJUSTE_ACIMA_INDICE: "Reajuste acima do índice",
  ESTOURO_ORCAMENTO: "Estouro de orçamento",
  VARIACAO_ANOMALA: "Variação anômala",
  LICENCA_OCIOSA: "Licença ociosa",
  DADO_INCOMPLETO: "Dado incompleto",
  RATEIO_INCOMPLETO: "Rateio incompleto",
  CAMBIO_AUSENTE: "Sem cotação",
};
