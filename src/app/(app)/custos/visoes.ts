"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirSessao, vePorInteiro } from "@/lib/sessao";
import { falha, sucesso, texto, type Resultado } from "@/lib/acoes";

/**
 * VISÕES SALVAS
 *
 * A resposta ao pedido de "pasta", na parte que o agrupamento não cobre.
 *
 * Uma árvore de pastas obriga a escolher UMA hierarquia por custo, e um custo
 * pertence a várias ao mesmo tempo — setor, categoria, fornecedor, natureza — e,
 * com rateio, a vários setores simultaneamente. Pior: o custo da pasta não é o
 * clique, é a decisão de arquivar, tomada uma vez por quem cadastra e sofrida
 * para sempre por quem procura. É por isso que o e-mail migrou de pastas para
 * marcadores e busca, e não o contrário.
 *
 * A visão salva inverte a relação. O custo fica onde está; o que se guarda é a
 * PERGUNTA. "Os contratos de TI que renovam este trimestre" não precisa que
 * nenhum item mude de lugar — precisa que o recorte tenha nome.
 *
 * O recorte guardado é a própria query string da lista, e não uma estrutura
 * paralela com uma coluna por filtro. Assim a visão é sempre exatamente o que a
 * tela mostra, e o filtro que entrar amanhã já nasce salvável.
 */

const MAXIMO_POR_PESSOA = 30;
const TAMANHO_DO_RECORTE = 500;

export async function salvarVisao(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();

  const nome = texto(dados, "nome").slice(0, 60);
  if (!nome) return falha("Dê um nome à visão.", undefined, "nome");

  // O recorte vem da tela, já montado. Cortar é defesa contra um endereço
  // forjado, não contra uso normal: nenhum recorte real chega perto disso.
  const recorte = texto(dados, "recorte").slice(0, TAMANHO_DO_RECORTE);

  const institucional = texto(dados, "institucional") === "true" && vePorInteiro(usuario.papel);

  const quantas = await prisma.visaoSalva.count({ where: { donoId: usuario.id } });
  if (quantas >= MAXIMO_POR_PESSOA) {
    return falha(
      `Você já tem ${MAXIMO_POR_PESSOA} visões salvas. Apague uma antes de criar outra — trinta atalhos deixam de ser atalho.`,
    );
  }

  const jaExiste = await prisma.visaoSalva.findFirst({
    where: { donoId: usuario.id, nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (jaExiste) {
    return falha(`Você já tem uma visão chamada «${nome}».`, undefined, "nome");
  }

  // Recorte idêntico com outro nome é o começo de uma lista de atalhos que
  // ninguém consegue distinguir. Dizer qual já existe é mais útil que recusar.
  const mesmoRecorte = await prisma.visaoSalva.findFirst({
    where: { donoId: usuario.id, recorte },
    select: { nome: true },
  });

  const criada = await prisma.visaoSalva.create({
    data: {
      nome,
      recorte,
      donoId: usuario.id,
      institucional,
      posicao: quantas,
    },
    select: { id: true },
  });

  revalidatePath("/custos");

  return sucesso(`«${nome}» ficou salva.`, {
    detalhe: mesmoRecorte
      ? `Atenção: «${mesmoRecorte.nome}» já mostrava exatamente este recorte.`
      : institucional
        ? "Aparece para todo mundo, acima da lista."
        : "Aparece só para você, acima da lista.",
    destaqueId: criada.id,
  });
}

export async function apagarVisao(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Visão não informada.");

  const visao = await prisma.visaoSalva.findUnique({
    where: { id },
    select: { nome: true, donoId: true, institucional: true, recorte: true },
  });
  if (!visao) return falha("Esta visão não existe mais.");

  // Uma visão institucional é de quem a publicou e de quem administra. Deixar
  // qualquer pessoa apagar o atalho que os treze setores usam seria dar a uma
  // pessoa o poder de mexer na tela de todas as outras.
  const meu = visao.donoId === usuario.id;
  if (!meu && !(visao.institucional && vePorInteiro(usuario.papel))) {
    return falha("Esta visão é de outra pessoa.");
  }

  await prisma.visaoSalva.delete({ where: { id } });
  revalidatePath("/custos");

  return sucesso(`«${visao.nome}» foi apagada.`, {
    // O recorte volta no desfazer porque a visão em si não tem nada além dele:
    // recriar é barato, e perder um atalho por um clique errado não deveria
    // custar reconstruir o filtro de memória.
    desfazer: {
      acao: "reverterCampo",
      id,
      antes: {
        nome: visao.nome,
        recorte: visao.recorte,
        institucional: String(visao.institucional),
      },
    },
  });
}

/** Recria uma visão apagada. É o desfazer de `apagarVisao`. */
export async function recriarVisao(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const bruto = texto(dados, "antes");
  if (!bruto) return falha("Não há o que desfazer.");

  let antes: { nome?: string; recorte?: string; institucional?: string };
  try {
    antes = JSON.parse(bruto) as typeof antes;
  } catch {
    return falha("Não há o que desfazer.");
  }
  if (!antes.nome) return falha("Não há o que desfazer.");

  const quantas = await prisma.visaoSalva.count({ where: { donoId: usuario.id } });
  await prisma.visaoSalva.create({
    data: {
      nome: antes.nome.slice(0, 60),
      recorte: (antes.recorte ?? "").slice(0, TAMANHO_DO_RECORTE),
      donoId: usuario.id,
      institucional: antes.institucional === "true" && vePorInteiro(usuario.papel),
      posicao: quantas,
    },
  });

  revalidatePath("/custos");
  return sucesso(`«${antes.nome}» voltou.`);
}
