"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { rateioFecha } from "@/lib/dinheiro";
import { exigirSessao, podeLancar, vePorInteiro, type UsuarioSessao } from "@/lib/sessao";
import { falha, texto, textoOpcional, type Resultado } from "@/lib/acoes";

type Parcela = { setorId: string; percentual: Decimal };
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Lê as linhas setor+percentual do formulário (setor_0/pct_0, setor_1/pct_1…). */
function lerParcelas(dados: FormData): Parcela[] | string {
  const parcelas: Parcela[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < 13; i++) {
    const setorId = texto(dados, `setor_${i}`);
    const pctTexto = texto(dados, `pct_${i}`).replace(",", ".");
    if (!setorId && !pctTexto) continue;
    if (!setorId) return "Escolha o setor de todas as linhas preenchidas.";

    const pct = Number(pctTexto);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return "Cada percentual precisa estar entre 0 e 100.";
    }
    if (vistos.has(setorId)) return "O mesmo setor aparece em duas linhas.";
    vistos.add(setorId);
    parcelas.push({ setorId, percentual: new Decimal(pct.toFixed(2)) });
  }

  if (parcelas.length === 0) return "Informe ao menos uma linha de rateio.";
  if (!rateioFecha(parcelas.map((p) => p.percentual))) {
    const soma = parcelas.reduce((s, p) => s.plus(p.percentual), new Decimal(0));
    return `Os percentuais precisam somar 100% — estão em ${soma.toFixed(2)}%.`;
  }
  return parcelas;
}

/** O gestor pode propor quando o custo é inteiramente (100%) da área dele. */
async function podePropor(usuario: UsuarioSessao, itemId: string): Promise<boolean> {
  if (vePorInteiro(usuario.papel)) return true;
  if (!podeLancar(usuario.papel) || !usuario.setorId) return false;
  const dono = await prisma.itemCusto.count({
    where: {
      id: itemId,
      rateios: { some: { setorId: usuario.setorId, vigenciaFim: null, percentual: 100 } },
    },
  });
  return dono > 0;
}

/** Encerra os rateios vigentes e aplica as parcelas como rateio novo. */
async function aplicarParcelas(
  tx: Tx,
  itemId: string,
  parcelas: Array<{ setorId: string; percentual: string }>,
  aprovadoPor: string,
) {
  const hoje = new Date();
  await tx.rateio.updateMany({
    where: { itemCustoId: itemId, vigenciaFim: null },
    data: { vigenciaFim: hoje },
  });
  for (const p of parcelas) {
    await tx.rateio.create({
      data: {
        itemCustoId: itemId,
        setorId: p.setorId,
        metodo: "PERCENTUAL",
        percentual: p.percentual,
        vigenciaInicio: hoje,
        aprovadoPor,
        aprovadoEm: hoje,
      },
    });
  }
}

