import { normalizar } from "@/lib/fornecedores";

/**
 * REGRAS DE SETOR E CATEGORIA
 *
 * Puro, sem Prisma: as mesmas regras valem na tela (avisando antes de gravar) e
 * na action (recusando o que passou pela tela). Duas cópias da regra viram duas
 * interpretações na primeira divergência.
 */

/**
 * O código a partir do nome.
 *
 * `codigo` é obrigatório e único no banco. Pedir que a pessoa invente um produz
 * "CAT1", "cat2" e "X" — códigos que não dizem nada e que ninguém consegue ler
 * seis meses depois num relatório. Derivar do nome dá "SOFTWARE",
 * "COMUNICACAO-E-MARKETING", e continua editável para quem tem um código
 * institucional de verdade a usar.
 */
export function codigoDeNome(nome: string): string {
  const base = normalizar(nome)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 30) || "SEM-CODIGO";
}

/**
 * Um código livre, a partir de um que já existe.
 *
 * Sufixo numérico em vez de erro: quem cria "Software" numa base que já tem
 * "Software" (inativo, ou numa árvore diferente) não precisa aprender o que é
 * um código único para conseguir seguir.
 */
export function codigoLivre(desejado: string, ocupados: Set<string>): string {
  if (!ocupados.has(desejado)) return desejado;
  for (let n = 2; n < 1000; n++) {
    const tentativa = `${desejado.slice(0, 26)}-${n}`;
    if (!ocupados.has(tentativa)) return tentativa;
  }
  // Mil colisões no mesmo nome não acontecem por acaso; deixar estourar aqui é
  // melhor que devolver um código repetido e quebrar no banco.
  throw new Error(`Não consegui gerar um código livre para «${desejado}».`);
}

export type Existente = { id: string; nome: string; ativo: boolean };

/**
 * Um nome igual a outro que já existe, ignorando acento, caixa e pontuação.
 *
 * Devolve o registro colidente, não um booleano: a mensagem precisa dizer QUAL
 * — inclusive quando o colidente está inativo, que é o caso em que a pessoa
 * jura que não existe.
 */
export function mesmoNome(
  nome: string,
  existentes: Existente[],
  ignorarId?: string,
): Existente | null {
  const alvo = normalizar(nome);
  if (!alvo) return null;
  return existentes.find((e) => e.id !== ignorarId && normalizar(e.nome) === alvo) ?? null;
}

/**
 * O conjunto de ids que não podem ser pai deste registro.
 *
 * Um setor não pode ser pai de si mesmo, nem de quem já é ancestral dele: o
 * ciclo não dá erro na hora de gravar, mas trava qualquer travessia da árvore
 * depois — inclusive a que monta o próprio seletor.
 */
export function descendentes(id: string, filhosPorPai: Map<string | null, string[]>): Set<string> {
  const proibidos = new Set<string>([id]);
  const fila = [id];
  while (fila.length > 0) {
    const atual = fila.pop()!;
    for (const filho of filhosPorPai.get(atual) ?? []) {
      if (proibidos.has(filho)) continue;
      proibidos.add(filho);
      fila.push(filho);
    }
  }
  return proibidos;
}

export function agruparPorPai<T extends { id: string; paiId: string | null }>(
  registros: T[],
): Map<string | null, string[]> {
  const mapa = new Map<string | null, string[]>();
  for (const r of registros) {
    const atual = mapa.get(r.paiId) ?? [];
    atual.push(r.id);
    mapa.set(r.paiId, atual);
  }
  return mapa;
}

/**
 * O que impede um registro de ser apagado de verdade.
 *
 * Apagar um setor que tem rateio apagaria dinheiro com dono. Mas manter para
 * sempre um setor criado por engano, com o nome errado, também é errado — e é
 * o que acontece quando a única saída é "inativar". Aqui a regra é explícita:
 * nunca usado pode sumir; usado uma vez fica, inativo, para o histórico
 * continuar legível.
 */
export function podeApagar(
  /** Rótulo no plural → quantidade. O singular é derivado; ver `umDe`. */
  uso: Record<string, number>,
): { pode: boolean; motivo: string | null } {
  const usado = Object.entries(uso).filter(([, n]) => n > 0);
  if (usado.length === 0) return { pode: true, motivo: null };

  const partes = usado.map(([oQue, n]) => `${n} ${n === 1 ? umDe(oQue) : oQue}`);
  return {
    pode: false,
    motivo: `Já foi usado: ${partes.join(", ")}. Inativar mantém o histórico legível; apagar o deixaria sem sentido.`,
  };
}

/**
 * O singular de um rótulo de uso.
 *
 * "1 subsetores" e "1 pessoas lotadas" são o tipo de descuido que faz uma tela
 * cuidadosa parecer descuidada.
 *
 * A lista é explícita de propósito. Flexionar português por regra geral —
 * "-ores" → "-or", "-ões" → "-ão", "-is" → "-il" — é um poço sem fundo que
 * acerta a maioria e erra em silêncio no resto; aqui o conjunto de rótulos é
 * pequeno, fechado e conhecido, e nomeá-los um a um é mais curto que a regra.
 */
function umDe(plural: string): string {
  const irregulares: Record<string, string> = {
    "custos rateados": "custo rateado",
    "pessoas lotadas": "pessoa lotada",
    "centros de custo": "centro de custo",
    "acessos de usuário": "acesso de usuário",
    "fatias em proposta": "fatia em proposta",
    "modelos de rateio": "modelo de rateio",
    subsetores: "subsetor",
  };
  if (irregulares[plural]) return irregulares[plural];
  return plural.endsWith("s") ? plural.slice(0, -1) : plural;
}
