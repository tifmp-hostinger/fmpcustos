"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { derivados } from "@/lib/dinheiro";
import { normalizar } from "@/lib/fornecedores";
import { MAXIMO_LINHAS, MAPA_VAZIO, lerColagem, type Mapa } from "@/lib/planilha";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { falha, sucesso, texto, textoOpcional, type Resultado } from "@/lib/acoes";

/**
 * Grava de uma vez as linhas coladas da planilha.
 *
 * O texto colado é reinterpretado AQUI, do zero, com o mesmo módulo puro que a
 * prévia usou. O cliente manda o texto e o mapa de colunas, nunca as linhas já
 * interpretadas: aceitar o que a tela diz ter entendido seria confiar num
 * FormData para dizer quanto custa um contrato.
 *
 * Linhas com problema não entram e não travam as outras. Importar vinte e oito
 * de trinta e dizer quais duas ficaram é melhor que recusar as trinta por
 * causa de duas — quem cola uma planilha quer avançar, não recomeçar.
 */
export async function importarColados(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) return falha("Seu perfil não permite lançar custos.");

  const colado = texto(dados, "colado");
  if (!colado) return falha("Cole as linhas da planilha antes de importar.");

  let mapa: Mapa;
  try {
    const lido: unknown = JSON.parse(texto(dados, "mapa") || "{}");
    if (typeof lido !== "object" || lido === null) throw new Error();
    // Só as chaves conhecidas entram, e só como número: um mapa forjado não
    // pode apontar para índice fora da linha nem inventar campo novo.
    mapa = { ...MAPA_VAZIO };
    for (const chave of Object.keys(MAPA_VAZIO) as Array<keyof Mapa>) {
      const valor = (lido as Record<string, unknown>)[chave];
      if (typeof valor === "number" && Number.isInteger(valor) && valor >= -1 && valor < 64) {
        mapa[chave] = valor;
      }
    }
  } catch {
    return falha("Não consegui ler o mapeamento das colunas.");
  }

  const setorEscolhido = textoOpcional(dados, "setorId");
  const setorId = vePorInteiro(usuario.papel)
    ? (setorEscolhido ?? usuario.setorId)
    : usuario.setorId;
  if (!setorId) return falha("Escolha o setor que vai responder por estes custos.");

  const setorExiste = await prisma.setor.count({ where: { id: setorId, ativo: true } });
  if (setorExiste === 0) return falha("Setor inválido.");

  const leitura = lerColagem(colado, mapa);
  const validas = leitura.linhas.filter((l) => l.problemas.length === 0);
  if (validas.length === 0) {
    return falha("Nenhuma linha está pronta para importar. Corrija os problemas apontados.");
  }
  if (validas.length > MAXIMO_LINHAS) return falha("Cole no máximo 200 linhas por vez.");

  // Fornecedores e categorias resolvidos ANTES da transação, em lote: dentro
  // dela, uma consulta por linha em trinta linhas seguraria conexão à toa e
  // multiplicaria o risco de estouro de tempo.
  const [fornecedores, categorias] = await Promise.all([
    prisma.fornecedor.findMany({ select: { id: true, nome: true } }),
    prisma.categoria.findMany({ select: { id: true, nome: true } }),
  ]);
  const porFornecedor = new Map(fornecedores.map((f) => [normalizar(f.nome), f.id]));
  const porCategoria = new Map(categorias.map((c) => [normalizar(c.nome), c.id]));

  const novosFornecedores = new Map<string, string>();
  for (const linha of validas) {
    if (!linha.fornecedor) continue;
    const chave = normalizar(linha.fornecedor);
    if (chave && !porFornecedor.has(chave) && !novosFornecedores.has(chave)) {
      novosFornecedores.set(chave, linha.fornecedor);
    }
  }
  for (const [chave, nome] of novosFornecedores) {
    const criado = await prisma.fornecedor.create({ data: { nome }, select: { id: true } });
    porFornecedor.set(chave, criado.id);
  }

  const hoje = new Date();
  const criados: string[] = [];
  const categoriasIgnoradas = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (const linha of validas) {
      // A colagem lança sempre em real, e é por isso que a moeda não é uma
      // coluna da planilha: cada custo em moeda estrangeira precisa da SUA
      // cotação, e uma taxa única aplicada a trinta linhas coladas seria um
      // número inventado com aparência de conversão. Moeda estrangeira se
      // cadastra uma a uma — a tela de colagem avisa isso.
      const valores = derivados(linha.valorPeriodo, linha.periodicidade, "BRL", null);
      const categoriaId = linha.categoria
        ? (porCategoria.get(normalizar(linha.categoria)) ?? null)
        : null;
      // Categoria que não existe no cadastro NÃO é criada aqui: a árvore de
      // categorias é decisão de controladoria, e deixar o importador criar
      // "Softwares", "software" e "SW" arruinaria o agrupamento por tipo.
      if (linha.categoria && !categoriaId) categoriasIgnoradas.add(linha.categoria);

      const item = await tx.itemCusto.create({
        data: {
          descricao: linha.descricao,
          fornecedorId: linha.fornecedor
            ? (porFornecedor.get(normalizar(linha.fornecedor)) ?? null)
            : null,
          categoriaId,
          natureza: "RECORRENTE",
          periodicidade: linha.periodicidade,
          valorPeriodo: linha.valorPeriodo,
          ...valores,
          quantidade: linha.quantidade,
          dataFim: linha.dataFim,
          observacoes: linha.observacoes,
          // Importado nasce EM_ANALISE, nunca ATIVO: trinta linhas coladas
          // entrariam somando no total da FMP antes de qualquer conferência.
          status: linha.valorPeriodo === null ? "PENDENTE_APURACAO" : "EM_ANALISE",
          criadoPorId: usuario.id,
        },
        select: { id: true },
      });

      await tx.rateio.create({
        data: {
          itemCustoId: item.id,
          setorId,
          metodo: "PERCENTUAL",
          percentual: "100.0000",
          vigenciaInicio: hoje,
        },
      });

      criados.push(item.id);
    }

    await tx.auditoria.create({
      data: {
        tabela: "item_custo",
        registroId: criados[0] ?? "lote",
        acao: "CRIACAO",
        usuarioId: usuario.id,
        diff: { depois: { importadosPorColagem: criados.length, setorId, itens: criados } },
      },
    });
  });

  revalidatePath("/custos");
  revalidatePath("/");

  const ignoradas = leitura.linhas.length - validas.length;
  const partes: string[] = [];
  if (ignoradas > 0) {
    partes.push(`${ignoradas} ${ignoradas === 1 ? "linha ficou" : "linhas ficaram"} de fora`);
  }
  if (categoriasIgnoradas.size > 0) {
    partes.push(
      `categoria não cadastrada em ${[...categoriasIgnoradas].slice(0, 3).join(", ")} — os itens ficaram sem categoria`,
    );
  }
  partes.push("todos entraram como “em análise”, para conferência antes de virarem ativos");

  return sucesso(
    `${criados.length} ${criados.length === 1 ? "custo importado" : "custos importados"}.`,
    { detalhe: partes.join(" · "), irPara: "/custos?f=analise" },
  );
}
