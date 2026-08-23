/**
 * IMPORTADOR / AUDITOR DA PLANILHA DE CUSTOS
 *
 * Este script é a primeira entrega de valor da plataforma, e vale por si só:
 * ele lê a planilha atual, normaliza o que consegue e produz um relatório das
 * inconsistências que precisam de decisão humana.
 *
 * As regras de validação abaixo são a codificação direta dos 22 achados do
 * diagnóstico. O mesmo importador serve os 13 setores — muda o arquivo, não o
 * código.
 *
 *   npx tsx scripts/importar-planilha.ts <arquivo.xlsx> [--json]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";
import { Decimal } from "decimal.js";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type Severidade = "critico" | "atencao" | "info";

type Achado = {
  severidade: Severidade;
  regra: string;
  aba: string;
  linha: number;
  referencia: string;
  detalhe: string;
};

type LinhaNormalizada = {
  aba: string;
  linha: number;
  categoria: string | null;
  fornecedor: string | null;
  descricao: string | null;
  quantidade: number | null;
  valorUnitario: number | null;
  valorPeriodo: string | null;
  periodicidade: Periodicidade | null;
  comportamento: "FIXO" | "VARIAVEL" | null;
  status: StatusItem;
  refPedido: string | null;
  refProposta: string | null;
  observacoes: string | null;
  valorMensalNormalizado: string | null;
  /// Preenchido quando esta linha é o agregado de outra aba (dupla contagem).
  duplicaAba?: string;
};

type Periodicidade = "MENSAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL" | "UNICO" | "SOB_DEMANDA";
type StatusItem =
  | "ATIVO"
  | "EM_ANALISE"
  | "CANCELAMENTO_SOLICITADO"
  | "CANCELADO"
  | "SUBSTITUIDO"
  | "PENDENTE_APURACAO";

const achados: Achado[] = [];
const registrar = (a: Achado) => achados.push(a);

// ---------------------------------------------------------------------------
// Leitura de célula
// ---------------------------------------------------------------------------

/** Extrai o valor bruto de uma célula, resolvendo fórmula e rich text. */
function valorBruto(cell: ExcelJS.Cell): unknown {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object") {
    if ("result" in v) return (v as { result: unknown }).result;
    if ("richText" in v) {
      return (v as { richText: Array<{ text: string }> }).richText.map((t) => t.text).join("");
    }
    if ("text" in v) return (v as { text: string }).text;
  }
  return v;
}

