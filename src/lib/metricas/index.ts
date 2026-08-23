/**
 * CAMADA SEMÂNTICA
 *
 * Toda métrica da plataforma é definida aqui, uma única vez. Dashboard,
 * relatório agendado, exportação e — na Fase 4 — a camada de IA consomem
 * exatamente estas funções.
 *
 * Duas regras que esta camada existe para garantir:
 *
 *  1. O mesmo número em todo lugar. Se o dashboard e o chat divergirem numa
 *     reunião, a plataforma perde credibilidade de uma vez.
 *  2. `natureza` é parâmetro OBRIGATÓRIO em toda métrica de valor. Consolidar
 *     RECORRENTE + PONTUAL + CAPEX + PESSOAL é sempre um ato explícito de quem
 *     chama, nunca um acidente de query.
 *
 * A IA nunca escreve SQL contra o banco: ela chama estas funções tipadas.
 */

export * from "./custo";
export * from "./tipos";
