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
 * SETORES PELA INTERFACE
 *
 * Até aqui, criar um setor exigia SQL. O efeito prático não era "dá trabalho":
 * era que ninguém criava. Custos de uma área nova iam para o setor mais
 * parecido, e o rateio da FMP passava a descrever a estrutura de dois anos atrás.
 *
 * Três decisões que atravessam todas as ações daqui.
 *
 * **Apagar só o que nunca foi usado.** Um setor com rateio guarda dinheiro com
 * dono; apagá-lo deixaria custos órfãos e um histórico ilegível. Mas obrigar a
 * conviver para sempre com um setor criado por engano, com o nome errado,
 * também é errado — e é o que acontece quando a única saída é inativar. A regra
 * é explícita e a tela diz qual das duas se aplica, antes do clique.
 *
 * **Inativar não some com o dinheiro.** Os custos continuam somando no painel;
 * o setor é que deixa de aparecer nas listas de escolha. Quem inativa precisa
 * saber disso na hora, senão vai procurar o total que "sumiu" — e ele não sumiu.
 *
 * **Nome igual é recusado, mesmo se o outro estiver inativo.** É justamente o
 * caso em que a pessoa jura que não existe, cria de novo, e a FMP passa a ter
 * dois "Comunicação e Marketing" — um com o histórico e outro com os lançamentos
 * novos.
 */

async function listaParaChecagem() {
  return prisma.setor.findMany({ select: { id: true, nome: true, ativo: true, codigo: true } });
}

export async function criarSetor(_anterior: Resultado | null, dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const digitado = valoresDigitados(dados);

  const nome = texto(dados, "nome").slice(0, 120);
  if (!nome) return falha("Informe o nome do setor.", digitado, "nome");

  const existentes = await listaParaChecagem();
  const colisao = mesmoNome(nome, existentes);
  if (colisao) {
    return falha(
      colisao.ativo
        ? `Já existe um setor chamado «${colisao.nome}».`
        : `Já existe um setor «${colisao.nome}», inativo. Reative-o em vez de criar outro — o histórico dele continua ligado aos custos antigos.`,
      digitado,
      "nome",
    );
  }

  const codigo = codigoLivre(
    textoOpcional(dados, "codigo")?.toUpperCase().slice(0, 30) || codigoDeNome(nome),
    new Set(existentes.map((s) => s.codigo)),
  );

  const criado = await prisma.setor.create({
    data: {
      nome,
      codigo,
      setorPaiId: textoOpcional(dados, "setorPaiId"),
      gestorId: textoOpcional(dados, "gestorId"),
      responsavelDadoId: textoOpcional(dados, "responsavelDadoId"),
    },
    select: { id: true },
  });

  await registrar(admin.id, criado.id, "CRIACAO", null, { nome, codigo });
  atualizar();

  return sucesso(`${nome} já pode receber custos.`, {
    detalhe: "Aparece agora na escolha de setor do cadastro e do rateio.",
    destaqueId: criado.id,
  });
}

export async function renomearSetor(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  const nome = texto(dados, "nome").slice(0, 120);
  if (!id) return falha("Setor não informado.");
  if (!nome) return falha("Informe o nome do setor.", undefined, "nome");

  const antes = await prisma.setor.findUnique({ where: { id }, select: { nome: true } });
  if (!antes) return falha("Este setor não existe mais.");
  if (antes.nome === nome) return sucesso("Nada mudou.");

  const colisao = mesmoNome(nome, await listaParaChecagem(), id);
  if (colisao) return falha(`Já existe um setor chamado «${colisao.nome}».`, undefined, "nome");

  await prisma.setor.update({ where: { id }, data: { nome } });
  await registrar(admin.id, id, "ALTERACAO", { nome: antes.nome }, { nome });
  atualizar();

  return sucesso(`«${antes.nome}» agora se chama «${nome}».`, {
    // O código NÃO acompanha o nome. Ele é a referência estável em relatório e
    // em planilha externa, e trocá-lo por causa de uma correção de grafia
    // quebraria o que já foi exportado.
    detalhe: "O código não muda: relatórios e planilhas já exportados continuam válidos.",
    destaqueId: id,
    desfazer: { acao: "reverterCampo", id, antes: { nome: antes.nome } },
  });
}

