import { lerValorDigitado } from "@/lib/dinheiro";
import type { Natureza, Periodicidade } from "@/generated/prisma/enums";

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
  { chave: "natureza", rotulo: "Natureza", obrigatorio: false },
  { chave: "categoria", rotulo: "Categoria", obrigatorio: false },
  { chave: "dataInicio", rotulo: "Começou em", obrigatorio: false },
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
  natureza: -1,
  categoria: -1,
  dataInicio: -1,
  dataFim: -1,
  quantidade: -1,
  observacoes: -1,
};

/**
 * Teto de linhas por colagem. Acima disso, a prévia deixa de ser conferível.
 *
 * Subiu de 200 para 300 porque a menor planilha setorial real que chegou aqui
 * tem 172 linhas numa aba só, e uma segunda aba do mesmo setor passaria do
 * teto antigo na primeira tentativa.
 */
export const MAXIMO_LINHAS = 300;

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
  natureza: ["natureza"],
  categoria: ["categoria", "tipo", "classificacao", "classificação", "grupo"],
  dataInicio: [
    "inicio",
    "início",
    "data inicio",
    "data de inicio",
    "aquisicao",
    "aquisição",
    "adquirido",
    "emissao",
    "emissão",
  ],
  // "vencimento" e "vence" NÃO entram aqui, e a ausência é a correção.
  //
  // Numa planilha de custos essas palavras quase sempre encabeçam a data do
  // BOLETO, não o fim do contrato — a planilha de Marketing que chegou aqui
  // tem uma coluna "VENCIMENTO" em todas as 76 linhas de lançamento, com a
  // data de cada cobrança. Lidas como `dataFim`, cada boleto virava data de
  // renovação de contrato e ia alimentar o alerta de vencimento com ruído.
  //
  // Quem realmente quer dizer "o contrato termina aqui" escolhe "Renova em"
  // no seletor, e `colunasAmbiguas` avisa quando essa coluna ficou de fora.
  dataFim: ["renova", "termino", "término", "fim", "validade", "data fim", "expira"],
  quantidade: ["quantidade", "qtd", "qtde", "licencas", "licenças", "usuarios", "usuários"],
  observacoes: ["observacao", "observação", "observacoes", "observações", "obs", "nota"],
};

/** Cabeçalhos que a gente se recusa a adivinhar, e o motivo dito em português. */
const AMBIGUAS: Array<{ pistas: string[]; recado: string }> = [
  {
    pistas: ["vencimento", "vence", "venc"],
    recado:
      "pode ser a data do boleto ou o fim do contrato. Se for o fim do contrato, aponte esta coluna para “Renova em”.",
  },
  {
    pistas: ["competencia", "competência", "mes de referencia", "mês de referência"],
    recado:
      "é o mês de uma cobrança, não uma data do item. Colagem de cadastro não guarda competência.",
  },
];

/**
 * Colunas que existem, parecem carregar data e ninguém mapeou.
 *
 * Existe porque o silêncio é o pior desfecho aqui: a coluna “Vencimento” não é
 * mais adivinhada, e sem este aviso a pessoa acharia que o sistema não viu a
 * data que ela colou.
 */
export function colunasAmbiguas(
  cabecalho: string[] | null,
  mapa: Mapa,
): Array<{ indice: number; titulo: string; recado: string }> {
  if (!cabecalho) return [];
  const mapeadas = new Set(Object.values(mapa).filter((i) => i >= 0));
  const achados: Array<{ indice: number; titulo: string; recado: string }> = [];

  cabecalho.forEach((titulo, indice) => {
    if (mapeadas.has(indice) || titulo.trim() === "") return;
    const normalizado = semAcento(titulo);
    const ambigua = AMBIGUAS.find((a) => a.pistas.some((p) => casaPista(normalizado, p)));
    if (ambigua) achados.push({ indice, titulo, recado: ambigua.recado });
  });

  return achados;
}

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
 * As quatro naturezas, na ordem em que precisam ser testadas.
 *
 * RECORRENTE vem por último de propósito: "contrato pontual" e "compra de
 * imobilizado" contêm palavras das duas listas, e quem manda é a mais
 * específica.
 */
const NATUREZAS: Array<{ valor: Natureza; pistas: string[] }> = [
  { valor: "PESSOAL", pistas: ["pessoal", "folha", "salario", "salário", "encargo", "rescisao"] },
  { valor: "CAPEX", pistas: ["capex", "investimento", "imobilizado", "permanente", "ativo fixo"] },
  {
    valor: "PONTUAL",
    pistas: ["pontual", "avulso", "avulsa", "eventual", "compra unica", "compra única", "uma vez"],
  },
  {
    valor: "RECORRENTE",
    pistas: ["recorrente", "assinatura", "mensalidade", "custeio", "contrato", "continuado"],
  },
];

