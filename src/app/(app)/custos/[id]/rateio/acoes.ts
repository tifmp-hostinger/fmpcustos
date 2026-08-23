"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  MAXIMO_FATIAS,
  MINIMO,
  TOTAL,
  balancear,
  percentualParaBanco,
  textoDeUnidades,
  unidadesDeTexto,
  type Fatia,
} from "@/lib/rateio";
import { exigirSessao, podeLancar, vePorInteiro, type UsuarioSessao } from "@/lib/sessao";
import { falha, sucesso, texto, textoOpcional, type Resultado } from "@/lib/acoes";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Lê as linhas do formulário e resolve a âncora **no servidor**.
 *
 * O percentual da âncora que chega do cliente é descartado de propósito: ele é
 * derivado, e derivado que trafega vira derivado que pode ser forjado. Aqui a
 * âncora é sempre recalculada como 100% menos a soma das demais, de modo que
 * uma requisição montada à mão não consegue gravar um rateio que não fecha.
 */
function lerFatias(dados: FormData): Fatia[] | string {
  const ancoraSetor = texto(dados, "ancora");
  if (!ancoraSetor) return "Escolha qual setor absorve o restante.";

  const fatias: Fatia[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < MAXIMO_FATIAS; i++) {
    const setorId = texto(dados, `setor_${i}`);
    const pctBruto = texto(dados, `pct_${i}`);
    if (!setorId && !pctBruto) continue;
    if (!setorId) return "Escolha o setor de todas as linhas preenchidas.";
    if (vistos.has(setorId)) return "O mesmo setor aparece em duas linhas.";
    vistos.add(setorId);

    const ancora = setorId === ancoraSetor;
    if (ancora) {
      fatias.push({ setorId, unidades: 0, ancora: true });
      continue;
    }

    const unidades = unidadesDeTexto(pctBruto);
    if (unidades === null) return `Não consegui ler «${pctBruto}» como percentual.`;
    if (unidades < MINIMO) {
      return `Fatia mínima de ${textoDeUnidades(MINIMO)}% — remova a linha se o setor não participa.`;
    }
    if (unidades > TOTAL) return "Nenhuma fatia pode passar de 100%.";
    fatias.push({ setorId, unidades, ancora: false });
  }

  if (fatias.length === 0) return "Informe ao menos uma linha de rateio.";
  if (!vistos.has(ancoraSetor)) return "O setor âncora precisa estar entre as linhas.";

  const balanco = balancear(fatias);
  if (balanco.ancora < 0) {
    return `As fatias somam ${textoDeUnidades(TOTAL - balanco.ancora)}% — ${textoDeUnidades(-balanco.ancora)}% além do total.`;
  }
  if (balanco.ancora < MINIMO && fatias.length > 1) {
    return `Sobrariam apenas ${textoDeUnidades(balanco.ancora)}% para o setor âncora. Escolha outra âncora ou reduza as demais fatias.`;
  }
  return balanco.fatias;
}

/** O gestor pode propor quando o custo é inteiramente (100%) da área dele. */
async function podePropor(usuario: UsuarioSessao, itemId: string): Promise<boolean> {
  if (vePorInteiro(usuario.papel)) return true;
  if (!podeLancar(usuario.papel) || !usuario.setorId) return false;
  const dono = await prisma.itemCusto.count({
    where: {
      id: itemId,
      excluidoEm: null,
      rateios: { some: { setorId: usuario.setorId, vigenciaFim: null, percentual: 100 } },
    },
  });
  return dono > 0;
}

/** Encerra os rateios vigentes e aplica as fatias como rateio novo. */
async function aplicarFatias(
  tx: Tx,
  itemId: string,
  fatias: Array<{ setorId: string; percentual: string }>,
  aprovadoPor: string,
) {
  const hoje = new Date();
  await tx.rateio.updateMany({
    where: { itemCustoId: itemId, vigenciaFim: null },
    data: { vigenciaFim: hoje },
  });
  for (const f of fatias) {
    await tx.rateio.create({
      data: {
        itemCustoId: itemId,
        setorId: f.setorId,
        metodo: "PERCENTUAL",
        percentual: f.percentual,
        vigenciaInicio: hoje,
        aprovadoPor,
        aprovadoEm: hoje,
      },
    });
  }
}

function atualizarListas(itemId: string) {
  revalidatePath("/");
  revalidatePath("/custos");
  revalidatePath(`/custos/${itemId}`);
}

function resumo(fatias: Fatia[], nomes: Map<string, string>): string {
  return fatias
    .map((f) => `${nomes.get(f.setorId) ?? "setor"} ${textoDeUnidades(f.unidades)}%`)
    .join(" · ");
}