export async function alterarHierarquia(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  const paiId = textoOpcional(dados, "setorPaiId");
  if (!id) return falha("Setor não informado.");

  const setores = await prisma.setor.findMany({
    select: { id: true, setorPaiId: true, nome: true },
  });
  const atual = setores.find((s) => s.id === id);
  if (!atual) return falha("Este setor não existe mais.");

  if (paiId) {
    // Um ciclo não dá erro ao gravar: ele trava a travessia da árvore depois —
    // inclusive a que monta este próprio seletor, o que deixaria a tela morta
    // sem nenhuma mensagem.
    const proibidos = descendentes(
      id,
      agruparPorPai(setores.map((s) => ({ id: s.id, paiId: s.setorPaiId }))),
    );
    if (proibidos.has(paiId)) {
      return falha(
        paiId === id
          ? "Um setor não pode ser subordinado a si mesmo."
          : "Esse setor já está abaixo deste — a escolha criaria um ciclo na hierarquia.",
      );
    }
  }

  await prisma.setor.update({ where: { id }, data: { setorPaiId: paiId } });
  await registrar(
    admin.id,
    id,
    "ALTERACAO",
    { setorPaiId: atual.setorPaiId },
    { setorPaiId: paiId },
  );
  atualizar();

  const pai = paiId ? setores.find((s) => s.id === paiId) : null;
  return sucesso(
    pai ? `${atual.nome} agora está abaixo de ${pai.nome}.` : `${atual.nome} voltou ao topo.`,
    {
      destaqueId: id,
      desfazer: { acao: "reverterCampo", id, antes: { setorPaiId: atual.setorPaiId } },
    },
  );
}

export async function alterarResponsaveis(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  if (!id) return falha("Setor não informado.");

  const antes = await prisma.setor.findUnique({
    where: { id },
    select: { nome: true, gestorId: true, responsavelDadoId: true },
  });
  if (!antes) return falha("Este setor não existe mais.");

  const gestorId = textoOpcional(dados, "gestorId");
  const responsavelDadoId = textoOpcional(dados, "responsavelDadoId");

  await prisma.setor.update({ where: { id }, data: { gestorId, responsavelDadoId } });
  await registrar(
    admin.id,
    id,
    "ALTERACAO",
    { gestorId: antes.gestorId, responsavelDadoId: antes.responsavelDadoId },
    { gestorId, responsavelDadoId },
  );
  atualizar();

  return sucesso(`Responsáveis de ${antes.nome} atualizados.`, {
    destaqueId: id,
    desfazer: {
      acao: "reverterCampo",
      id,
      antes: { gestorId: antes.gestorId, responsavelDadoId: antes.responsavelDadoId },
    },
  });
}

export async function alternarAtivo(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  if (!id) return falha("Setor não informado.");

  const setor = await prisma.setor.findUnique({
    where: { id },
    select: {
      nome: true,
      ativo: true,
      _count: { select: { rateios: true, colaboradores: true } },
    },
  });
  if (!setor) return falha("Este setor não existe mais.");

  const ativo = !setor.ativo;
  await prisma.setor.update({ where: { id }, data: { ativo } });
  await registrar(admin.id, id, "ALTERACAO", { ativo: setor.ativo }, { ativo });
  atualizar();

  return sucesso(ativo ? `${setor.nome} está ativo de novo.` : `${setor.nome} foi inativado.`, {
    // A consequência precisa vir junto: quem inativa e vê o total do painel
    // igual ao de antes vai achar que a ação não funcionou.
    detalhe: ativo
      ? "Volta a aparecer na escolha de setor."
      : setor._count.rateios > 0
        ? `Os ${setor._count.rateios} custos rateados a ele continuam somando no painel — o setor é que some das listas de escolha.`
        : "Some das listas de escolha. Nenhum custo estava rateado a ele.",
    destaqueId: id,
    desfazer: { acao: "reverterCampo", id, antes: { ativo: String(setor.ativo) } },
  });
}

