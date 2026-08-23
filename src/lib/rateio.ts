import { Decimal } from "decimal.js";

/**
 * ARITMÉTICA DO RATEIO
 *
 * Aqui está a decisão de projeto mais importante da tela de rateio: **uma das
 * fatias é a âncora e recebe o que sobrar**. O estado "110%" não é validado —
 * ele deixa de ser representável.
 *
 * Por que âncora e não rebalanceamento proporcional. O pedido original foi
 * "tenho 100 num setor, adiciono outro de 10, quero 90 e 10". A leitura óbvia
 * seria reduzir todas as fatias na proporção. Ela é a errada por três motivos
 * concretos:
 *
 *  1. Mexer numa fatia recalcularia todas as outras. Um rateio 33,33/33,33/33,34
 *     que o gestor considerava fechado viraria 29,997 e companhia. Em contexto
 *     contábil isso não parece recurso, parece defeito.
 *  2. Não é reversível. Uma fatia que chega a 0% nunca mais recebe de volta,
 *     porque 0 × qualquer proporção continua 0.
 *  3. Quebra por divisão por zero quando as demais fatias somam 0.
 *
 * A âncora entrega o exemplo pedido literalmente — TI 100, entra Comercial com
 * 10, TI vai a 90 — sem nenhuma dessas armadilhas. É a mecânica dos splits de
 * folha de pagamento (ADP, Gusto, Workday) e do Salesforce Opportunity Splits:
 * transformar N variáveis com restrição global em N−1 variáveis livres.
 *
 * Tudo é inteiro. Percentual em ponto flutuante acumula erro e faz a soma
 * fechar em 99,99999999999999 — que é exatamente o problema que esta tela
 * existe para eliminar.
 */

/** 1% = 10.000 unidades. Quatro casas decimais, iguais às do banco (Decimal 7,4). */
export const ESCALA = 10_000;
/** O todo, em unidades. */
export const TOTAL = 100 * ESCALA;
/**
 * Fatia mínima: 0,50%. Abaixo disso a linha é removida em vez de virar 0% —
 * uma fatia de 0,004% num custo de R$ 1.200 aloca meio centavo por mês e só
 * serve para poluir a prestação de contas.
 */
export const MINIMO = 0.5 * ESCALA;
/** Teto de linhas: os treze setores da FMP. */
export const MAXIMO_FATIAS = 13;

export type Fatia = {
  setorId: string;
  /** Percentual em unidades de 0,0001pp. Ignorado quando `ancora` é true. */
  unidades: number;
  /** A fatia que absorve o restante. Exatamente uma por rateio. */
  ancora: boolean;
};

/**
 * Lê o percentual como a pessoa digita: "60", "60,5", "60.5", "60,50%".
 * Devolve null quando não dá para ler — jamais 0, que seria uma fatia real.
 */
export function unidadesDeTexto(entrada: string): number | null {
  const limpo = entrada.trim().replace("%", "").replace(",", ".");
  if (limpo === "") return null;
  if (!/^\d*\.?\d*$/.test(limpo)) return null;
  const numero = Number(limpo);
  if (!Number.isFinite(numero) || numero < 0) return null;
  // Arredonda na entrada, não na exibição: guardar 60,004 e mostrar 60,00 faz
  // a soma parecer errada por um resíduo que a pessoa nunca viu.
  return Math.round(numero * ESCALA);
}

/** Formata para exibição e edição: sempre duas casas, vírgula decimal. */
export function textoDeUnidades(unidades: number): string {
  return (unidades / ESCALA).toFixed(2).replace(".", ",");
}

/** Formato do banco: quatro casas, ponto decimal. */
export function percentualParaBanco(unidades: number): string {
  return (unidades / ESCALA).toFixed(4);
}

export function unidadesDeBanco(percentual: Decimal.Value): number {
  return Math.round(new Decimal(percentual).mul(ESCALA).toNumber());
}

export type Balanco = {
  /** As fatias com a âncora já resolvida. */
  fatias: Fatia[];
  /** Quanto a âncora ficou. Negativo = as livres passaram de 100%. */
  ancora: number;
  /** Índice da âncora, ou -1 se não houver. */
  indiceAncora: number;
  /** Soma das fatias livres. */
  livres: number;
  fecha: boolean;
};

