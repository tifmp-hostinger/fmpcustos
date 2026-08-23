"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarCusto } from "./acoes";
import { AreaTexto, Aviso, Campo, Enviar, Selecao } from "@/components/campos";
import {
  COMPORTAMENTOS,
  MOEDAS,
  NATUREZAS,
  PERIODICIDADES,
  STATUS_ITEM,
} from "@/lib/opcoes";
import type { Resultado } from "@/lib/acoes";

export type ValoresCusto = {
  id?: string;
  descricao?: string;
  fornecedor?: string;
  categoriaId?: string | null;
  natureza?: string;
  periodicidade?: string;
  comportamento?: string;
  moeda?: string;
  status?: string;
  valorPeriodo?: string | null;
  quantidade?: number | null;
  valorUnitario?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  observacoes?: string | null;
  setorId?: string | null;
};

export function FormularioCusto({
  valores = {},
  categorias,
  setores,
  podeEscolherSetor,
  setorFixo,
}: {
  valores?: ValoresCusto;
  categorias: Array<{ valor: string; rotulo: string }>;
  setores: Array<{ valor: string; rotulo: string }>;
  podeEscolherSetor: boolean;
  setorFixo: string | null;
}) {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(salvarCusto, null);

  return (
    <form action={acao} className="mt-8 space-y-6">
      {valores.id && <input type="hidden" name="id" value={valores.id} />}

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
          O que é
        </legend>
        <Campo
          rotulo="Descrição"
          nome="descricao"
          obrigatorio
          valor={valores.descricao}
          placeholder="Ex.: Microsoft 365 — licenças da equipe"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Fornecedor"
            nome="fornecedor"
            obrigatorio
            valor={valores.fornecedor}
            placeholder="Ex.: Microsoft"
            dica="Se ainda não existir, é criado automaticamente."
          />
          <Selecao
            rotulo="Categoria"
            nome="categoriaId"
            opcoes={categorias}
            valor={valores.categoriaId}
            vazio="Sem categoria"
          />
        </div>
        {podeEscolherSetor ? (
          <Selecao
            rotulo="Setor responsável"
            nome="setorId"
            opcoes={setores}
            valor={valores.setorId}
            obrigatorio
            dica="O custo é alocado 100% a este setor. O rateio entre setores é ajustado depois."
          />
        ) : (
          <p className="text-[13px] text-[var(--ink-3)]">
            Setor responsável: <strong className="text-[var(--ink-2)]">{setorFixo}</strong> —
            o custo é lançado na sua área.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
          Quanto custa
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            rotulo="Valor por período"
            nome="valorPeriodo"
            valor={valores.valorPeriodo}
            placeholder="1.234,56"
            inputMode="decimal"
            dica="Valor de cada cobrança, não o total do ano."
          />
          <Selecao
            rotulo="Periodicidade"
            nome="periodicidade"
            opcoes={PERIODICIDADES}
            valor={valores.periodicidade ?? "MENSAL"}
            obrigatorio
          />
          <Selecao rotulo="Moeda" nome="moeda" opcoes={MOEDAS} valor={valores.moeda ?? "BRL"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Selecao
            rotulo="Natureza"
            nome="natureza"
            opcoes={NATUREZAS}
            valor={valores.natureza ?? "RECORRENTE"}
          />
          <Selecao
            rotulo="Comportamento"
            nome="comportamento"
            opcoes={COMPORTAMENTOS}
            valor={valores.comportamento ?? "FIXO"}
          />
          <Selecao
            rotulo="Situação"
            nome="status"
            opcoes={STATUS_ITEM}
            valor={valores.status ?? "ATIVO"}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Quantidade"
            nome="quantidade"
            valor={valores.quantidade}
            inputMode="decimal"
            dica="Ex.: número de licenças ou usuários."
          />
          <Campo
            rotulo="Valor unitário"
            nome="valorUnitario"
            valor={valores.valorUnitario}
            inputMode="decimal"
            placeholder="66,30"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
          Vigência e observações
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Início" nome="dataInicio" tipo="date" valor={valores.dataInicio} />
          <Campo
            rotulo="Término ou renovação"
            nome="dataFim"
            tipo="date"
            valor={valores.dataFim}
            dica="Alimenta o alerta de renovação."
          />
        </div>
        <AreaTexto rotulo="Observações" nome="observacoes" valor={valores.observacoes} />
      </fieldset>

      <Aviso resultado={resultado} />

      <div className="flex items-center gap-3">
        <Enviar>{valores.id ? "Salvar alterações" : "Cadastrar custo"}</Enviar>
        <Link href="/custos" className="text-sm text-[var(--ink-3)] no-underline hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
