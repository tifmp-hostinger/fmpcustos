"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { salvarCusto } from "./acoes";
import { useAviso } from "@/components/avisos";
import { AreaTexto, Campo, Selecao } from "@/components/campos";
import {
  formatarBRL,
  formatarMoeda,
  lerCambioDigitado,
  lerValorDigitado,
  valorMensalEmReais,
  valorMensalNaMoeda,
} from "@/lib/dinheiro";
import { explicar, parecidos } from "@/lib/fornecedores";
import {
  COMPORTAMENTOS,
  MOEDAS,
  NATUREZAS,
  PERIODICIDADES,
  ROTULOS_PERIODICIDADE,
  STATUS_ITEM,
} from "@/lib/opcoes";
import type { Moeda, Periodicidade } from "@/generated/prisma/enums";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

export type ValoresCusto = {
  id?: string;
  descricao?: string;
  fornecedor?: string;
  categoriaId?: string | null;
  natureza?: string;
  periodicidade?: string;
  comportamento?: string;
  moeda?: string;
  cambio?: string | null;
  cambioEm?: string | null;
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
  cotacoes,
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
  /** Cotação mais recente por moeda — sugestão, não imposição. */
  cotacoes: Cotacoes;
  podeEscolherSetor: boolean;
  setorFixo: string | null;
  voltarPara?: string;
}) {
  const avisar = useAviso();
  const router = useRouter();

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

  /**
   * React 19 limpa o formulário depois que a action termina. Num cadastro de
   * catorze campos, isso significa que um erro de validação apagaria tudo o que
   * já tinha sido preenchido. A chave remonta os campos com o que a pessoa
   * digitou, devolvido pela própria action.
   *
   * A chave muda AQUI, na renderização, e não dentro da action. Foi assim que o
   * mecanismo nasceu e assim ele não funcionava: `setChave` depois do `await`
   * produz uma renderização em que a chave já é nova e `resultado` ainda é o
   * anterior. Os campos remontavam com os valores INICIAIS — vazios — e a
   * renderização seguinte, já com o resultado em mãos, não remontava mais nada
   * porque a chave não tinha mudado de novo. O efeito era exatamente o que a
   * chave existia para evitar: errar o fornecedor apagava os catorze campos.
   *
   * Comparar o resultado durante a renderização é o padrão do React para
   * "derivar de algo que mudou": os dois valores ficam consistentes na mesma
   * renderização comprometida.
   */
  const [ultimoResultado, setUltimoResultado] = useState(resultado);
  if (ultimoResultado !== resultado) {
    setUltimoResultado(resultado);
    setChave((n) => n + 1);
  }

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
          <legend className="mb-1 rotulo-secao">O que é</legend>
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
            <p className="text-dado text-[var(--ink-3)]">
              Setor responsável: <strong className="text-[var(--ink-2)]">{setorFixo}</strong> — o
              custo é lançado na sua área.
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 rotulo-secao">Quanto custa</legend>
          <Quanto
            valorInicial={v.valorPeriodo ?? ""}
            periodicidadeInicial={(v.periodicidade as Periodicidade) ?? "MENSAL"}
            moedaInicial={(v.moeda as Moeda) ?? "BRL"}
            cambioInicial={v.cambio ?? ""}
            cambioEmInicial={v.cambioEm ?? ""}
            cotacoes={cotacoes}
            erro={erroDe(resultado, "valorPeriodo")}
            erroCambio={erroDe(resultado, "cambio")}
          />
          <Selecao
            rotulo="Situação"
            nome="status"
            opcoes={STATUS_ITEM}
            valor={v.status ?? "ATIVO"}
          />
        </fieldset>

        {/* Divulgação progressiva: três campos decidem o cadastro, os outros
            onze são refinamento. Apresentar catorze com o mesmo peso faz a
            pessoa tratar todos como obrigatórios — ou desistir. */}
        <details className="group rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-dado font-medium text-[var(--ink-2)] select-none">
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
          className={classesDeBotao("primario")}
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
            className="rounded-lg border border-[var(--rule)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:border-[var(--ink-3)] disabled:opacity-50"
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

export type Cotacoes = Record<string, { taxa: string; data: string; fonte: string | null }>;

/**
 * Valor, moeda, periodicidade e câmbio juntos, com o equivalente mensal ao vivo.
 *
 * Os quatro campos moram no mesmo componente porque respondem a UMA pergunta —
 * quanto isso custa por mês, em real — e porque cada um deles muda a resposta
 * dos outros três. A moeda ficava do outro lado da tela, ao lado da situação,
 * e essa distância era metade do defeito: escolher dólar não mudava nada
 * visível, então ninguém percebia que nada mudava mesmo.
 *
 * O problema nº 1 do diagnóstico da planilha era somar mensal com anual na
 * mesma coluna e chamar o resultado de total mensal. Mostrar "US$ 500,00 anual
 * = R$ 226,34/mês" no momento da digitação é o que impede o erro de nascer,
 * em vez de corrigi-lo seis meses depois.
 *
 * Sem máscara durante a digitação: máscara reposiciona o cursor e briga com
 * quem cola da planilha. A leitura é tolerante — "1.234,56", "1234.56" e
 * "R$ 1.234,56" chegam todos ao mesmo número — e a formatação acontece no blur.
 */
function Quanto({
  valorInicial,
  periodicidadeInicial,
  moedaInicial,
  cambioInicial,
  cambioEmInicial,
  cotacoes,
  erro,
  erroCambio,
}: {
  valorInicial: string;
  periodicidadeInicial: Periodicidade;
  moedaInicial: Moeda;
  cambioInicial: string;
  cambioEmInicial: string;
  cotacoes: Cotacoes;
  erro?: string;
  erroCambio?: string;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>(periodicidadeInicial);
  const [moeda, setMoeda] = useState<Moeda>(moedaInicial);
  const [cambio, setCambio] = useState(cambioInicial);
  // A data acompanha a taxa: mudar uma sem a outra produziria "convertido a
  // 5,90 em 12/03", uma procedência falsa para um número digitado hoje.
  const [cambioEm, setCambioEm] = useState(cambioEmInicial);

  const numero = lerValorDigitado(valor);
  const taxa = moeda === "BRL" ? null : lerCambioDigitado(cambio);
  const mensalNaMoeda = numero === null ? null : valorMensalNaMoeda(numero, periodicidade);
  const mensalEmReais = valorMensalEmReais(numero, periodicidade, moeda, taxa);

  const estrangeira = moeda !== "BRL";
  const sugestao = cotacoes[moeda];
  const semEquivalente = numero !== null && mensalNaMoeda === null;

  /**
   * Trocar a moeda já traz a cotação junto.
   *
   * A sugestão é aplicada aqui, no evento, e não num efeito que observa a
   * moeda: no efeito ela sobrescreveria a taxa que a pessoa acabou de digitar
   * toda vez que o componente re-renderizasse. Aqui ela chega uma vez, no
   * instante em que a pergunta "qual cotação?" passa a existir — e o campo
   * continua editável, porque a fatura pode ter fechado a outro câmbio.
   */
  function trocarMoeda(nova: Moeda) {
    setMoeda(nova);
    if (nova === "BRL") {
      setCambio("");
      setCambioEm("");
      return;
    }
    if (cambio.trim() !== "") return;
    const cotacao = cotacoes[nova];
    if (cotacao) {
      setCambio(cotacao.taxa.replace(".", ","));
      setCambioEm(cotacao.data);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
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
          rotulo="Moeda"
          nome="moeda"
          opcoes={MOEDAS}
          valor={moeda}
          onChange={(e) => trocarMoeda(e.target.value as Moeda)}
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

      {estrangeira && (
        <div className="mt-4 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              rotulo={`Cotação — quanto vale 1 ${moeda === "USD" ? "dólar" : "euro"}`}
              nome="cambio"
              obrigatorio
              valor={cambio}
              onChange={(e) => {
                setCambio(e.target.value);
                // Taxa digitada à mão é uma afirmação de hoje. A data da
                // cotação sugerida deixa de valer no instante em que o número
                // deixa de ser o dela.
                setCambioEm("");
              }}
              placeholder="5,4321"
              inputMode="decimal"
              erro={erroCambio}
            />
            <Campo
              rotulo="Data da cotação"
              nome="cambioEm"
              tipo="date"
              valor={cambioEm}
              onChange={(e) => setCambioEm(e.target.value)}
              dica="Em branco: vale hoje."
            />
          </div>
          <p className="mt-2.5 text-meta text-[var(--ink-3)]">
            {sugestao ? (
              <>
                Cotação registrada: <strong>{sugestao.taxa.replace(".", ",")}</strong> em{" "}
                {sugestao.data.split("-").reverse().join("/")}
                {sugestao.fonte ? ` (${sugestao.fonte})` : ""}. Se a fatura fechou a outro câmbio,
                use o da fatura — é ele que a FMP pagou.
              </>
            ) : (
              <>
                Nenhuma cotação de {moeda} registrada ainda. Informe a taxa deste custo — um
                administrador pode registrar a cotação de referência em Administração.
              </>
            )}
          </p>
          <p className="mt-1.5 text-meta text-[var(--ink-3)]">
            A taxa fica gravada neste custo. O total do mês passado não muda quando o{" "}
            {moeda === "USD" ? "dólar" : "euro"} mexer.
          </p>
        </div>
      )}

      <p
        aria-live="polite"
        data-previa="mensal"
        className="mt-2 min-h-[18px] text-meta text-[var(--ink-3)] tabular-nums"
      >
        {mensalEmReais !== null && (estrangeira || periodicidade !== "MENSAL") && (
          <>
            {formatarMoeda(numero, moeda)} {ROTULOS_PERIODICIDADE[periodicidade].toLowerCase()} ={" "}
            <strong className="text-[var(--ink-2)]">{formatarBRL(mensalEmReais)}/mês</strong>
            {estrangeira && mensalNaMoeda !== null && periodicidade !== "MENSAL" && (
              <> ({formatarMoeda(mensalNaMoeda, moeda)}/mês)</>
            )}{" "}
            — é este número que entra nas comparações.
          </>
        )}
        {/* O aviso mais importante da tela: sem taxa o custo existe e não é
            contado, e descobrir isso pelo total errado três meses depois é o
            que este sistema existe para evitar. */}
        {estrangeira && taxa === null && numero !== null && !semEquivalente && (
          <span className="text-[var(--accent)]">
            Sem a cotação, {formatarMoeda(numero, moeda)} não vira real e este custo fica de fora de
            todos os totais.
          </span>
        )}
        {semEquivalente && (
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
            <p key={c.nome} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta">
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
          <p className="mt-1.5 text-micro text-[var(--ink-3)]">
            Fornecedor repetido com nomes diferentes divide o total dele em dois no gráfico de
            concentração — e a negociação deixa de aparecer onde ela vale.
          </p>
        </div>
      )}
    </div>
  );
}
