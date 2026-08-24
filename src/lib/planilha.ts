import { lerValorDigitado } from "@/lib/dinheiro";
import type { Periodicidade } from "@/generated/prisma/enums";

/**
 * COLAR DA PLANILHA
 *
 * Todo custo da FMP já existe numa aba de Excel em algum lugar — foi de lá que
 * este sistema nasceu. Para quem tem trinta linhas prontas, qualquer melhoria
 * no formulário de cadastro é irrelevante: o que resolve é colar as trinta.
 *
 * Este módulo é puro e não conhece banco nem React. Ele só responde: dado este
 * texto colado, o que dá para entender de cada linha, e o que não dá. A
 * decisão de gravar é de quem está olhando a prévia.
 *
 * Regra que atravessa tudo: **nunca inventar**. Célula ilegível vira problema
 * declarado na linha, nunca um valor plausível chutado. Uma planilha com trinta
 * linhas e um erro silencioso é pior que uma com trinta linhas e um aviso.
 */

/** Os campos que o importador sabe preencher. */
export const CAMPOS = [
  { chave: "descricao", rotulo: "Descrição", obrigatorio: true },
  { chave: "fornecedor", rotulo: "Fornecedor", obrigatorio: false },
  { chave: "valorPeriodo", rotulo: "Valor", obrigatorio: false },
  { chave: "periodicidade", rotulo: "Periodicidade", obrigatorio: false },
  { chave: "categoria", rotulo: "Categoria", obrigatorio: false },
  { chave: "dataFim", rotulo: "Renova em", obrigatorio: false },
  { chave: "quantidade", rotulo: "Quantidade", obrigatorio: false },
  { chave: "observacoes", rotulo: "Observações", obrigatorio: false },
] as const;

export type ChaveCampo = (typeof CAMPOS)[number]["chave"];
/** Índice da coluna colada para cada campo; -1 quando o campo não veio. */
export type Mapa = Record<ChaveCampo, number>;

export const MAPA_VAZIO: Mapa = {
  descricao: -1,
  fornecedor: -1,
  valorPeriodo: -1,
  periodicidade: -1,
  categoria: -1,
  dataFim: -1,
  quantidade: -1,
  observacoes: -1,
};

/** Teto de linhas por colagem. Acima disso, a prévia deixa de ser conferível. */
export const MAXIMO_LINHAS = 200;

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Quebra o texto colado em células.
 *
 * Excel, Google Sheets e LibreOffice colam separado por TAB. Só quando não há
 * nenhum TAB é que se tenta ponto e vírgula (CSV brasileiro) — a vírgula
 * jamais, porque ela é o separador decimal daqui e partiria "1.234,56" ao meio.
 */
export function separarCelulas(colado: string): string[][] {
  const linhas = colado
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");

  const temTab = linhas.some((l) => l.includes("\t"));
  const separador = temTab ? "\t" : linhas.some((l) => l.includes(";")) ? ";" : "\t";

  return linhas.map((linha) =>
    linha.split(separador).map((c) =>
      c
        .trim()
        .replace(/^"(.*)"$/, "$1")
        .trim(),
    ),
  );
}

/**
 * Casa a pista como PALAVRA INTEIRA quando ela é alfabética.
 *
 * Com `includes` solto, "trimestral" contém "mes" e caía em MENSAL — junto com
 * "bimestral" e "semestral". Um contrato trimestral lido como mensal multiplica
 * o custo anual por três, e ninguém percebe olhando a lista.
 */
function casaPista(texto: string, pista: string): boolean {
  const alvo = semAcento(pista);
  if (!/^[a-z]+$/.test(alvo)) return texto.includes(alvo);
  return new RegExp(`\\b${alvo}\\b`).test(texto);
}

/** Palavras de cabeçalho que denunciam cada campo. */
const PISTAS: Record<ChaveCampo, string[]> = {
  descricao: ["descricao", "descrição", "item", "custo", "servico", "serviço", "produto", "nome"],
  fornecedor: ["fornecedor", "empresa", "prestador", "contratada", "vendor"],
  valorPeriodo: ["valor", "preco", "preço", "custo mensal", "mensalidade", "r$", "total"],
  periodicidade: ["periodicidade", "frequencia", "frequência", "recorrencia", "recorrência"],
  categoria: ["categoria", "tipo", "classificacao", "classificação", "grupo"],
  dataFim: ["renova", "vencimento", "vence", "termino", "término", "fim", "validade", "data fim"],
  quantidade: ["quantidade", "qtd", "qtde", "licencas", "licenças", "usuarios", "usuários"],
  observacoes: ["observacao", "observação", "observacoes", "observações", "obs", "nota"],
};