export function lerNatureza(celula: string): Natureza | null {
  const t = semAcento(celula);
  if (t === "") return null;
  for (const { valor, pistas } of NATUREZAS) {
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
  natureza: Natureza;
  categoria: string | null;
  dataInicio: Date | null;
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

  // NATUREZA
  //
  // Antes desta versão a colagem gravava RECORRENTE em tudo, sem coluna e sem
  // escolha. Numa planilha de Marketing com 153 compras avulsas isso somaria
  // mais de um milhão de reais por mês ao custo recorrente da fundação — cada
  // brinde comprado uma vez virando mensalidade eterna.
  //
  // Sem coluna, a natureza sai da periodicidade: pagamento único é compra,
  // qualquer outra coisa é custeio contínuo. E o aviso diz que foi derivado.
  const naturezaBruta = pega(celulas, mapa.natureza);
  const naturezaLida = lerNatureza(naturezaBruta);
  if (naturezaBruta !== "" && naturezaLida === null) {
    problemas.push(
      `não reconheci a natureza «${naturezaBruta}» (use recorrente, pontual, capex ou pessoal)`,
    );
  }
  const natureza: Natureza = naturezaLida ?? (periodicidade === "UNICO" ? "PONTUAL" : "RECORRENTE");
  if (naturezaLida === null && periodicidade === "UNICO") {
    avisos.push("pagamento único — entra como compra pontual, não como custo recorrente");
  }
  if (naturezaLida === "RECORRENTE" && periodicidade === "UNICO") {
    problemas.push("custo recorrente com pagamento único: escolha uma das duas coisas");
  }

  const inicioBruto = pega(celulas, mapa.dataInicio);
  const dataInicio = inicioBruto === "" ? null : lerData(inicioBruto);
  if (inicioBruto !== "" && dataInicio === null) {
    problemas.push(`não consegui ler «${inicioBruto}» como data de início (use 31/12/2026)`);
  }

  const dataBruta = pega(celulas, mapa.dataFim);
  const dataFim = dataBruta === "" ? null : lerData(dataBruta);
  if (dataBruta !== "" && dataFim === null) {
    problemas.push(`não consegui ler «${dataBruta}» como data (use 31/12/2026)`);
  }

  // Compra sem data de aquisição não entra em recorte de exercício nenhum, e
  // a fila de pendências vai cobrar essa data para sempre. Melhor avisar
  // enquanto a planilha de origem ainda está aberta na frente da pessoa.
  if ((natureza === "PONTUAL" || natureza === "CAPEX") && dataInicio === null) {
    avisos.push("compra sem data de aquisição — vai aparecer como pendência");
  }
  if (natureza === "PONTUAL" && dataFim !== null) {
    avisos.push("compra única com data de renovação — confira se não é a data do boleto");
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
    natureza,
    categoria: pega(celulas, mapa.categoria) || null,
    dataInicio,
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
  /** Colunas com cabeçalho de data que ninguém mapeou, e o porquê. */
  ambiguas: Array<{ indice: number; titulo: string; recado: string }>;
};

/**
 * Soma dos valores lidos, para a pessoa conferir contra o total da planilha.
 *
 * Existe porque a prévia responde "entendi trinta linhas" e não responde
 * "entendi o mesmo dinheiro". Uma coluna mapeada errada mantém a contagem de
 * linhas e muda o total — é a única checagem que pega isso antes de gravar.
 *
 * Soma o valor de CADA COBRANÇA, sem normalizar periodicidade: é o número que
 * está na coluna da planilha, e é contra ele que a pessoa vai comparar.
 */
export function somaColada(linhas: LinhaLida[]): { total: string; comValor: number; semValor: number } {
  let centavos = 0n;
  let comValor = 0;
  let semValor = 0;

  for (const linha of linhas) {
    if (linha.valorPeriodo === null) {
      semValor++;
      continue;
    }
    comValor++;
    // O valor já vem como "1234.56" de lerValorDigitado. Somar em centavos
    // inteiros evita o erro de ponto flutuante que a planilha de origem já
    // carrega nos próprios totais.
    const [reais, cents = "0"] = linha.valorPeriodo.split(".");
    centavos += BigInt(reais) * 100n + BigInt(cents.padEnd(2, "0").slice(0, 2));
  }

  const negativo = centavos < 0n;
  const abs = negativo ? -centavos : centavos;
  const total = `${negativo ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
  return { total, comValor, semValor };
}

/** Lê o texto colado inteiro: detecta cabeçalho, mapeia colunas, interpreta. */
export function lerColagem(colado: string, mapaManual?: Mapa): Leitura {
  const celulas = separarCelulas(colado);
  if (celulas.length === 0) {
    return {
      cabecalho: null,
      mapa: { ...MAPA_VAZIO },
      linhas: [],
      cortadas: 0,
      colunas: 0,
      ambiguas: [],
    };
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
    ambiguas: colunasAmbiguas(cabecalho, mapa),
  };
}
