"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import {
  agruparPorPai,
  codigoDeNome,
  codigoLivre,
  descendentes,
  mesmoNome,
  podeApagar,
} from "@/lib/organizacao";
import {
  falha,
  sucesso,
  texto,
  textoOpcional,
  valoresDigitados,
  type Resultado,
} from "@/lib/acoes";

/**
 * CATEGORIAS PELA INTERFACE
 *
 * Mesma história dos setores: criar uma exigia SQL, então ninguém criava, e o
 * gráfico "custo por tipo" descrevia a lista de categorias de dois anos atrás.
 * O importador de planilha até se recusa a criar categoria sozinho — de
 * propósito, para não nascerem "Softwares", "software" e "SW" — mas essa recusa
 * só faz sentido se existir um caminho de gente para criar a categoria certa.
 *
 * A diferença em relação a setor é a **fusão**. Categoria é o eixo em que
 * duplicata acontece mais, porque o nome é livre e o critério é subjetivo, e
 * duas categorias quase iguais partem o gráfico ao meio sem que nada pareça
 * errado. Fundir move os custos para a categoria que fica e inativa a outra —
 * numa transação só, com o histórico registrando de onde cada item veio.
 *
 * O que a fusão NÃO faz é apagar a categoria absorvida. Ela é inativada e
 * continua existindo para o histórico e para a auditoria: apagar deixaria as
 * linhas de auditoria apontando para um id que não existe mais.
 */

async function listaParaChecagem() {
  return prisma.categoria.findMany({ select: { id: true, nome: true, ativo: true, codigo: true } });
}

export async function criarCategoria(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const admin = await exigirAdmin();
  const digitado = valoresDigitados(dados);

  const nome = texto(dados, "nome").slice(0, 120);
  if (!nome) return falha("Informe o nome da categoria.", digitado, "nome");

  const existentes = await listaParaChecagem();
  const colisao = mesmoNome(nome, existentes);
  if (colisao) {
    return falha(
      colisao.ativo
        ? `Já existe uma categoria «${colisao.nome}».`
        : `Já existe uma categoria «${colisao.nome}», inativa. Reative-a em vez de criar outra — os custos antigos continuam ligados a ela.`,
      digitado,
      "nome",
    );
  }

  const codigo = codigoLivre(
    textoOpcional(dados, "codigo")?.toUpperCase().slice(0, 30) || codigoDeNome(nome),
    new Set(existentes.map((c) => c.codigo)),
  );

  const criada = await prisma.categoria.create({
    data: { nome, codigo, categoriaPaiId: textoOpcional(dados, "categoriaPaiId") },
    select: { id: true },
  });

  await registrar(admin.id, criada.id, "CRIACAO", null, { nome, codigo });
  atualizar();

  return sucesso(`${nome} já pode ser usada.`, {
    detalhe: "Aparece agora no cadastro de custo e na colagem de planilha.",
    destaqueId: criada.id,
  });
}

export async function renomearCategoria(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  const nome = texto(dados, "nome").slice(0, 120);
  if (!id) return falha("Categoria não informada.");
  if (!nome) return falha("Informe o nome da categoria.", undefined, "nome");

  const antes = await prisma.categoria.findUnique({ where: { id }, select: { nome: true } });
  if (!antes) return falha("Esta categoria não existe mais.");
  if (antes.nome === nome) return sucesso("Nada mudou.");

  const colisao = mesmoNome(nome, await listaParaChecagem(), id);
  if (colisao) {
    return falha(
      `Já existe uma categoria «${colisao.nome}». Para juntar as duas, use “Fundir”.`,
      undefined,
      "nome",
    );
  }

  await prisma.categoria.update({ where: { id }, data: { nome } });
  await registrar(admin.id, id, "ALTERACAO", { nome: antes.nome }, { nome });
  atualizar();

  return sucesso(`«${antes.nome}» agora se chama «${nome}».`, {
    detalhe: "O código não muda: relatórios e planilhas já exportados continuam válidos.",
    destaqueId: id,
    desfazer: { acao: "reverterCampo", id, antes: { nome: antes.nome } },
  });
}

