"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { salvarCusto } from "./acoes";
import { useAviso } from "@/components/avisos";
import { AreaTexto, Campo, Selecao } from "@/components/campos";
import { formatarBRL, lerValorDigitado, valorMensalNormalizado } from "@/lib/dinheiro";
import { explicar, parecidos } from "@/lib/fornecedores";
import {
  COMPORTAMENTOS,
  MOEDAS,
  NATUREZAS,
  PERIODICIDADES,
  ROTULOS_PERIODICIDADE,
  STATUS_ITEM,
} from "@/lib/opcoes";
import type { Periodicidade } from "@/generated/prisma/enums";
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
  fornecedores,
  podeEscolherSetor,
  setorFixo,
  /** Para onde voltar depois de salvar. Padrão: a lista, de onde quase sempre se veio. */
  voltarPara = "/custos",
}: {
  valores?: ValoresCusto;
  categorias: Array<{ valor: string; rotulo: string }>;
  setores: Array<{ valor: string; rotulo: string }>;
  /** Fornecedores já cadastrados, para não nascer "Microsoft" e "Microsoft Brasil". */
  fornecedores: string[];
  podeEscolherSetor: boolean;
  setorFixo: string | null;
  voltarPara?: string;
}) {
  const avisar = useAviso();
  const router = useRouter();

  // React 19 limpa o formulário depois que a action termina. Num cadastro de
  // catorze campos, isso significa que um erro de validação apagaria tudo o que
  // já tinha sido preenchido. A chave remonta os campos com o que a pessoa
  // digitou, devolvido pela própria action.
  const [chave, setChave] = useState(0);
  const continuar = useRef(false);
  const formulario = useRef<HTMLFormElement>(null);

  /**
   * A reação ao resultado acontece dentro da action, não num efeito.
   *
   * Num efeito, o mesmo resultado dispara de novo a cada re-render — o aviso
   * reaparece depois de fechado e o `router.push` roda mais de uma vez. Aqui
   * cada envio produz exatamente uma reação.
   */
  const [resultado, acao, enviando] = useActionState<Resultado | null, FormData>(
    async (anterior, dados) => {
      const r = await salvarCusto(anterior, dados);
      setChave((n) => n + 1);

      if (!r.ok) {
        avisar({ mensagem: r.erro, tom: "erro" });
        // Foca o campo culpado. Sem isso, a pessoa relê catorze campos
        // procurando qual deles a mensagem está descrevendo.
        requestAnimationFrame(() => {
          const alvo = r.campo
            ? formulario.current?.querySelector<HTMLElement>(`[name="${r.campo}"]`)
            : null;
          alvo?.focus();
          alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
        return r;
      }

      avisar({ mensagem: r.mensagem ?? "Salvo.", detalhe: r.detalhe });
      if (continuar.current) {
        // "Salvar e cadastrar outro": quem lança trinta custos lança em blocos
        // parecidos. O foco volta para a descrição, que é o que muda.
        requestAnimationFrame(() =>
          formulario.current?.querySelector<HTMLElement>('[name="descricao"]')?.focus(),
        );
      } else {
        router.push(voltarPara as never);
      }
      return r;
    },
    null,
  );

  const digitados = resultado && !resultado.ok ? (resultado.valores ?? {}) : {};
  const v: ValoresCusto = { ...valores, ...digitados };

  return (
    <form ref={formulario} action={acao} className="mt-8 space-y-6">
      {valores.id && <input type="hidden" name="id" value={valores.id} />}

      {/* Sugerir o que já existe é o que impede o gráfico de concentração por
          fornecedor de morrer na origem: "Microsoft", "Microsoft Brasil" e "MS"
          viram três fornecedores diferentes e ninguém percebe. */}
      <datalist id="fornecedores-cadastrados">
        {fornecedores.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <div key={chave} className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
            O que é
          </legend>
          <Campo
            rotulo="Descrição"
            nome="descricao"
            obrigatorio
            valor={v.descricao}
            placeholder="Ex.: Microsoft 365 — licenças da equipe"
            erro={erroDe(resultado, "descricao")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoFornecedor
              valorInicial={v.fornecedor ?? ""}
              fornecedores={fornecedores}
              erro={erroDe(resultado, "fornecedor")}
            />
            <Selecao
              rotulo="Categoria"
              nome="categoriaId"
              opcoes={categorias}
              valor={v.categoriaId}
              vazio="Sem categoria"
            />
          </div>
          {podeEscolherSetor ? (
            <Selecao
              rotulo="Setor responsável"
              nome="setorId"
              opcoes={setores}
              valor={v.setorId}
              obrigatorio
              dica="O custo nasce 100% deste setor. A divisão entre setores é feita depois, no rateio."
            />
          ) : (
            <p className="text-[13px] text-[var(--ink-3)]">
              Setor responsável: <strong className="text-[var(--ink-2)]">{setorFixo}</strong> — o
              custo é lançado na sua área.
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
            Quanto custa
          </legend>
          <ValorEPeriodicidade
            valorInicial={v.valorPeriodo ?? ""}
            periodicidadeInicial={(v.periodicidade as Periodicidade) ?? "MENSAL"}
            erro={erroDe(resultado, "valorPeriodo")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selecao rotulo="Moeda" nome="moeda" opcoes={MOEDAS} valor={v.moeda ?? "BRL"} />
            <Selecao
              rotulo="Situação"
              nome="status"
              opcoes={STATUS_ITEM}
              valor={v.status ?? "ATIVO"}
            />
          </div>
        </fieldset>

        {/* Divulgação progressiva: três campos decidem o cadastro, os outros
            onze são refinamento. Apresentar catorze com o mesmo peso faz a
            pessoa tratar todos como obrigatórios — ou desistir. */}
        <details className="group rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-[13.5px] font-medium text-[var(--ink-2)] select-none">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="text-[var(--ink-3)] transition-transform group-open:rotate-90"
              >
                ›
              </span>
              Mais detalhes — natureza, quantidade, vigência, observações
            </span>
          </summary>

          <div className="space-y-4 border-t border-[var(--rule)] px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Selecao
                rotulo="Natureza"
                nome="natureza"
                opcoes={NATUREZAS}
                valor={v.natureza ?? "RECORRENTE"}
                dica="Separa o que é despesa corrente do que é investimento ou pessoal."
              />
              <Selecao
                rotulo="Comportamento"
                nome="comportamento"
                opcoes={COMPORTAMENTOS}
                valor={v.comportamento ?? "FIXO"}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Quantidade"
                nome="quantidade"
                valor={v.quantidade}
                inputMode="decimal"
                dica="Ex.: número de licenças ou usuários."
              />
              <Campo
                rotulo="Valor unitário"
                nome="valorUnitario"
                valor={v.valorUnitario}
                inputMode="decimal"
                placeholder="66,30"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Início" nome="dataInicio" tipo="date" valor={v.dataInicio} />
              <Campo
                rotulo="Término ou renovação"
                nome="dataFim"
                tipo="date"
                valor={v.dataFim}
                dica="Alimenta o alerta de renovação."
                erro={erroDe(resultado, "dataFim")}
              />
            </div>
            <AreaTexto rotulo="Observações" nome="observacoes" valor={v.observacoes} />
          </div>
        </details>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          onClick={() => {
            continuar.current = false;
          }}
          disabled={enviando}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[15px] font-medium text-white transition-opacity disabled:opacity-50"
        >
          {enviando ? "Salvando…" : valores.id ? "Salvar alterações" : "Cadastrar custo"}
        </button>

        {!valores.id && (
          <button
            type="submit"
            onClick={() => {
              continuar.current = true;
            }}
            disabled={enviando}
            className="rounded-lg border border-[var(--rule)] px-4 py-2 text-[14px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink-3)] disabled:opacity-50"
          >
            Salvar e cadastrar outro
          </button>
        )}

        <Link
          href={voltarPara as never}
          className="text-sm text-[var(--ink-3)] no-underline hover:underline"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function erroDe(resultado: Resultado | null, campo: string): string | undefined {
  return resultado && !resultado.ok && resultado.campo === campo ? resultado.erro : undefined;
}

/**
 * Valor e periodicidade juntos, com o equivalente mensal ao vivo.
 *
 * O problema nº 1 do diagnóstico da planilha era somar mensal com anual na
 * mesma coluna e chamar o resultado de total mensal. Mostrar "R$ 1.490,00 anual
 * = R$ 124,17/mês" no momento da digitação é o que impede o erro de nascer,
 * em vez de corrigi-lo seis meses depois.
 *
 * Sem máscara durante a digitação: máscara reposiciona o cursor e briga com
 * quem cola da planilha. A leitura é tolerante — "1.234,56", "1234.56" e
 * "R$ 1.234,56" chegam todos ao mesmo número — e a formatação acontece no blur.
 */
function ValorEPeriodicidade({
  valorInicial,
  periodicidadeInicial,
  erro,
}: {
  valorInicial: string;
  periodicidadeInicial: Periodicidade;
  erro?: string;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>(periodicidadeInicial);

  const numero = lerValorDigitado(valor);
  const mensal = numero === null ? null : valorMensalNormalizado(numero, periodicidade);
  const vaiConverter = mensal !== null && periodicidade !== "MENSAL";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Valor por período"
          nome="valorPeriodo"
          valor={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="1.234,56"
          inputMode="decimal"
          dica="Valor de cada cobrança, não o total do ano."
          erro={erro}
        />
        <Selecao
          rotulo="Periodicidade"
          nome="periodicidade"
          opcoes={PERIODICIDADES}
          valor={periodicidade}
          onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}
          obrigatorio
        />
      </div>

      <p
        aria-live="polite"
        className="mt-2 min-h-[18px] text-[12.5px] text-[var(--ink-3)] tabular-nums"
      >
        {vaiConverter && (
          <>
            {formatarBRL(numero)} {ROTULOS_PERIODICIDADE[periodicidade].toLowerCase()} ={" "}
            <strong className="text-[var(--ink-2)]">{formatarBRL(mensal)}/mês</strong> — é este
            número que entra nas comparações.
          </>
        )}
        {mensal === null && numero !== null && (
          <>
            {ROTULOS_PERIODICIDADE[periodicidade]} não tem equivalente mensal fixo. O item entra
            pelo que for lançado a cada competência.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Campo de fornecedor com detecção de duplicata.
 *
 * O aviso nasce no `blur`, não a cada tecla: "Microsof" a caminho de
 * "Microsoft" não é engano, é digitação em andamento, e acusar no meio dela
 * ensina a pessoa a ignorar avisos. Depois que o campo errou uma vez, ele
 * revalida a cada tecla — para o aviso sumir no instante em que for corrigido.
 *
 * Adotar a sugestão é um clique. Ignorá-la também é permitido e não custa
 * nada: "Microsoft" e "Microsoft Brasil" podem mesmo ser dois contratos.
 */
function CampoFornecedor({
  valorInicial,
  fornecedores,
  erro,
}: {
  valorInicial: string;
  fornecedores: string[];
  erro?: string;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [conferir, setConferir] = useState(false);
  const [ignorados, setIgnorados] = useState<string[]>([]);

  const candidatos = conferir
    ? parecidos(valor, fornecedores).filter((c) => !ignorados.includes(c.nome))
    : [];

  return (
    <div>
      <Campo
        rotulo="Fornecedor"
        nome="fornecedor"
        obrigatorio
        valor={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => setConferir(true)}
        placeholder="Ex.: Microsoft"
        dica="Comece a digitar: os já cadastrados aparecem. Um nome novo cria o fornecedor."
        lista="fornecedores-cadastrados"
        erro={erro}
      />

      {candidatos.length > 0 && (
        <div
          role="status"
          className="mt-1.5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5"
        >
          {candidatos.map((c) => (
            <p key={c.nome} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
              <span className="text-[var(--ink-2)]">{explicar(c, valor)}</span>
              <button
                type="button"
                onClick={() => {
                  setValor(c.nome);
                  setIgnorados([]);
                }}
                className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
              >
                Usar “{c.nome}”
              </button>
              <button
                type="button"
                onClick={() => setIgnorados((atuais) => [...atuais, c.nome])}
                className="text-[var(--ink-3)] underline-offset-2 hover:underline"
              >
                é outro fornecedor
              </button>
            </p>
          ))}
          <p className="mt-1.5 text-[11px] text-[var(--ink-3)]">
            Fornecedor repetido com nomes diferentes divide o total dele em dois no gráfico de
            concentração — e a negociação deixa de aparecer onde ela vale.
          </p>
        </div>
      )}
    </div>
  );
}