/**
 * Resolve a âncora: ela recebe 100% menos a soma das demais.
 *
 * Nunca sobra e nunca falta — a soma fecha por construção, não por validação.
 * Quando a âncora ficaria negativa, o balanço é devolvido com o número negativo
 * em vez de ser corrigido: a tela precisa desse valor para dizer, na linha
 * culpada, quanto ainda resta.
 */
export function balancear(fatias: Fatia[]): Balanco {
  const indiceAncora = fatias.findIndex((f) => f.ancora);
  const livres = fatias.reduce((s, f, i) => (i === indiceAncora ? s : s + f.unidades), 0);

  if (indiceAncora === -1) {
    return { fatias, ancora: 0, indiceAncora, livres, fecha: livres === TOTAL };
  }

  const ancora = TOTAL - livres;
  return {
    fatias: fatias.map((f, i) => (i === indiceAncora ? { ...f, unidades: ancora } : f)),
    ancora,
    indiceAncora,
    livres,
    fecha: ancora >= 0,
  };
}

/**
 * Divisão igual pelo método do maior resto (Hamilton).
 *
 * Três fatias de 33,3333% somam 99,9999%. O maior resto distribui o que sobra
 * de 1 em 1 unidade, então três fatias viram 33,3334 / 33,3333 / 33,3333 —
 * exibidas como 33,33% e somando exatamente 100%.
 *
 * Só se aplica onde o sistema gera o número. Sobre percentual que a pessoa
 * digitou, mexer no último dígito é alterar o que ela escreveu.
 */
export function dividirIgualmente(quantidade: number): number[] {
  if (quantidade <= 0) return [];
  const base = Math.floor(TOTAL / quantidade);
  const resto = TOTAL - base * quantidade;
  return Array.from({ length: quantidade }, (_, i) => base + (i < resto ? 1 : 0));
}

/**
 * Distribui o valor em reais entre as fatias.
 *
 * As fatias livres são arredondadas a duas casas e **a âncora recebe a
 * subtração exata**: total menos a soma das demais. É assim que o centavo do
 * arredondamento tem dono em vez de sumir — e a tela diz de quem ele é.
 */
export function valoresEmReais(
  fatias: Fatia[],
  valorTotal: Decimal.Value | null | undefined,
): Array<Decimal | null> {
  if (valorTotal === null || valorTotal === undefined) return fatias.map(() => null);

  const total = new Decimal(valorTotal);
  const indiceAncora = fatias.findIndex((f) => f.ancora);

  const valores = fatias.map((f, i) =>
    i === indiceAncora
      ? new Decimal(0)
      : total.mul(f.unidades).div(TOTAL).toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
  );

  if (indiceAncora >= 0) {
    const somaDasLivres = valores.reduce(
      (s, v, i) => (i === indiceAncora ? s : s.plus(v)),
      new Decimal(0),
    );
    valores[indiceAncora] = total.minus(somaDasLivres);
  }
  return valores;
}

/** Converte um valor em reais de volta para unidades de percentual. */
export function unidadesDeReais(
  valor: Decimal.Value,
  valorTotal: Decimal.Value | null | undefined,
): number | null {
  if (valorTotal === null || valorTotal === undefined) return null;
  const total = new Decimal(valorTotal);
  if (total.lessThanOrEqualTo(0)) return null;
  return Math.round(new Decimal(valor).div(total).mul(TOTAL).toNumber());
}

/**
 * Arredondamento amigável: 59,70/40,30 vira 60/40.
 *
 * Só é oferecido quando cada fatia livre está a menos de 1pp de um múltiplo de
 * 5% — fora disso, "arredondar" seria inventar uma alocação que ninguém pediu.
 * A âncora não entra na conta: ela se ajusta ao resultado, como sempre.
 */
export function podeArredondar(fatias: Fatia[]): boolean {
  const livres = fatias.filter((f) => !f.ancora);
  if (livres.length === 0) return false;
  const passo = 5 * ESCALA;
  const cabe = livres.every((f) => {
    const resto = f.unidades % passo;
    const distancia = Math.min(resto, passo - resto);
    return distancia > 0 && distancia <= 1 * ESCALA;
  });
  return cabe && balancear(arredondar(fatias)).ancora >= 0;
}