export async function alterarPai(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  const paiId = textoOpcional(dados, "categoriaPaiId");
  if (!id) return falha("Categoria não informada.");

  const categorias = await prisma.categoria.findMany({
    select: { id: true, categoriaPaiId: true, nome: true },
  });
  const atual = categorias.find((c) => c.id === id);
  if (!atual) return falha("Esta categoria não existe mais.");

  if (paiId) {
    const proibidos = descendentes(
      id,
      agruparPorPai(categorias.map((c) => ({ id: c.id, paiId: c.categoriaPaiId }))),
    );
    if (proibidos.has(paiId)) {
      return falha(
        paiId === id
          ? "Uma categoria não pode estar dentro de si mesma."
          : "Essa categoria já está dentro desta — a escolha criaria um ciclo.",
      );
    }
  }

  await prisma.categoria.update({ where: { id }, data: { categoriaPaiId: paiId } });
  await registrar(
    admin.id,
    id,
    "ALTERACAO",
    { categoriaPaiId: atual.categoriaPaiId },
    { categoriaPaiId: paiId },
  );
  atualizar();

  const pai = paiId ? categorias.find((c) => c.id === paiId) : null;
  return sucesso(
    pai ? `${atual.nome} agora está dentro de ${pai.nome}.` : `${atual.nome} voltou ao topo.`,
    {
      destaqueId: id,
      desfazer: { acao: "reverterCampo", id, antes: { categoriaPaiId: atual.categoriaPaiId } },
    },
  );
}

export async function alternarAtivo(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  if (!id) return falha("Categoria não informada.");

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: { nome: true, ativo: true, _count: { select: { itens: true } } },
  });
  if (!categoria) return falha("Esta categoria não existe mais.");

  const ativo = !categoria.ativo;
  await prisma.categoria.update({ where: { id }, data: { ativo } });
  await registrar(admin.id, id, "ALTERACAO", { ativo: categoria.ativo }, { ativo });
  atualizar();

  return sucesso(
    ativo ? `${categoria.nome} está ativa de novo.` : `${categoria.nome} foi inativada.`,
    {
      detalhe: ativo
        ? "Volta a aparecer no cadastro de custo."
        : categoria._count.itens === 1
          ? "O custo nela continua classificado assim e continua no gráfico por tipo — a categoria é que some das listas de escolha."
          : categoria._count.itens > 1
            ? `Os ${categoria._count.itens} custos nela continuam classificados assim e continuam no gráfico por tipo — a categoria é que some das listas de escolha.`
            : "Some das listas de escolha. Nenhum custo estava nela.",
      destaqueId: id,
      desfazer: { acao: "reverterCampo", id, antes: { ativo: String(categoria.ativo) } },
    },
  );
}

/**
 * Junta duas categorias numa só.
 *
 * É a ação que faltava para que "criar categoria pela tela" não fosse um jeito
 * novo de estragar o agrupamento. Sem ela, a saída para "Softwares" e
 * "Software" seria abrir cada custo e reclassificar um a um — e ninguém faz
 * isso, então as duas ficam, e o gráfico por tipo continua partido ao meio.
 *
 * Os custos mudam de categoria numa transação, e cada um ganha uma linha de
 * auditoria dizendo de onde veio. A categoria absorvida é INATIVADA, não
 * apagada: apagar deixaria as linhas de auditoria apontando para um id
 * inexistente, e a auditoria é o que responde "por que este custo mudou de
 * categoria em agosto?".
 */
export async function fundirCategorias(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const origemId = texto(dados, "origemId");
  const destinoId = texto(dados, "destinoId");

  if (!origemId || !destinoId) return falha("Escolha as duas categorias.");
  if (origemId === destinoId) return falha("As duas categorias são a mesma.");

  const [origem, destino] = await Promise.all([
    prisma.categoria.findUnique({
      where: { id: origemId },
      select: { nome: true, _count: { select: { itens: true, subcategorias: true } } },
    }),
    prisma.categoria.findUnique({ where: { id: destinoId }, select: { nome: true, ativo: true } }),
  ]);
  if (!origem || !destino) return falha("Uma das categorias não existe mais.");
  if (!destino.ativo) {
    return falha(`«${destino.nome}» está inativa. Reative-a antes de mandar custos para ela.`);
  }
  if (origem._count.subcategorias > 0) {
    // Mover os custos e deixar as subcategorias penduradas numa categoria
    // inativa esconderia uma árvore inteira sem avisar.
    return falha(
      `«${origem.nome}» tem ${origem._count.subcategorias} subcategoria(s). Mova ou funda as subcategorias antes.`,
    );
  }

  const itens = await prisma.itemCusto.findMany({
    where: { categoriaId: origemId },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    if (itens.length > 0) {
      await tx.itemCusto.updateMany({
        where: { categoriaId: origemId },
        data: { categoriaId: destinoId },
      });
      for (const item of itens) {
        await tx.auditoria.create({
          data: {
            tabela: "item_custo",
            registroId: item.id,
            acao: "ALTERACAO",
            usuarioId: admin.id,
            diff: {
              antes: { categoriaId: origemId, categoria: origem.nome },
              depois: { categoriaId: destinoId, categoria: destino.nome },
            },
          },
        });
      }
    }
    await tx.categoria.update({ where: { id: origemId }, data: { ativo: false } });
    await tx.auditoria.create({
      data: {
        tabela: "categoria",
        registroId: origemId,
        acao: "ALTERACAO",
        usuarioId: admin.id,
        diff: {
          antes: { nome: origem.nome, ativo: true },
          depois: { ativo: false, fundidaEm: destino.nome, itensMovidos: itens.length },
        },
      },
    });
  });

  atualizar();

  return sucesso(
    itens.length === 0
      ? `«${origem.nome}» foi fundida em «${destino.nome}».`
      : `${itens.length} ${itens.length === 1 ? "custo passou" : "custos passaram"} de «${origem.nome}» para «${destino.nome}».`,
    {
      detalhe: `«${origem.nome}» ficou inativa. O histórico de cada custo registra a mudança.`,
      irPara: "/admin/categorias",
    },
  );
}