export async function apagarSetor(dados: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const id = texto(dados, "id");
  if (!id) return falha("Setor não informado.");

  const setor = await prisma.setor.findUnique({
    where: { id },
    select: {
      nome: true,
      _count: {
        select: {
          rateios: true,
          colaboradores: true,
          contratos: true,
          orcamentos: true,
          centrosCusto: true,
          subsetores: true,
          acessos: true,
          parcelasProposta: true,
          parcelasModelo: true,
        },
      },
    },
  });
  if (!setor) return falha("Este setor não existe mais.");

  const c = setor._count;
  const veredito = podeApagar({
    "custos rateados": c.rateios,
    "pessoas lotadas": c.colaboradores,
    contratos: c.contratos,
    orçamentos: c.orcamentos,
    "centros de custo": c.centrosCusto,
    subsetores: c.subsetores,
    "acessos de usuário": c.acessos,
    "fatias em proposta": c.parcelasProposta,
    "modelos de rateio": c.parcelasModelo,
  });
  if (!veredito.pode) {
    return falha(`${setor.nome} não pode ser apagado. ${veredito.motivo}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.setor.delete({ where: { id } });
    await tx.auditoria.create({
      data: {
        tabela: "setor",
        registroId: id,
        acao: "EXCLUSAO",
        usuarioId: admin.id,
        diff: { antes: { nome: setor.nome }, depois: null },
      },
    });
  });
  atualizar();

  return sucesso(`${setor.nome} foi apagado.`, {
    detalhe: "Nunca tinha sido usado — nada foi perdido junto.",
  });
}

/**
 * Desfazer de setor.
 *
 * Existe pelo mesmo motivo que o desfazer de alerta: `reverterCampo` (o de
 * custos) escreve em `item_custo`, e mandar um id de setor para lá não acharia
 * nada e devolveria "não há o que desfazer" — um botão que existe, é clicado e
 * não faz nada, que é pior que não ter botão.
 *
 * Só volta o que estas ações mudam. Um payload com outro campo é ignorado: o
 * desfazer é uma volta atrás, não um caminho paralelo para escrever no banco.
 */
export async function reverterSetor(dados: FormData): Promise<Resultado> {
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

  const atual = await prisma.setor.findUnique({
    where: { id },
    select: { nome: true, ativo: true, setorPaiId: true, gestorId: true, responsavelDadoId: true },
  });
  if (!atual) return falha("Este setor não existe mais.");

  const data: {
    nome?: string;
    ativo?: boolean;
    setorPaiId?: string | null;
    gestorId?: string | null;
    responsavelDadoId?: string | null;
  } = {};

  if (typeof anterior.nome === "string" && anterior.nome) data.nome = anterior.nome.slice(0, 120);
  if (anterior.ativo !== undefined)
    data.ativo = anterior.ativo === "true" || anterior.ativo === true;
  if ("setorPaiId" in anterior) {
    data.setorPaiId = typeof anterior.setorPaiId === "string" ? anterior.setorPaiId : null;
  }
  if ("gestorId" in anterior) {
    data.gestorId = typeof anterior.gestorId === "string" ? anterior.gestorId : null;
  }
  if ("responsavelDadoId" in anterior) {
    data.responsavelDadoId =
      typeof anterior.responsavelDadoId === "string" ? anterior.responsavelDadoId : null;
  }

  if (Object.keys(data).length === 0) return falha("Não há o que desfazer.");

  await prisma.setor.update({ where: { id }, data });
  // O histórico do desfazer registra os valores REAIS de antes e de depois:
  // gravar só "desfeito" faria a linha aparecer sem valor anterior, e o
  // histórico é justamente onde não se pode mentir sobre o passado.
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
      tabela: "setor",
      registroId,
      acao,
      usuarioId,
      diff: { antes: antes ?? null, depois },
    },
  });
}

function atualizar() {
  revalidatePath("/admin/setores");
  revalidatePath("/custos");
  revalidatePath("/custos/novo");
  revalidatePath("/");
}