export async function salvarRateio(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  const itemId = texto(dados, "itemId");
  const justificativa = textoOpcional(dados, "justificativa")?.slice(0, 1000) ?? null;

  if (!itemId) return falha("Custo não informado.");
  if (!(await podePropor(usuario, itemId))) {
    return falha("Você só pode ratear um custo que hoje é inteiramente da sua área.");
  }

  const fatias = lerFatias(dados);
  if (typeof fatias === "string") return falha(fatias);

  const pendente = await prisma.propostaRateio.count({
    where: { itemCustoId: itemId, status: "PENDENTE" },
  });
  if (pendente > 0) {
    return falha(
      "Já existe uma proposta aguardando aceite para este custo. Cancele-a antes de propor outra.",
    );
  }

  const setores = await prisma.setor.findMany({
    where: { id: { in: fatias.map((f) => f.setorId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(setores.map((s) => [s.id, s.nome]));
  if (nomes.size !== fatias.length) return falha("Um dos setores escolhidos não existe mais.");

  const direto = vePorInteiro(usuario.papel);
  const gravaveis = fatias.map((f) => ({
    setorId: f.setorId,
    percentual: percentualParaBanco(f.unidades),
  }));

  const aplicada = await prisma.$transaction(async (tx) => {
    const proposta = await tx.propostaRateio.create({
      data: {
        itemCustoId: itemId,
        criadoPorId: usuario.id,
        justificativa,
        status: "PENDENTE",
        parcelas: {
          create: fatias.map((f) => ({
            setorId: f.setorId,
            percentual: percentualParaBanco(f.unidades),
            // A fatia do próprio setor de quem propõe já nasce aceita — propor
            // já é concordar. Controladoria e admin aplicam direto: tudo aceito.
            aceite: direto || f.setorId === usuario.setorId ? "ACEITO" : "PENDENTE",
            decididoPorId: direto || f.setorId === usuario.setorId ? usuario.id : null,
            decididoEm: direto || f.setorId === usuario.setorId ? new Date() : null,
          })),
        },
      },
      select: { id: true, parcelas: { select: { aceite: true } } },
    });

    const tudoAceito = proposta.parcelas.every((p) => p.aceite === "ACEITO");
    if (tudoAceito) {
      await aplicarFatias(tx, itemId, gravaveis, usuario.email);
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
        diff: { depois: { itemId, fatias: gravaveis, aplicadaDireto: tudoAceito } },
      },
    });
    return tudoAceito;
  });

  atualizarListas(itemId);

  if (aplicada) {
    return sucesso("Rateio aplicado.", {
      detalhe: resumo(fatias, nomes),
      destaqueId: itemId,
    });
  }

  const aguardando = fatias
    .filter((f) => f.setorId !== usuario.setorId)
    .map((f) => nomes.get(f.setorId) ?? "setor");
  return sucesso("Proposta enviada.", {
    detalhe: `Aguardando o aceite de ${aguardando.join(", ")}. O rateio entra em vigor quando todos aceitarem.`,
    destaqueId: itemId,
  });
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
      percentual: true,
      setor: { select: { nome: true } },
      proposta: {
        select: {
          id: true,
          status: true,
          itemCustoId: true,
          itemCusto: { select: { descricao: true } },
        },
      },
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

  const vigorou = await prisma.$transaction(async (tx) => {
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
      return false;
    }

    const restantes = await tx.propostaRateioParcela.count({
      where: { propostaId: parcela.proposta.id, aceite: "PENDENTE" },
    });
    if (restantes > 0) return false;

    const todas = await tx.propostaRateioParcela.findMany({
      where: { propostaId: parcela.proposta.id },
      select: { setorId: true, percentual: true },
    });
    await aplicarFatias(
      tx,
      parcela.proposta.itemCustoId,
      todas.map((p) => ({ setorId: p.setorId, percentual: p.percentual.toString() })),
      usuario.email,
    );
    await tx.propostaRateio.update({
      where: { id: parcela.proposta.id },
      data: { status: "APROVADA", decididaEm: new Date() },
    });
    return true;
  });

  await prisma.auditoria.create({
    data: {
      tabela: "proposta_rateio_parcela",
      registroId: parcela.id,
      acao: "ALTERACAO",
      usuarioId: usuario.id,
      diff: { depois: { decisao, comentario, entrouEmVigor: vigorou } },
    },
  });

  atualizarListas(parcela.proposta.itemCustoId);

  if (decisao === "recusar") {
    return sucesso("Proposta recusada.", {
      detalhe: `${parcela.proposta.itemCusto.descricao} continua com o rateio anterior. Quem propôs é avisado na tela inicial.`,
    });
  }
  return sucesso(
    `Fatia de ${textoDeUnidades(Math.round(Number(parcela.percentual) * 10_000))}% aceita.`,
    {
      detalhe: vigorou
        ? `${parcela.proposta.itemCusto.descricao}: rateio em vigor.`
        : "Ainda faltam outros setores aceitarem.",
    },
  );
}

export async function cancelarProposta(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  const propostaId = texto(dados, "propostaId");
  if (!propostaId) return falha("Proposta não informada.");

  const proposta = await prisma.propostaRateio.findUnique({
    where: { id: propostaId },
    select: {
      status: true,
      criadoPorId: true,
      itemCustoId: true,
      itemCusto: { select: { descricao: true } },
    },
  });
  if (!proposta) return falha("Esta proposta não existe mais.");
  if (proposta.status !== "PENDENTE") return falha("Esta proposta já foi decidida.");
  if (proposta.criadoPorId !== usuario.id && !vePorInteiro(usuario.papel)) {
    return falha("Só quem propôs pode cancelar.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.propostaRateio.update({
      where: { id: propostaId },
      data: { status: "CANCELADA", decididaEm: new Date() },
    });
    await tx.auditoria.create({
      data: {
        tabela: "proposta_rateio",
        registroId: propostaId,
        acao: "ALTERACAO",
        usuarioId: usuario.id,
        diff: { depois: { status: "CANCELADA" } },
      },
    });
  });

  atualizarListas(proposta.itemCustoId);
  return sucesso(`Proposta de ${proposta.itemCusto.descricao} cancelada.`, {
    detalhe: "O rateio anterior continua valendo. Você pode propor outro agora.",
  });
}