export async function apagarCategoria(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  if (!id) return falha("Categoria não informada.");

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: {
      nome: true,
      _count: { select: { itens: true, servicos: true, orcamentos: true, subcategorias: true } },
    },
  });
  if (!categoria) return falha("Esta categoria não existe mais.");

  const c = categoria._count;
  const veredito = podeApagar({
    custos: c.itens,
    serviços: c.servicos,
    orçamentos: c.orcamentos,
    subcategorias: c.subcategorias,
  });
  if (!veredito.pode) {
    return falha(
      `${categoria.nome} não pode ser apagada. ${veredito.motivo} Para juntá-la a outra, use “Fundir”.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.categoria.delete({ where: { id } });
    await tx.auditoria.create({
      data: {
        tabela: "categoria",
        registroId: id,
        acao: "EXCLUSAO",
        usuarioId: admin.id,
        diff: { antes: { nome: categoria.nome }, depois: null },
      },
    });
  });
  atualizar();

  return sucesso(`${categoria.nome} foi apagada.`, {
    detalhe: "Nunca tinha sido usada — nada foi perdido junto.",
  });
}

/** Desfazer de categoria. Ver a nota em `setores/acoes.ts`: o de custos não serve. */
export async function reverterCategoria(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  const bruto = texto(dados, "antes");
  if (!id || !bruto) return falha("Não há o que desfazer.");

  let anterior: Record<string, unknown>;
  try {
    anterior = JSON.parse(bruto) as Record<string, unknown>;
  } catch {
    return falha("Não há o que desfazer.");
  }

  const atual = await prisma.categoria.findUnique({
    where: { id },
    select: { nome: true, ativo: true, categoriaPaiId: true },
  });
  if (!atual) return falha("Esta categoria não existe mais.");

  const data: { nome?: string; ativo?: boolean; categoriaPaiId?: string | null } = {};
  if (typeof anterior.nome === "string" && anterior.nome) data.nome = anterior.nome.slice(0, 120);
  if (anterior.ativo !== undefined)
    data.ativo = anterior.ativo === "true" || anterior.ativo === true;
  if ("categoriaPaiId" in anterior) {
    data.categoriaPaiId =
      typeof anterior.categoriaPaiId === "string" ? anterior.categoriaPaiId : null;
  }
  if (Object.keys(data).length === 0) return falha("Não há o que desfazer.");

  await prisma.categoria.update({ where: { id }, data });
  const estadoAnterior: Registro = {};
  for (const campo of Object.keys(data)) {
    const valor = atual[campo as keyof typeof atual];
    estadoAnterior[campo] = typeof valor === "boolean" ? valor : (valor ?? null);
  }
  await registrar(admin.id, id, "ALTERACAO", estadoAnterior, data as Registro);
  atualizar();

  return sucesso("Desfeito.", { destaqueId: id });
}

type Registro = Record<string, string | boolean | null>;

async function registrar(
  usuarioId: string,
  registroId: string,
  acao: "CRIACAO" | "ALTERACAO",
  antes: Registro | null,
  depois: Registro,
) {
  await prisma.auditoria.create({
    data: {
      tabela: "categoria",
      registroId,
      acao,
      usuarioId,
      diff: { antes: antes ?? null, depois },
    },
  });
}

function atualizar() {
  revalidatePath("/admin/categorias");
  revalidatePath("/custos");
  revalidatePath("/custos/novo");
  revalidatePath("/custos/colar");
  revalidatePath("/");
}
