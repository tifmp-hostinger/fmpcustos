"use client";

import { useActionState } from "react";
import { converterPendentes, registrarCotacao } from "./acoes";
import { useAviso } from "@/components/avisos";
import { Campo, Selecao } from "@/components/campos";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

const MOEDAS_ESTRANGEIRAS = [
  { valor: "USD", rotulo: "Dólar (US$)" },
  { valor: "EUR", rotulo: "Euro (€)" },
];

/**
 * Registrar a cotação de referência.
 *
 * A tela inteira é construída em torno de uma frase que precisa ficar clara
 * antes de qualquer clique: **isto não altera nenhum custo já cadastrado**. Um
 * administrador que ache o contrário vai registrar o dólar de hoje esperando ver
 * o painel mudar, não vai ver, e vai concluir que o sistema está quebrado —
 * quando ele está fazendo exatamente o que precisa fazer para que o total de
 * junho continue sendo o total de junho.
 */
export function NovaCotacao({ hoje }: { hoje: string }) {
  const avisar = useAviso();
  const [resultado, acao, enviando] = useActionState<Resultado | null, FormData>(
    async (anterior, dados) => {
      const r = await registrarCotacao(anterior, dados);
      avisar(
        r.ok
          ? { mensagem: r.mensagem ?? "Cotação registrada.", detalhe: r.detalhe }
          : { mensagem: r.erro, tom: "erro" },
      );
      return r;
    },
    null,
  );

  const v = resultado && !resultado.ok ? (resultado.valores ?? {}) : {};

  return (
    <form
      action={acao}
      className="rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5"
    >
      <h2 className="text-dado font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
        Registrar cotação
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Selecao
          rotulo="Moeda"
          nome="moeda"
          opcoes={MOEDAS_ESTRANGEIRAS}
          valor={v.moeda ?? "USD"}
          obrigatorio
        />
        <Campo
          rotulo="Quanto vale 1 unidade, em real"
          nome="taxa"
          obrigatorio
          valor={v.taxa}
          placeholder="5,4321"
          inputMode="decimal"
          erro={erroDe(resultado, "taxa")}
        />
        <Campo
          rotulo="Data da cotação"
          nome="data"
          tipo="date"
          valor={v.data ?? hoje}
          erro={erroDe(resultado, "data")}
        />
        <Campo
          rotulo="Fonte"
          nome="fonte"
          valor={v.fonte}
          placeholder="Banco Central (PTAX)"
          dica="De onde veio o número. Aparece para quem cadastrar um custo."
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Registrando…" : "Registrar"}
      </button>
      <p className="mt-3 text-meta text-[var(--ink-3)]">
        Isto não altera nenhum custo já cadastrado. Cada custo guarda a taxa com que foi convertido,
        para que o total de um mês fechado não mude quando a moeda mexer.
      </p>
    </form>
  );
}

/**
 * Aplicar a cotação aos custos que estão sem taxa.
 *
 * Existe porque a alternativa é pior: sem isto, doze custos em dólar importados
 * de uma vez exigiriam doze visitas a doze formulários para saírem do limbo. E
 * é explicitamente limitado a quem não tem taxa — o botão diz o número de itens
 * que vai tocar antes de tocá-los.
 */
export function ConverterPendentes({
  moeda,
  quantidade,
  taxa,
}: {
  moeda: string;
  quantidade: number;
  taxa: string;
}) {
  const avisar = useAviso();
  const [, acao, enviando] = useActionState<Resultado | null, FormData>(async (anterior, dados) => {
    const r = await converterPendentes(anterior, dados);
    avisar(
      r.ok
        ? { mensagem: r.mensagem ?? "Pronto.", detalhe: r.detalhe, duracao: 12_000 }
        : { mensagem: r.erro, tom: "erro" },
    );
    return r;
  }, null);

  return (
    <form action={acao} className="mt-3">
      <input type="hidden" name="moeda" value={moeda} />
      <button type="submit" disabled={enviando} className={classesDeBotao("perigo", "sm")}>
        {enviando
          ? "Convertendo…"
          : `Converter ${quantidade} ${quantidade === 1 ? "custo" : "custos"} a ${taxa}`}
      </button>
    </form>
  );
}

function erroDe(resultado: Resultado | null, campo: string): string | undefined {
  return resultado && !resultado.ok && resultado.campo === campo ? resultado.erro : undefined;
}