/**
 * A primeira linha é cabeçalho?
 *
 * Só se nenhuma célula dela parecer um valor monetário e ao menos uma bater
 * com uma pista conhecida. Tratar dado como cabeçalho perde uma linha em
 * silêncio, que é o tipo de perda que ninguém confere.
 */
export function pareceCabecalho(primeira: string[]): boolean {
  if (primeira.length === 0) return false;
  const temDinheiro = primeira.some((c) => /\d/.test(c) && lerValorDigitado(c) !== null);
  if (temDinheiro) return false;
  const normalizadas = primeira.map(semAcento);
  return Object.values(PISTAS).some((pistas) =>
    normalizadas.some((c) => c !== "" && pistas.some((p) => casaPista(c, p))),
  );
}

/** Casa cada campo com a coluna cujo cabeçalho mais se parece com ele. */
export function detectarColunas(cabecalho: string[]): Mapa {
  const mapa: Mapa = { ...MAPA_VAZIO };
  const usadas = new Set<number>();
  const normalizadas = cabecalho.map(semAcento);

  for (const { chave } of CAMPOS) {
    const indice = normalizadas.findIndex(
      (c, i) => !usadas.has(i) && c !== "" && PISTAS[chave].some((p) => casaPista(c, p)),
    );
    if (indice >= 0) {
      mapa[chave] = indice;
      usadas.add(indice);
    }
  }
  return mapa;
}

const PERIODICIDADES: Array<{ valor: Periodicidade; pistas: string[] }> = [
  { valor: "MENSAL", pistas: ["mensal", "mes", "mês", "monthly", "/m"] },
  { valor: "BIMESTRAL", pistas: ["bimestral", "bimestre"] },
  { valor: "TRIMESTRAL", pistas: ["trimestral", "trimestre", "quarterly"] },
  { valor: "SEMESTRAL", pistas: ["semestral", "semestre"] },
  { valor: "ANUAL", pistas: ["anual", "ano", "yearly", "/a"] },
  { valor: "UNICO", pistas: ["unico", "único", "avulso", "pontual", "uma vez"] },
  { valor: "SOB_DEMANDA", pistas: ["consumo", "demanda", "variavel", "variável", "uso"] },
];

export function lerPeriodicidade(celula: string): Periodicidade | null {
  const t = semAcento(celula);
  if (t === "") return null;
  for (const { valor, pistas } of PERIODICIDADES) {
    if (pistas.some((p) => casaPista(t, p))) return valor;
  }
  return null;
}

/**
 * Lê datas nos formatos que aparecem numa planilha brasileira.
 *
 * Ano de dois dígitos é recusado de propósito: "01/02/26" pode ser 2026 ou
 * 1926, e uma data de renovação errada em cem anos passa despercebida até o
 * alerta de vencimento nunca disparar.
 */
export function lerData(celula: string): Date | null {
  const t = celula.trim();
  if (t === "") return null;

  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return montarData(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const br = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (br) return montarData(Number(br[3]), Number(br[2]), Number(br[1]));

  return null;
}

function montarData(ano: number, mes: number, dia: number): Date | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 2000 || ano > 2100) return null;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  // Rejeita 31/02: o Date rola para março em silêncio.
  if (data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return data;
}

export type LinhaLida = {
  /** Número da linha como a pessoa a vê na prévia, começando em 1. */
  numero: number;
  descricao: string;
  fornecedor: string | null;
  valorPeriodo: string | null;
  periodicidade: Periodicidade;
  categoria: string | null;
  dataFim: Date | null;
  quantidade: number | null;
  observacoes: string | null;
  /** O que impede esta linha de virar custo. Vazio = pronta para gravar. */
  problemas: string[];
  /** O que foi entendido de um jeito que merece conferência antes de gravar. */
  avisos: string[];
};

const pega = (celulas: string[], indice: number): string =>
  indice >= 0 && indice < celulas.length ? celulas[indice] : "";

/**
 * Interpreta uma linha colada.
 *
 * Célula preenchida que não dá para ler vira **problema**, não silêncio: um
 * valor ilegível descartado sem aviso é exatamente como um custo some da
 * planilha para dentro do sistema.
 */