export function arredondar(fatias: Fatia[]): Fatia[] {
  const passo = 5 * ESCALA;
  return fatias.map((f) =>
    f.ancora ? f : { ...f, unidades: Math.round(f.unidades / passo) * passo },
  );
}

export type Problema = { indice: number; mensagem: string };

/**
 * O que ainda impede o rateio de ser salvo.
 *
 * Devolve o índice da linha culpada junto da frase: o erro nasce na linha que
 * o causou, não num contador vermelho no rodapé que acusa a tela inteira.
 */
export function problemas(fatias: Fatia[], nomes: Map<string, string>): Problema[] {
  const lista: Problema[] = [];
  const vistos = new Map<string, number>();

  fatias.forEach((f, i) => {
    if (!f.setorId) {
      lista.push({ indice: i, mensagem: "Escolha o setor desta linha." });
      return;
    }
    const antes = vistos.get(f.setorId);
    if (antes !== undefined) {
      lista.push({
        indice: i,
        mensagem: `${nomes.get(f.setorId) ?? "Este setor"} já está na linha ${antes + 1}.`,
      });
      return;
    }
    vistos.set(f.setorId, i);
    if (!f.ancora && f.unidades < MINIMO) {
      lista.push({
        indice: i,
        mensagem:
          f.unidades === 0
            ? "Informe o percentual desta linha."
            : `Fatia mínima de ${textoDeUnidades(MINIMO)}% — remova a linha se o setor não participa.`,
      });
    }
  });

  const balanco = balancear(fatias);
  if (balanco.indiceAncora === -1) {
    lista.push({ indice: -1, mensagem: "Escolha qual setor absorve o restante." });
  } else if (balanco.ancora < 0) {
    // A culpa é da última linha livre editada, mas apontar "a última" seria
    // arbitrário: aponta-se a maior, que é a que tem folga para ceder.
    const maior = fatias.reduce(
      (melhor, f, i) => (f.ancora || f.unidades <= (fatias[melhor]?.unidades ?? -1) ? melhor : i),
      fatias.findIndex((f) => !f.ancora),
    );
    const nomeAncora = nomes.get(fatias[balanco.indiceAncora].setorId) ?? "a âncora";
    const sobra = fatias[maior] ? fatias[maior].unidades + balanco.ancora : 0;
    lista.push({
      indice: maior,
      mensagem: `Passou ${textoDeUnidades(-balanco.ancora)}% do total. ${
        sobra > 0
          ? `Esta linha cabe até ${textoDeUnidades(sobra)}%, para sobrar fatia em ${nomeAncora}.`
          : `Reduza para sobrar fatia em ${nomeAncora}.`
      }`,
    });
  }

  return lista;
}

/**
 * Monta o estado inicial do editor a partir do rateio gravado.
 *
 * O banco não guarda quem é a âncora, e de propósito: âncora é um conceito de
 * edição, não de contabilidade — o que se persiste são percentuais que já somam
 * 100%. A cada abertura da tela ela é escolhida por duas regras, nesta ordem:
 *
 *  1. o setor de quem está editando, se ele participa do rateio — mexer nas
 *     fatias dos outros e ver a própria absorver o resto é o que corresponde à
 *     responsabilidade de quem edita;
 *  2. a maior fatia, que é a que tem folga para ceder sem estourar.
 */
export function fatiasIniciais(
  rateios: Array<{ setorId: string; percentual: Decimal.Value | null }>,
  setorPreferido?: string | null,
): Fatia[] {
  if (rateios.length === 0) {
    return setorPreferido ? [{ setorId: setorPreferido, unidades: TOTAL, ancora: true }] : [];
  }

  const fatias = rateios.map((r) => ({
    setorId: r.setorId,
    unidades: r.percentual === null ? 0 : unidadesDeBanco(r.percentual),
    ancora: false,
  }));

  let indice = setorPreferido ? fatias.findIndex((f) => f.setorId === setorPreferido) : -1;
  if (indice === -1) {
    indice = fatias.reduce(
      (melhor, f, i) => (f.unidades > fatias[melhor].unidades ? i : melhor),
      0,
    );
  }
  fatias[indice].ancora = true;
  return fatias;
}
