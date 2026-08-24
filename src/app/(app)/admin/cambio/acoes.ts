"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { derivados, formatarCambio } from "@/lib/dinheiro";
import {
  cambio,
  dataOpcional,
  falha,
  opcaoValida,
  sucesso,
  texto,
  textoOpcional,
  valoresDigitados,
  type Resultado,
} from "@/lib/acoes";
import type { Moeda } from "@/generated/prisma/enums";

const ESTRANGEIRAS = ["USD", "EUR"] as const;

/**
 * Registra a cotação de referência de uma moeda.
 *
 * O que esta ação NÃO faz é o ponto: ela não toca em nenhum custo já cadastrado.
 * Registrar o dólar de hoje não reescreve o total do mês passado — a taxa de
 * cada custo está gravada nele. Atualizar um custo para a cotação nova é outro
 * botão, com outra intenção e outro registro no histórico.
 */
export async function registrarCotacao(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const admin = await exigirAdmin();
  const digitado = valoresDigitados(dados);

  const moeda = opcaoValida<Moeda>(dados, "moeda", ESTRANGEIRAS);
  if (!moeda) return falha("Escolha a moeda.", digitado, "moeda");

  const bruto = texto(dados, "taxa");
  const taxa = cambio(dados, "taxa");
  if (taxa === null) {
    return falha(
      bruto
        ? `Não consegui ler «${bruto}» como cotação. Escreva no formato 5,4321.`
        : "Informe a cotação.",
      digitado,
      "taxa",
    );
  }

  const data = dataOpcional(dados, "data") ?? hojeUTC();
  const amanha = hojeUTC();
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  // Cotação futura seria uma previsão com cara de fato. Quem converte pelo dólar
  // de amanhã está inventando o número, não registrando-o.
  if (data >= amanha) return falha("A cotação não pode ser de uma data futura.", digitado, "data");

  const fonte = textoOpcional(dados, "fonte")?.slice(0, 120) ?? null;

  // Mesma moeda, mesma data: corrige em vez de duplicar. Duas cotações do mesmo
  // dia obrigariam o resto do sistema a escolher uma, e essa escolha seria
  // arbitrária em silêncio.
  await prisma.cotacaoMoeda.upsert({
    where: { moeda_data: { moeda, data } },
    create: { moeda, data, taxa, fonte, registradoPorId: admin.id },
    update: { taxa, fonte, registradoPorId: admin.id },
  });

  revalidatePath("/admin/cambio");
  revalidatePath("/custos/novo");

  return sucesso(
    `1 ${moeda} = ${formatarCambio(taxa)} em ${data.toLocaleDateString("pt-BR", { timeZone: "UTC" })}.`,
    {
      detalhe: "Vale como sugestão para novos custos. Nenhum custo já cadastrado mudou.",
    },
  );
}

/**
 * Aplica a cotação de referência aos custos que ainda estão sem taxa.
 *
 * Deliberadamente só alcança quem NÃO tem câmbio: um custo já convertido tem uma
 * taxa que alguém escolheu — provavelmente a da fatura — e sobrescrevê-la em
 * lote seria trocar o que a FMP pagou pelo que o Banco Central publicou. O que
 * esta ação resolve é o buraco: itens fora de todo total por falta de número.
 */
export async function converterPendentes(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const admin = await exigirAdmin();

  const moeda = opcaoValida<Moeda>(dados, "moeda", ESTRANGEIRAS);
  if (!moeda) return falha("Escolha a moeda.");

  const cotacao = await prisma.cotacaoMoeda.findFirst({
    where: { moeda },
    orderBy: { data: "desc" },
  });
  if (!cotacao) return falha(`Nenhuma cotação de ${moeda} registrada ainda.`);

  const pendentes = await prisma.itemCusto.findMany({
    where: { moeda, cambio: null, excluidoEm: null, valorPeriodo: { not: null } },
    select: { id: true, descricao: true, valorPeriodo: true, periodicidade: true },
  });
  if (pendentes.length === 0) {
    return falha(`Nenhum custo em ${moeda} está sem cotação.`);
  }

  const taxa = cotacao.taxa.toString();

  await prisma.$transaction(async (tx) => {
    for (const item of pendentes) {
      const valores = derivados(item.valorPeriodo, item.periodicidade, moeda, taxa);
      await tx.itemCusto.update({
        where: { id: item.id },
        data: {
          cambio: taxa,
          cambioEm: cotacao.data,
          ...valores,
        },
      });
      await tx.auditoria.create({
        data: {
          tabela: "item_custo",
          registroId: item.id,
          acao: "ALTERACAO",
          usuarioId: admin.id,
          diff: {
            antes: { cambio: null },
            depois: { cambio: taxa, cambioEm: cotacao.data.toISOString().slice(0, 10) },
          },
        },
      });
    }
  });

  revalidatePath("/admin/cambio");
  revalidatePath("/custos");
  revalidatePath("/");

  return sucesso(
    `${pendentes.length} ${pendentes.length === 1 ? "custo passou" : "custos passaram"} a contar nos totais.`,
    {
      detalhe: `Convertidos a ${formatarCambio(taxa)} de ${cotacao.data.toLocaleDateString("pt-BR", { timeZone: "UTC" })}. Cada um pode ser ajustado individualmente para a taxa da própria fatura.`,
    },
  );
}

function hojeUTC(): Date {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  return hoje;
}
