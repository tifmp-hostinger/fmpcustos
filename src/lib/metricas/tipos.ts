import type { Decimal } from "decimal.js";
import type { Natureza } from "@/generated/prisma/enums";

/** Competência no formato AAAA-MM. */
export type Competencia = { ano: number; mes: number };

/**
 * Todo filtro de métrica exige natureza explícita.
 * Passar as quatro é permitido — mas tem que ser escrito.
 */
export type FiltroMetrica = {
  naturezas: Natureza[];
  de: Competencia;
  ate: Competencia;
  setorIds?: string[];
  categoriaIds?: string[];
  fornecedorIds?: string[];
};

export type ValorPorChave = {
  chave: string;
  rotulo: string;
  valor: Decimal;
  participacao: Decimal;
};

export type SerieMensal = {
  competencia: Competencia;
  valor: Decimal;
};

/** Quão confiável é o número de um setor. Um setor sem dado não é um setor com custo zero. */
export type CompletudeSetor = {
  setorId: string;
  setorNome: string;
  itensAtivos: number;
  itensSemValor: number;
  itensSemRateio: number;
  contratosSemVigencia: number;
  reportouCompetencia: boolean;
};

export function competenciaParaTexto({ ano, mes }: Competencia): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function competenciasNoIntervalo(de: Competencia, ate: Competencia): Competencia[] {
  const saida: Competencia[] = [];
  let { ano, mes } = de;
  while (ano < ate.ano || (ano === ate.ano && mes <= ate.mes)) {
    saida.push({ ano, mes });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return saida;
}