function texto(cell: ExcelJS.Cell): string | null {
  const v = valorBruto(cell);
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function numero(cell: ExcelJS.Cell): number | null {
  const v = valorBruto(cell);
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Cor de preenchimento da célula — na planilha atual, ela carrega significado. */
function corPreenchimento(cell: ExcelJS.Cell): string | null {
  const fill = cell.style?.fill;
  if (!fill || fill.type !== "pattern") return null;
  const fg = (fill as ExcelJS.FillPattern).fgColor;
  return fg && "argb" in fg && typeof fg.argb === "string" ? fg.argb : null;
}

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

const PERIODICIDADES: Record<string, Periodicidade> = {
  mensal: "MENSAL",
  bimestral: "BIMESTRAL",
  trimestral: "TRIMESTRAL",
  semestral: "SEMESTRAL",
  anual: "ANUAL",
  unico: "UNICO",
  "pagamento 6 meses": "SEMESTRAL",
};

const OCORRENCIAS: Record<Periodicidade, number | null> = {
  MENSAL: 12,
  BIMESTRAL: 6,
  TRIMESTRAL: 4,
  SEMESTRAL: 2,
  ANUAL: 1,
  UNICO: null,
  SOB_DEMANDA: null,
};

function normalizarPeriodicidade(valor: string | null): Periodicidade | null {
  if (!valor) return null;
  return PERIODICIDADES[valor.trim().toLowerCase()] ?? null;
}

function mensalNormalizado(valor: Decimal | null, p: Periodicidade | null): Decimal | null {
  if (!valor || !p) return null;
  const n = OCORRENCIAS[p];
  if (n === null) return null;
  return valor.mul(n).div(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

const CATEGORIAS: Record<string, string> = {
  telecomunicação: "TEC.TELECOM",
  infraestrutura: "TEC.INFRA",
  sistemas: "TEC.SIST",
  licenças: "TEC.LIC",
};

/** Deriva status a partir da coluna sem cabeçalho, da cor e das observações. */
function derivarStatus(
  statusTexto: string | null,
  cor: string | null,
  observacoes: string | null,
): StatusItem {
  const alvo = `${statusTexto ?? ""} ${observacoes ?? ""}`.toLowerCase();
  if (alvo.includes("substituído") || alvo.includes("substituido")) return "SUBSTITUIDO";
  if (alvo.includes("cancelado") || alvo.includes("valor antes do cancelamento")) return "CANCELADO";
  if (alvo.includes("solicitado cancelamento") || alvo.includes("cancelamento em"))
    return "CANCELAMENTO_SOLICITADO";
  if (alvo.includes("em análise") || alvo.includes("em analise") || alvo.includes("verificar"))
    return "EM_ANALISE";
  // Vermelho e amarelo marcavam cancelado / em análise na planilha.
  if (cor === "FFFF0000" || cor === "FFFF5050") return "EM_ANALISE";
  if (cor === "FFFFFF00") return "EM_ANALISE";
  return "ATIVO";
}

/** Palavras que denunciam informação estruturada escondida em "Observações". */
const PISTAS_OBSERVACAO: Array<{ campo: string; regex: RegExp }> = [
  { campo: "localização", regex: /auditório|rede acadêmica|rede administrativa|on premise/i },
  { campo: "quantidade", regex: /x\s*\d+\s*(colaborador|usuário|licen)|(\d+\s+impressoras)/i },
  { campo: "status/decisão", regex: /remoção|cancelamento|substituído|redução prevista|em análise/i },
  { campo: "responsável/área", regex: /\bDPO\b|NEAD|marketing|jurídico/i },
];

const normalizarTexto = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// ---------------------------------------------------------------------------
// Aba principal
// ---------------------------------------------------------------------------

function lerAbaPrincipal(ws: ExcelJS.Worksheet): LinhaNormalizada[] {
  const aba = ws.name;
  const saida: LinhaNormalizada[] = [];
  const vistos = new Map<string, number>();

  // Cabeçalho na linha 2; dados a partir da 3.
  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const categoria = texto(row.getCell(1));
    const fornecedor = texto(row.getCell(2));
    if (!categoria && !fornecedor) continue;

    const descricao = texto(row.getCell(3));
    const referencia = `${fornecedor ?? "?"} — ${descricao ?? "(sem descrição)"}`;

    const quantidade = numero(row.getCell(4));
    const unidadeNum = numero(row.getCell(5)); // deslocamento de coluna
    const valorUnitario = numero(row.getCell(6));
    const centroCusto = texto(row.getCell(7));
    const comportamentoTxt = texto(row.getCell(8));
    const valorCell = row.getCell(9);
    const valorNum = numero(valorCell);
    const valorTxt = texto(valorCell);
    const periodicidadeTxt = texto(row.getCell(11));
    const refPedido = texto(row.getCell(12));
    const refProposta = texto(row.getCell(13));
    const observacoes = texto(row.getCell(15));
    const statusTexto = texto(row.getCell(19));
    const cor = corPreenchimento(row.getCell(1)) ?? corPreenchimento(valorCell);

    // --- Regra 02: texto na coluna de dinheiro -------------------------------
    let valor: Decimal | null = null;
    let status = derivarStatus(statusTexto, cor, observacoes);

    if (valorNum !== null) {
      valor = new Decimal(valorNum);
    } else if (valorTxt !== null) {
      registrar({
        severidade: "critico",
        regra: "valor-nao-numerico",
        aba,
        linha: r,
        referencia,
        detalhe:
          `Coluna de valor contém texto (${JSON.stringify(valorTxt)}). ` +
          `O SUM da planilha ignora esta célula em silêncio — o total sai menor sem avisar.`,
      });
      if (/^\s*-+\s*$/.test(valorTxt)) status = "PENDENTE_APURACAO";
      else if (/calcular/i.test(valorTxt)) status = "PENDENTE_APURACAO";
      else if (/^c\.:/i.test(valorTxt)) status = "CANCELADO";
    } else {
      // --- Regra 05: linha sem valor ----------------------------------------
      registrar({
        severidade: "critico",
        regra: "sem-valor",
        aba,
        linha: r,
        referencia,
        detalhe:
          "Serviço registrado sem nenhum valor. É gratuito, é variável por consumo, ou ainda não foi levantado?",
      });
      status = status === "ATIVO" ? "PENDENTE_APURACAO" : status;
    }

    // --- Regra 03/04: periodicidade -----------------------------------------
    const periodicidade = normalizarPeriodicidade(periodicidadeTxt);
    if (valor && !periodicidade) {
      registrar({
        severidade: "critico",
        regra: "periodicidade-ausente",
        aba,
        linha: r,
        referencia,
        detalhe: periodicidadeTxt
          ? `Periodicidade não reconhecida (${JSON.stringify(periodicidadeTxt)}). Sem ela, o valor não é comparável.`
          : "Sem periodicidade declarada, mas com valor somado num total rotulado como mensal.",
      });
    } else if (valor && periodicidade && periodicidade !== "MENSAL") {
      registrar({
        severidade: "atencao",
        regra: "periodicidade-nao-mensal",
        aba,
        linha: r,
        referencia,
        detalhe:
          `Cobrança ${periodicidade}, mas somada ao "Total Geral" de contas mensais. ` +
          `Equivalente mensal: ${mensalNormalizado(valor, periodicidade)?.toFixed(2) ?? "—"}.`,
      });
    }

    // --- Regra 10: deslocamento de coluna ------------------------------------
    if (unidadeNum !== null && valorUnitario === null) {
      registrar({
        severidade: "atencao",
        regra: "coluna-deslocada",
        aba,
        linha: r,
        referencia,
        detalhe:
          `Valor numérico (${unidadeNum}) está na coluna UNID., e VALOR UNITÁRIO está vazia. ` +
          `Provável deslocamento de uma coluna.`,
      });
    }

    // --- Regra 07: aritmética qtd × unitário --------------------------------
    if (quantidade !== null && valorUnitario !== null && valor) {
      const esperado = new Decimal(quantidade).mul(valorUnitario);
      if (esperado.minus(valor).abs().greaterThan("0.05")) {
        registrar({
          severidade: "atencao",
          regra: "aritmetica-divergente",
          aba,
          linha: r,
          referencia,
          detalhe: `${quantidade} × ${valorUnitario} = ${esperado.toFixed(2)}, mas o total registrado é ${valor.toFixed(2)}.`,
        });
      }
    }

    // --- Regra 09: sem centro de custo --------------------------------------
    if (!centroCusto) {
      registrar({
        severidade: "critico",
        regra: "sem-centro-custo",
        aba,
        linha: r,
        referencia,
        detalhe: "Sem centro de custo e sem setor. Este custo não pode ser rateado nem atribuído a ninguém.",
      });
    }

    // --- Regra 08: significado guardado em cor ------------------------------
    if (cor && cor !== "FF000000" && !statusTexto) {
      registrar({
        severidade: "atencao",
        regra: "status-em-cor",
        aba,
        linha: r,
        referencia,
        detalhe: `Linha colorida (${cor}) sem status escrito. A cor não filtra, não soma e some em qualquer exportação.`,
      });
    }

    // --- Regra 06: cancelado ainda somando ----------------------------------
    if (valor && (status === "CANCELADO" || status === "CANCELAMENTO_SOLICITADO")) {
      registrar({
        severidade: "critico",
        regra: "cancelado-somado",
        aba,
        linha: r,
        referencia,
        detalhe: `Item com status ${status} e valor ${valor.toFixed(2)} entrando no total corrente.`,
      });
    }

    // --- Regra 11: duplicidade ----------------------------------------------
    if (fornecedor && descricao) {
      const chave = `${normalizarTexto(fornecedor)}|${normalizarTexto(descricao)}`;
      const anterior = vistos.get(chave);
      if (anterior) {
        registrar({
          severidade: "critico",
          regra: "duplicidade",
          aba,
          linha: r,
          referencia,
          detalhe: `Fornecedor e descrição idênticos aos da linha ${anterior}. São dois contratos ou contagem dupla?`,
        });
      } else {
        vistos.set(chave, r);
      }
    }

    // --- Regra 09: observação carregando campo estruturado ------------------
    if (observacoes) {
      const campos = PISTAS_OBSERVACAO.filter((p) => p.regex.test(observacoes)).map((p) => p.campo);
      if (campos.length > 0) {
        registrar({
          severidade: "info",
          regra: "observacao-estruturavel",
          aba,
          linha: r,
          referencia,
          detalhe: `"Observações" carrega ${campos.join(", ")} — cada um é um campo próprio no modelo.`,
        });
      }
    }

    // --- Regra: categoria desconhecida --------------------------------------
    if (categoria && !CATEGORIAS[categoria.toLowerCase()]) {
      registrar({
        severidade: "atencao",
        regra: "categoria-desconhecida",
        aba,
        linha: r,
        referencia,
        detalhe: `Categoria "${categoria}" não está no mapa de categorias e some dos agrupamentos por SUMIF.`,
      });
    }

    saida.push({
      aba,
      linha: r,
      categoria: categoria ? (CATEGORIAS[categoria.toLowerCase()] ?? categoria) : null,
      fornecedor,
      descricao,
      quantidade,
      valorUnitario: valorUnitario ?? unidadeNum,
      valorPeriodo: valor?.toFixed(2) ?? null,
      periodicidade,
      comportamento:
        comportamentoTxt?.toUpperCase() === "VARIÁVEL"
          ? "VARIAVEL"
          : comportamentoTxt?.toUpperCase() === "FIXO"
            ? "FIXO"
            : null,
      status,
      refPedido,
      refProposta,
      observacoes,
      valorMensalNormalizado: mensalNormalizado(valor, periodicidade)?.toFixed(2) ?? null,
    });
  }

  return saida;
}

// ---------------------------------------------------------------------------
// Aba de detalhamento (TOTVS)
// ---------------------------------------------------------------------------

function lerAbaDetalhe(ws: ExcelJS.Worksheet): LinhaNormalizada[] {
  const aba = ws.name;
  const saida: LinhaNormalizada[] = [];

  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const produto = texto(row.getCell(1));
    const descricao = texto(row.getCell(2));
    if (!produto || !descricao) continue;

    const quantidade = numero(row.getCell(3));
    const valorUnitario = numero(row.getCell(5));
    const valorTotal = numero(row.getCell(6));
    const proposta = texto(row.getCell(9));
    const observacoes = texto(row.getCell(10));
    const referencia = `${produto} — ${descricao}`;

    const status = derivarStatus(null, null, observacoes);
    const valor = valorTotal !== null ? new Decimal(valorTotal) : null;

    if (valor && (status === "CANCELADO" || status === "CANCELAMENTO_SOLICITADO")) {
      registrar({
        severidade: "critico",
        regra: "cancelado-somado",
        aba,
        linha: r,
        referencia,
        detalhe: `Marcado "${observacoes}" e ainda somando ${valor.toFixed(2)} ao total.`,
      });
    }

    if (quantidade !== null && valorUnitario !== null && valor) {
      const esperado = new Decimal(quantidade).mul(valorUnitario);
      if (esperado.minus(valor).abs().greaterThan("0.05")) {
        registrar({
          severidade: "info",
          regra: "aritmetica-divergente",
          aba,
          linha: r,
          referencia,
          detalhe: `${quantidade} × ${valorUnitario} = ${esperado.toFixed(2)} ≠ ${valor.toFixed(2)} (provável arredondamento do preço unitário).`,
        });
      }
    }

    saida.push({
      aba,
      linha: r,
      categoria: produto === "IaaS" ? "TEC.INFRA" : "TEC.SIST",
      fornecedor: "TOTVS",
      descricao,
      quantidade,
      valorUnitario,
      valorPeriodo: valor?.toFixed(2) ?? null,
      periodicidade: "MENSAL",
      comportamento: "FIXO",
      status,
      refPedido: null,
      refProposta: proposta,
      observacoes,
      valorMensalNormalizado: valor?.toFixed(2) ?? null,
    });
  }

  // Mesmo produto com preços unitários diferentes.
  const porProduto = new Map<string, Array<{ linha: number; unitario: number; proposta: string | null }>>();
  for (const l of saida) {
    if (l.valorUnitario === null || !l.descricao) continue;
    const lista = porProduto.get(l.descricao) ?? [];
    lista.push({ linha: l.linha, unitario: l.valorUnitario, proposta: l.refProposta });
    porProduto.set(l.descricao, lista);
  }
  for (const [produto, lista] of porProduto) {
    const precos = new Set(lista.map((l) => l.unitario));
    if (precos.size > 1) {
      registrar({
        severidade: "atencao",
        regra: "preco-divergente",
        aba,
        linha: lista[0].linha,
        referencia: produto,
        detalhe:
          `Mesmo produto com preços unitários distintos: ${[...precos].join(", ")} ` +
          `(propostas ${lista.map((l) => l.proposta ?? "?").join(", ")}). Reajuste, negociação diferente ou erro? Sem data, não dá para saber.`,
      });
    }
  }

  return saida;
}

// ---------------------------------------------------------------------------
// Dupla contagem entre abas
// ---------------------------------------------------------------------------

/**
 * A aba principal traz o TOTVS como UMA linha agregada, e outra aba detalha os
 * mesmos 33 itens. Somar as duas abas conta o mesmo dinheiro duas vezes — e na
 * planilha o valor agregado é um literal digitado à mão, não uma fórmula ligada
 * ao detalhe, então as duas versões podem divergir a qualquer momento.
 */
function detectarDuplaContagem(linhas: LinhaNormalizada[]): void {
  const porAba = new Map<string, LinhaNormalizada[]>();
  for (const l of linhas) porAba.set(l.aba, [...(porAba.get(l.aba) ?? []), l]);
  if (porAba.size < 2) return;

  for (const [aba, itens] of porAba) {
    const fornecedores = new Set(itens.map((i) => i.fornecedor).filter(Boolean));
    if (fornecedores.size !== 1) continue;

    const fornecedor = [...fornecedores][0]!;
    const somaDetalhe = itens.reduce(
      (acc, i) => (i.valorPeriodo ? acc.plus(i.valorPeriodo) : acc),
      new Decimal(0),
    );

    for (const outra of linhas) {
      if (outra.aba === aba) continue;
      if (normalizarTexto(outra.fornecedor ?? "") !== normalizarTexto(fornecedor)) continue;
      if (!outra.valorPeriodo) continue;

      const agregado = new Decimal(outra.valorPeriodo);
      const bate = agregado.minus(somaDetalhe).abs().lessThanOrEqualTo("0.05");
      outra.duplicaAba = aba;

      registrar({
        severidade: "critico",
        regra: "dupla-contagem-entre-abas",
        aba: outra.aba,
        linha: outra.linha,
        referencia: `${fornecedor} (linha agregada)`,
        detalhe: bate
          ? `Esta linha (${agregado.toFixed(2)}) é a soma da aba "${aba}" (${somaDetalhe.toFixed(2)}). ` +
            `Somar as duas abas conta o mesmo dinheiro duas vezes. Na planilha o agregado é um literal digitado, ` +
            `não uma fórmula — hoje bate, e vai divergir na primeira alteração do detalhe.`
          : `Esta linha (${agregado.toFixed(2)}) representa a aba "${aba}", cuja soma é ${somaDetalhe.toFixed(2)}. ` +
            `JÁ DIVERGEM em ${agregado.minus(somaDetalhe).abs().toFixed(2)}.`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

function gerarRelatorio(linhas: LinhaNormalizada[], arquivo: string): string {
  const soma = (ls: LinhaNormalizada[], campo: "valorPeriodo" | "valorMensalNormalizado") =>
    ls.reduce((acc, l) => (l[campo] ? acc.plus(l[campo]!) : acc), new Decimal(0));

  // Linhas agregadas que duplicam outra aba não entram em nenhum total.
  const uteis = linhas.filter((l) => !l.duplicaAba);
  const duplicadas = linhas.filter((l) => l.duplicaAba);

  const total = soma(uteis, "valorPeriodo");
  const normalizado = soma(uteis, "valorMensalNormalizado");

  // O que tem valor mas não pôde ser convertido para mensal por falta de
  // periodicidade. Sem isto no relatório, o total normalizado parece uma queda
  // de custo, quando é apenas dado faltando.
  const naoNormalizavel = uteis.filter((l) => l.valorPeriodo && !l.valorMensalNormalizado);
  const somaNaoNormalizavel = soma(naoNormalizavel, "valorPeriodo");

  const ativos = uteis.filter((l) => l.status === "ATIVO");
  const totalAtivos = soma(ativos, "valorMensalNormalizado");
  const naoAtivos = uteis.filter((l) => l.status !== "ATIVO");
  const somaNaoAtivos = soma(naoAtivos, "valorMensalNormalizado");

  const porSeveridade = (s: Severidade) => achados.filter((a) => a.severidade === s);
  const fmt = (d: Decimal) =>
    d.toNumber().toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const linhasMd: string[] = [];
  linhasMd.push("# Relatório de importação e inconsistências");
  linhasMd.push("");
  linhasMd.push(`Arquivo: \`${arquivo}\``);
  linhasMd.push("");
  linhasMd.push("## Resumo");
  linhasMd.push("");
  linhasMd.push("| Métrica | Valor |");
  linhasMd.push("| --- | ---: |");
  linhasMd.push(`| Linhas lidas | ${linhas.length} |`);
  linhasMd.push(`| Linhas descartadas por dupla contagem | ${duplicadas.length} (${fmt(soma(duplicadas, "valorPeriodo"))}) |`);
  linhasMd.push(`| Soma bruta das linhas úteis | ${fmt(total)} |`);
  linhasMd.push(`| **Não conversível para mensal** (sem periodicidade) | ${naoNormalizavel.length} linhas · ${fmt(somaNaoNormalizavel)} |`);
  linhasMd.push(`| Soma normalizada para mensal | ${fmt(normalizado)} |`);
  linhasMd.push(`| Itens não ativos ainda somando | ${naoAtivos.length} linhas · ${fmt(somaNaoAtivos)} |`);
  linhasMd.push(`| **Mensal comparável de itens ATIVOS** | ${fmt(totalAtivos)} |`);
  linhasMd.push(`| Achados críticos | ${porSeveridade("critico").length} |`);
  linhasMd.push(`| Achados de atenção | ${porSeveridade("atencao").length} |`);
  linhasMd.push(`| Achados informativos | ${porSeveridade("info").length} |`);
  linhasMd.push("");
  linhasMd.push(
    "> O total normalizado **não** é comparável com o \"Total Geral\" da planilha. " +
      "Ele exclui a dupla contagem entre abas, converte periodicidades para o equivalente mensal " +
      "e deixa de fora as linhas sem periodicidade declarada. A diferença é dado faltando, não economia.",
  );
  linhasMd.push("");

  for (const sev of ["critico", "atencao", "info"] as const) {
    const lista = porSeveridade(sev);
    if (lista.length === 0) continue;
    const titulo = { critico: "Críticos", atencao: "Atenção", info: "Informativos" }[sev];
    linhasMd.push(`## ${titulo} (${lista.length})`);
    linhasMd.push("");
    const porRegra = new Map<string, Achado[]>();
    for (const a of lista) porRegra.set(a.regra, [...(porRegra.get(a.regra) ?? []), a]);
    for (const [regra, itens] of [...porRegra].sort((a, b) => b[1].length - a[1].length)) {
      linhasMd.push(`### \`${regra}\` — ${itens.length} ocorrência(s)`);
      linhasMd.push("");
      for (const a of itens) {
        linhasMd.push(`- **${a.aba}** linha ${a.linha} · ${a.referencia}`);
        linhasMd.push(`  ${a.detalhe}`);
      }
      linhasMd.push("");
    }
  }

  return linhasMd.join("\n");
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

async function main() {
  const arquivo = process.argv[2];
  if (!arquivo) {
    console.error("Uso: npx tsx scripts/importar-planilha.ts <arquivo.xlsx> [--json]");
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(arquivo));

  const linhas: LinhaNormalizada[] = [];
  for (const ws of wb.worksheets) {
    const cabecalho = texto(ws.getRow(2).getCell(1))?.toUpperCase();
    if (cabecalho === "TIPO") linhas.push(...lerAbaPrincipal(ws));
    else if (cabecalho === "PRODUTO") linhas.push(...lerAbaDetalhe(ws));
    else {
      console.warn(`Aba ignorada (cabeçalho não reconhecido): ${ws.name}`);
    }
  }

  detectarDuplaContagem(linhas);

  const relatorio = gerarRelatorio(linhas, arquivo);
  const destinoMd = "dados/saida/relatorio-inconsistencias.md";
  const destinoJson = "dados/saida/staging.json";
  mkdirSync(dirname(destinoMd), { recursive: true });
  writeFileSync(destinoMd, relatorio, "utf8");
  writeFileSync(destinoJson, JSON.stringify({ linhas, achados }, null, 2), "utf8");

  console.log(relatorio.split("\n").slice(0, 22).join("\n"));
  console.log(`\nRelatório completo: ${destinoMd}`);
  console.log(`Dados normalizados: ${destinoJson}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