export async function proporRateio(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  const itemId = texto(dados, "itemId");
  const justificativa = textoOpcional(dados, "justificativa")?.slice(0, 1000) ?? null;

  if (!itemId) return falha("Custo não informado.");
  if (!(await podePropor(usuario, itemId))) {
    return falha("Você só pode propor rateio de um custo que hoje é inteiramente da sua área.");
  }

  const parcelas = lerParcelas(dados);
  if (typeof parcelas === "string") return falha(parcelas);

  const pendente = await prisma.propostaRateio.count({
    where: { itemCustoId: itemId, status: "PENDENTE" },
  });
  if (pendente > 0) {
    return falha("Já existe uma proposta aguardando aceite para este custo.");
  }

  const direto = vePorInteiro(usuario.papel);

  await prisma.$transaction(async (tx) => {
    const proposta = await tx.propostaRateio.create({
      data: {
        itemCustoId: itemId,
        criadoPorId: usuario.id,
        justificativa,
        status: direto ? "APROVADA" : "PENDENTE",
        decididaEm: direto ? new Date() : null,
        parcelas: {
          create: parcelas.map((p) => ({
            setorId: p.setorId,
            percentual: p.percentual.toString(),
            // A fatia do próprio setor do proponente já nasce aceita — propor
            // já é concordar. Controladoria/admin aplicam direto: tudo aceito.
            aceite: direto || p.setorId === usuario.setorId ? "ACEITO" : "PENDENTE",
            decididoPorId: direto || p.setorId === usuario.setorId ? usuario.id : null,
            decididoEm: direto || p.setorId === usuario.setorId ? new Date() : null,
          })),
        },
      },
      select: { id: true, parcelas: { select: { aceite: true } } },
    });

    const tudoAceito = proposta.parcelas.every((p) => p.aceite === "ACEITO");
    if (tudoAceito) {
      await aplicarParcelas(
        tx,
        itemId,
        parcelas.map((p) => ({ setorId: p.setorId, percentual: p.percentual.toString() })),
        usuario.email,
      );
      await tx.propostaRateio.update({
        where: { id: proposta.id },
        data: { status: "APROVADA", decididaEm: new Date() },
      });
    }

    await tx.auditoria.create({
      data: {
        tabela: "proposta_rateio",
        registroId: proposta.id,
        acao: "CRIACAO",
        usuarioId: usuario.id,
        diff: {
          depois: {
            itemId,
            parcelas: parcelas.map((p) => ({ setorId: p.setorId, pct: p.percentual.toString() })),
            aplicadaDireto: tudoAceito,
          },
        },
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/custos");
  revalidatePath(`/custos/${itemId}`);
  redirect(`/custos/${itemId}`);
}

export async function decidirAceite(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  const parcelaId = texto(dados, "parcelaId");
  const decisao = texto(dados, "decisao");
  const comentario = textoOpcional(dados, "comentario")?.slice(0, 500) ?? null;

  if (!parcelaId || (decisao !== "aceitar" && decisao !== "recusar")) {
    return falha("Decisão inválida.");
  }

  const parcela = await prisma.propostaRateioParcela.findUnique({
    where: { id: parcelaId },
    select: {
      id: true,
      setorId: true,
      aceite: true,
      proposta: { select: { id: true, status: true, itemCustoId: true } },
    },
  });
  if (!parcela || parcela.proposta.status !== "PENDENTE") {
    return falha("Esta proposta já foi decidida.");
  }
  if (parcela.aceite !== "PENDENTE") return falha("Esta fatia já foi decidida.");

  const autorizado =
    vePorInteiro(usuario.papel) ||
    (podeLancar(usuario.papel) && usuario.setorId === parcela.setorId);
  if (!autorizado) {
    return falha("O aceite desta fatia cabe ao gestor do setor que a recebe.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.propostaRateioParcela.update({
      where: { id: parcela.id },
      data: {
        aceite: decisao === "aceitar" ? "ACEITO" : "REJEITADO",
        comentario,
        decididoPorId: usuario.id,
        decididoEm: new Date(),
      },
    });

    if (decisao === "recusar") {
      await tx.propostaRateio.update({
        where: { id: parcela.proposta.id },
        data: { status: "REJEITADA", decididaEm: new Date() },
      });
    } else {
      const restantes = await tx.propostaRateioParcela.count({
        where: { propostaId: parcela.proposta.id, aceite: "PENDENTE" },
      });
      if (restantes === 0) {
        const todas = await tx.propostaRateioParcela.findMany({
          where: { propostaId: parcela.proposta.id },
          select: { setorId: true, percentual: true },
        });
        await aplicarParcelas(
          tx,
          parcela.proposta.itemCustoId,
          todas.map((p) => ({ setorId: p.setorId, percentual: p.percentual.toString() })),
          usuario.email,
        );
        await tx.propostaRateio.update({
          where: { id: parcela.proposta.id },
          data: { status: "APROVADA", decididaEm: new Date() },
        });
      }
    }

    await tx.auditoria.create({
      data: {
        tabela: "proposta_rateio_parcela",
        registroId: parcela.id,
        acao: "ALTERACAO",
        usuarioId: usuario.id,
        diff: { depois: { decisao, comentario } },
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/custos");
  revalidatePath(`/custos/${parcela.proposta.itemCustoId}`);
  return { ok: true, mensagem: decisao === "aceitar" ? "Fatia aceita." : "Proposta recusada." };
}

export async function cancelarProposta(dados: FormData): Promise<void> {
  const usuario = await exigirSessao();
  const propostaId = texto(dados, "propostaId");
  if (!propostaId) redirect("/");

  const proposta = await prisma.propostaRateio.findUnique({
    where: { id: propostaId },
    select: { status: true, criadoPorId: true, itemCustoId: true },
  });
  if (!proposta || proposta.status !== "PENDENTE") redirect("/");
  if (proposta.criadoPorId !== usuario.id && !vePorInteiro(usuario.papel)) redirect("/");

  await prisma.propostaRateio.update({
    where: { id: propostaId },
    data: { status: "CANCELADA", decididaEm: new Date() },
  });

  revalidatePath("/");
  revalidatePath(`/custos/${proposta.itemCustoId}`);
  redirect(`/custos/${proposta.itemCustoId}`);
}