export function interpretarLinha(celulas: string[], mapa: Mapa, numero: number): LinhaLida {
  const problemas: string[] = [];
  const avisos: string[] = [];

  const descricao = pega(celulas, mapa.descricao).slice(0, 300);
  if (!descricao) problemas.push("sem descrição");

  const fornecedorBruto = pega(celulas, mapa.fornecedor).slice(0, 150);
  const fornecedor = fornecedorBruto || null;
  if (!fornecedor) avisos.push("sem fornecedor");

  const valorBruto = pega(celulas, mapa.valorPeriodo);
  const valorPeriodo = valorBruto === "" ? null : lerValorDigitado(valorBruto);
  if (valorBruto !== "" && valorPeriodo === null) {
    problemas.push(`não consegui ler «${valorBruto}» como valor`);
  }
  if (valorBruto === "") avisos.push("sem valor — entra como “a apurar”");

  const periodicidadeBruta = pega(celulas, mapa.periodicidade);
  const lida = lerPeriodicidade(periodicidadeBruta);
  if (periodicidadeBruta !== "" && lida === null) {
    problemas.push(`não reconheci a periodicidade «${periodicidadeBruta}»`);
  }
  // Sem coluna de periodicidade, mensal é o padrão do domínio — e o aviso
  // conta isso, para ninguém descobrir depois que um contrato anual foi
  // multiplicado por doze.
  if (periodicidadeBruta === "" && mapa.periodicidade === -1) avisos.push("assumindo mensal");
  const periodicidade: Periodicidade = lida ?? "MENSAL";

  const dataBruta = pega(celulas, mapa.dataFim);
  const dataFim = dataBruta === "" ? null : lerData(dataBruta);
  if (dataBruta !== "" && dataFim === null) {
    problemas.push(`não consegui ler «${dataBruta}» como data (use 31/12/2026)`);
  }

  const qtdBruta = pega(celulas, mapa.quantidade);
  const numeroQtd = qtdBruta === "" ? null : Number(qtdBruta.replace(",", "."));
  if (qtdBruta !== "" && (numeroQtd === null || !Number.isFinite(numeroQtd) || numeroQtd < 0)) {
    problemas.push(`quantidade «${qtdBruta}» inválida`);
  }

  return {
    numero,
    descricao,
    fornecedor,
    valorPeriodo,
    periodicidade,
    categoria: pega(celulas, mapa.categoria) || null,
    dataFim,
    quantidade:
      numeroQtd !== null && Number.isFinite(numeroQtd) && numeroQtd >= 0 ? numeroQtd : null,
    observacoes: pega(celulas, mapa.observacoes).slice(0, 2000) || null,
    problemas,
    avisos,
  };
}

export type Leitura = {
  cabecalho: string[] | null;
  mapa: Mapa;
  linhas: LinhaLida[];
  /** Linhas além do teto, que foram cortadas da leitura. */
  cortadas: number;
  colunas: number;
};

/** Lê o texto colado inteiro: detecta cabeçalho, mapeia colunas, interpreta. */
export function lerColagem(colado: string, mapaManual?: Mapa): Leitura {
  const celulas = separarCelulas(colado);
  if (celulas.length === 0) {
    return { cabecalho: null, mapa: { ...MAPA_VAZIO }, linhas: [], cortadas: 0, colunas: 0 };
  }

  const temCabecalho = pareceCabecalho(celulas[0]);
  const cabecalho = temCabecalho ? celulas[0] : null;
  const corpo = temCabecalho ? celulas.slice(1) : celulas;

  let mapa = mapaManual ?? (cabecalho ? detectarColunas(cabecalho) : { ...MAPA_VAZIO });
  // Sem cabeçalho reconhecível, a primeira coluna é a descrição: é a única
  // suposição segura, e a pessoa corrige nos seletores acima da prévia.
  if (!mapaManual && mapa.descricao === -1) mapa = { ...mapa, descricao: 0 };

  const usadas = corpo.slice(0, MAXIMO_LINHAS);
  return {
    cabecalho,
    mapa,
    linhas: usadas.map((c, i) => interpretarLinha(c, mapa, i + 1)),
    cortadas: corpo.length - usadas.length,
    colunas: Math.max(...celulas.map((c) => c.length)),
  };
}
