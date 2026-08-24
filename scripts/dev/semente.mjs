/**
 * Os números da base de demonstração, num lugar só.
 *
 * Cada suíte de navegador precisa saber quantos itens `semear-demo.ts` cria, e
 * ter esse número escrito à mão em quatro arquivos significa que acrescentar um
 * custo à carga quebra três testes que não têm nada de errado. Pior: incentiva a
 * escrever a asserção frouxa ("menos que o total") para não precisar mexer — e
 * foi exatamente uma asserção frouxa que escondeu, por uma revisão inteira, um
 * gestor de setor enxergando a lista da FMP inteira.
 *
 * Mudou a carga? Muda aqui, e só aqui.
 */
export const SEMENTE = {
  /** Total de itens criados, incluindo o que está a apurar. */
  itens: 33,
  /** Recorrentes ativos — o que a aba padrão da lista mostra. */
  ativos: 26,
  /** Itens rateados 100% ao setor de TI, de todas as naturezas. */
  itensDeTI: 9,
  /** Destes, os recorrentes — o que a aba padrão da lista mostra. */
  recorrentesDeTI: 8,
  /** Em moeda estrangeira: um convertido, um ainda sem cotação. */
  emMoedaEstrangeira: 2,
  semCotacao: 1,
  /** Compras avulsas: duas em 2026, uma em 2025. */
  pontuais: 3,
  pontuaisEm2026: 2,
  /** Investimentos: dois datados em 2026, um sem data de aquisição. */
  investimentos: 3,
  investimentosEm2026: 2,
  semDataDeAquisicao: 1,
};
