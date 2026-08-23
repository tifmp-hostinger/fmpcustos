"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { valorMensalNormalizado } from "@/lib/dinheiro";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import {
  dataOpcional,
  dinheiro,
  falha,
  inteiroOpcional,
  texto,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import type {
  ComportamentoCusto,
  Moeda,
  Natureza,
  Periodicidade,
  StatusItem,
} from "@/generated/prisma/enums";

/** Setor que o usuário pode usar no lançamento. Gestor só lança para o próprio. */
async function setorDoLancamento(
  papel: Parameters<typeof vePorInteiro>[0],
  setorDoUsuario: string | null,
  setorEscolhido: string | null,
): Promise<string | null> {
  if (vePorInteiro(papel)) return setorEscolhido ?? setorDoUsuario;
  return setorDoUsuario;
}

/** Reaproveita o fornecedor pelo nome, ou cria — sem obrigar cadastro prévio. */
async function acharOuCriarFornecedor(nome: string): Promise<string> {
  const existente = await prisma.fornecedor.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (existente) return existente.id;

  const criado = await prisma.fornecedor.create({
    data: { nome },
    select: { id: true },
  });
  return criado.id;
}

type Campos = {
  descricao: string;
  fornecedor: string;
  categoriaId: string | null;
  natureza: Natureza;
  periodicidade: Periodicidade;
  comportamento: ComportamentoCusto;
  moeda: Moeda;
  status: StatusItem;
  valorPeriodo: string | null;
  quantidade: number | null;
  valorUnitario: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  observacoes: string | null;
  setorId: string | null;
};

function lerCampos(dados: FormData): Campos {
  return {
    descricao: texto(dados, "descricao"),
    fornecedor: texto(dados, "fornecedor"),
    categoriaId: textoOpcional(dados, "categoriaId"),
    natureza: (texto(dados, "natureza") || "RECORRENTE") as Natureza,
    periodicidade: (texto(dados, "periodicidade") || "MENSAL") as Periodicidade,
    comportamento: (texto(dados, "comportamento") || "FIXO") as ComportamentoCusto,
    moeda: (texto(dados, "moeda") || "BRL") as Moeda,
    status: (texto(dados, "status") || "ATIVO") as StatusItem,
    valorPeriodo: dinheiro(dados, "valorPeriodo"),
    quantidade: inteiroOpcional(dados, "quantidade"),
    valorUnitario: dinheiro(dados, "valorUnitario"),
    dataInicio: dataOpcional(dados, "dataInicio"),
    dataFim: dataOpcional(dados, "dataFim"),
    observacoes: textoOpcional(dados, "observacoes"),
    setorId: textoOpcional(dados, "setorId"),
  };
}

function validar(campos: Campos): string | null {
  if (!campos.descricao) return "Descreva o custo.";
  if (!campos.fornecedor) return "Informe o fornecedor.";
  if (campos.valorPeriodo === null && campos.status !== "PENDENTE_APURACAO") {
    return "Informe o valor, ou marque o status como “Valor a apurar”.";
  }
  if (campos.dataInicio && campos.dataFim && campos.dataFim < campos.dataInicio) {
    return "A data de término é anterior à de início.";
  }
  return null;
}

export async function salvarCusto(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) return falha("Seu perfil não permite lançar custos.");

  const id = textoOpcional(dados, "id");
  const campos = lerCampos(dados);

  const problema = validar(campos);
  if (problema) return falha(problema);

  const setorId = await setorDoLancamento(usuario.papel, usuario.setorId, campos.setorId);
  if (!setorId) {
    return falha("Seu usuário não está vinculado a um setor. Peça ao administrador.");
  }

  // Quem não vê por inteiro só mexe no que é do próprio setor.
  if (id && !vePorInteiro(usuario.papel)) {
    const permitido = await prisma.itemCusto.count({
      where: { id, rateios: { some: { setorId } } },
    });
    if (permitido === 0) return falha("Este custo é de outro setor.");
  }

  const fornecedorId = await acharOuCriarFornecedor(campos.fornecedor);
  const mensal = valorMensalNormalizado(campos.valorPeriodo, campos.periodicidade);

  const comuns = {
    descricao: campos.descricao,
    fornecedorId,
    categoriaId: campos.categoriaId,
    natureza: campos.natureza,
    periodicidade: campos.periodicidade,
    comportamento: campos.comportamento,
    moeda: campos.moeda,
    status: campos.status,
    valorPeriodo: campos.valorPeriodo,
    quantidade: campos.quantidade,
    valorUnitario: campos.valorUnitario,
    valorMensalNormalizado: mensal ? mensal.toFixed(2) : null,
    dataInicio: campos.dataInicio,
    dataFim: campos.dataFim,
    observacoes: campos.observacoes,
  };

  const anterior = id
    ? await prisma.itemCusto.findUnique({ where: { id } })
    : null;

  const item = id
    ? await prisma.itemCusto.update({ where: { id }, data: comuns })
    : await prisma.itemCusto.create({
        data: { ...comuns, criadoPorId: usuario.id },
      });

  // Rateio: 100% no setor responsável. O rateio entre setores é ajustado depois,
  // por quem tem essa autoridade — mas o custo nunca fica sem dono.
  const rateioExistente = await prisma.rateio.findFirst({
    where: { itemCustoId: item.id, vigenciaFim: null },
  });
  if (!rateioExistente) {
    await prisma.rateio.create({
      data: {
        itemCustoId: item.id,
        setorId,
        metodo: "PERCENTUAL",
        percentual: "100",
        vigenciaInicio: campos.dataInicio ?? new Date(),
      },
    });
  } else if (rateioExistente.setorId !== setorId && vePorInteiro(usuario.papel)) {
    await prisma.rateio.update({
      where: { id: rateioExistente.id },
      data: { setorId },
    });
  }

  await prisma.auditoria.create({
    data: {
      tabela: "item_custo",
      registroId: item.id,
      acao: id ? "ALTERACAO" : "CRIACAO",
      usuarioId: usuario.id,
      diff: { antes: anterior ? JSON.parse(JSON.stringify(anterior)) : null, depois: JSON.parse(JSON.stringify(item)) },
    },
  });

  revalidatePath("/custos");
  revalidatePath("/");
  redirect("/custos");
}

export async function excluirCusto(dados: FormData): Promise<void> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!podeLancar(usuario.papel) || !id) redirect("/custos");

  if (!vePorInteiro(usuario.papel)) {
    const permitido = await prisma.itemCusto.count({
      where: { id, rateios: { some: { setorId: usuario.setorId ?? "" } } },
    });
    if (permitido === 0) redirect("/custos");
  }

  const anterior = await prisma.itemCusto.findUnique({ where: { id } });
  await prisma.itemCusto.delete({ where: { id } });
  await prisma.auditoria.create({
    data: {
      tabela: "item_custo",
      registroId: id,
      acao: "EXCLUSAO",
      usuarioId: usuario.id,
      diff: { antes: anterior ? JSON.parse(JSON.stringify(anterior)) : null, depois: null },
    },
  });

  revalidatePath("/custos");
  revalidatePath("/");
  redirect("/custos");
}
