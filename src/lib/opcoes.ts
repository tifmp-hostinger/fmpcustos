/** Rótulos em português para os enums, usados nos formulários e listagens. */

/**
 * As quatro naturezas do enum, todas.
 *
 * Esta lista já foi menor que o enum — só RECORRENTE e PONTUAL — e o efeito era
 * silencioso e grave: qualquer edição de um item CAPEX ou PESSOAL reenviava o
 * `<select>` com a primeira opção e reclassificava o item como RECORRENTE.
 * A tela corrompia classificação contábil por omissão.
 *
 * CAPEX e pessoal ainda não têm entidade própria (imobilizado, folha), mas a
 * natureza existe no banco desde o início justamente para que o dia em que
 * entrarem não exija remexer no que já foi lançado. Segregar é o requisito.
 */
export const NATUREZAS = [
  { valor: "RECORRENTE", rotulo: "Recorrente (assinatura, contrato, mensalidade)" },
  { valor: "PONTUAL", rotulo: "Pontual (compra avulsa, serviço único)" },
  { valor: "CAPEX", rotulo: "Investimento / CAPEX (bem que vira patrimônio)" },
  { valor: "PESSOAL", rotulo: "Pessoal (folha, encargos, benefícios)" },
];

/** Os valores válidos, derivados da lista acima — nunca redigitados. */
export const VALORES_NATUREZA = NATUREZAS.map((n) => n.valor) as [string, ...string[]];

export const ROTULOS_NATUREZA: Record<string, string> = Object.fromEntries(
  NATUREZAS.map((n) => [n.valor, n.rotulo]),
);

export const PERIODICIDADES = [
  { valor: "MENSAL", rotulo: "Mensal" },
  { valor: "BIMESTRAL", rotulo: "Bimestral" },
  { valor: "TRIMESTRAL", rotulo: "Trimestral" },
  { valor: "SEMESTRAL", rotulo: "Semestral" },
  { valor: "ANUAL", rotulo: "Anual" },
  { valor: "UNICO", rotulo: "Pagamento único" },
  { valor: "SOB_DEMANDA", rotulo: "Por consumo (varia todo mês)" },
];

export const COMPORTAMENTOS = [
  { valor: "FIXO", rotulo: "Fixo — o valor não muda" },
  { valor: "VARIAVEL", rotulo: "Variável — muda conforme o uso" },
];

export const STATUS_ITEM = [
  { valor: "ATIVO", rotulo: "Ativo" },
  { valor: "EM_ANALISE", rotulo: "Em análise" },
  { valor: "CANCELAMENTO_SOLICITADO", rotulo: "Cancelamento solicitado" },
  { valor: "CANCELADO", rotulo: "Cancelado" },
  { valor: "SUBSTITUIDO", rotulo: "Substituído por outro" },
  { valor: "PENDENTE_APURACAO", rotulo: "Valor a apurar" },
];

export const MOEDAS = [
  { valor: "BRL", rotulo: "Real (R$)" },
  { valor: "USD", rotulo: "Dólar (US$)" },
  { valor: "EUR", rotulo: "Euro (€)" },
];

export const PAPEIS = [
  { valor: "GESTOR_SETOR", rotulo: "Gestor de setor — lança e edita os custos da própria área" },
  { valor: "LEITOR", rotulo: "Leitor — só consulta os custos da própria área" },
  { valor: "CONTROLADORIA", rotulo: "Controladoria — consulta todos os setores" },
  {
    valor: "GESTOR_CONTRATO",
    rotulo: "Gestor de contrato — lança e edita os custos da própria área",
  },
  { valor: "ADMIN", rotulo: "Administrador — acesso total e gestão de usuários" },
];

export const ROTULOS_STATUS: Record<string, string> = Object.fromEntries(
  STATUS_ITEM.map((s) => [s.valor, s.rotulo]),
);

export const ROTULOS_PERIODICIDADE: Record<string, string> = Object.fromEntries(
  PERIODICIDADES.map((p) => [p.valor, p.rotulo]),
);
