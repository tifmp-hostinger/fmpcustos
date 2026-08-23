/**
 * CAMADA SEMÂNTICA
 *
 * Toda métrica da plataforma é definida aqui, uma única vez. Dashboard,
 * relatório agendado, exportação e — na fase de IA — o modelo consomem
 * exatamente estas funções, nunca SQL solto.
 *
 * Duas regras que esta camada existe para garantir:
 *
 *  1. O mesmo número em todo lugar. Se o dashboard e o chat divergirem numa
 *     reunião, a plataforma perde credibilidade de uma vez.
 *  2. `natureza` é parâmetro OBRIGATÓRIO em toda métrica de valor. Consolidar
 *     RECORRENTE + PONTUAL + CAPEX + PESSOAL é sempre um ato explícito de quem
 *     chama, nunca um acidente de query.
 *
 * Duas famílias, deliberadamente separadas:
 *
 *  - `corrente` — lê o cadastro. É o *run-rate* declarado: quanto a FMP se
 *    comprometeu a pagar por mês com o que está cadastrado hoje. É o que
 *    responde enquanto não houver fechamento mensal.
 *  - `competencia` — lê a série de lançamentos por mês. É o que responde
 *    "aumentou nos últimos meses" e "orçado × realizado", e só passa a ter
 *    resposta depois do primeiro fechamento.
 */

export * from "./tipos";
export * from "./corrente";
export * as competencia from "./custo";
