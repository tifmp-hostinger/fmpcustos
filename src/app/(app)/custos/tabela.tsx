"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  alterarSituacao,
  definirDataFim,
  duplicarItem,
  excluirItem,
  marcarSemPrazo,
  restaurarItem,
  reverterCampo,
} from "./acoes-rapidas";
import { reverterLote } from "./acoes-lote";
import { useAviso } from "@/components/avisos";
import { BarraDeSelecao } from "./selecao";
import { MenuDeLinha, type ItemMenu } from "@/components/menu";
import { formatarBRL, formatarCambio, formatarMoeda } from "@/lib/dinheiro";
import { ROTULOS_PERIODICIDADE, ROTULOS_STATUS, STATUS_ITEM } from "@/lib/opcoes";
import { ORDENS, urlDaLista, type ChaveOrdem, type Filtros } from "@/lib/filtros";
import {
  IconeCopiar,
  IconeSeta,
  IconeEditar,
  IconeEncerrar,
  IconeHistorico,
  IconeLixeira,
  IconeRateio,
  IconeRestaurar,
} from "@/components/icones";
import type { Desfazer, Resultado } from "@/lib/acoes";
import type { StatusItem } from "@/generated/prisma/enums";

/**
 * A LISTA DE CUSTOS
 *
 * Duas decisões estruturam esta tela.
 *
 * A primeira: **as duas tarefas mais frequentes não vão para um menu**. Mudar a
 * situação e preencher a data de renovação eram, respectivamente, cinco cliques
 * e uma travessia de formulário inteiro — e são exatamente o que se faz dezenas
 * de vezes num fechamento. Viraram edição na própria célula. Pagar dois cliques
 * de menu por noventa por cento do trabalho real seria pagar caro.
 *
 * A segunda: **valor nunca se edita na lista**. Alterar valor exige contexto —
 * a nota, a competência, a conferência contra quantidade × unitário. Isso mora
 * no formulário, onde o equivalente mensal recalcula ao vivo. A lista mostra e
 * leva até lá.
 *
 * O resto vive no menu de três pontos, que fica sempre renderizado (nunca só no
 * hover) e responde também ao clique com o botão direito na linha — o gesto que
 * a pessoa já traz da planilha.
 */

export type LinhaCusto = {
  id: string;
  descricao: string;
  fornecedor: string | null;
  categoria: string | null;
  natureza: string;
  periodicidade: string;
  moeda: string;
  /** Taxa gravada no item. Nula em real; nula em moeda estrangeira = fora dos totais. */
  cambio: string | null;
  valorPeriodo: string | null;
  /** Sempre em real — o compromisso por mês. Nulo para o que não se repete. */
  valorMensal: string | null;
  /** O valor da cobrança em real. É o que se soma no que aconteceu uma vez. */
  valorEmReais: string | null;
  status: StatusItem;
  dataInicio: string | null;
  dataFim: string | null;
  semPrazo: boolean;
  setores: Array<{ nome: string; percentual: string }>;
  temLancamentos: boolean;
  /** Regras de permissão resolvidas no servidor: a tela não recalcula nem adivinha. */
  podeEditar: boolean;
  podeRatear: boolean;
  motivoBloqueio: string | null;
  naLixeira: boolean;
};

/**
 * Quais colunas fazem sentido nesta aba.
 *
 * "Por mês" numa lista de compras avulsas é uma coluna inteira de travessões, e
 * "Renova em" numa compra que aconteceu uma vez é uma pergunta sem resposta
 * possível. Tirar a coluna é mais honesto — e mais limpo — que preenchê-la com
 * nada.
 */
export type Colunas = {
  mensal: boolean;
  renovacao: boolean;
  aquisicao: boolean;
  natureza: boolean;
};

export function TabelaDeCustos({
  itens,
  mostrarSetor,
  colunas,
  podeLancar,
  destacar,
  filtros,
  setores,
}: {
  itens: LinhaCusto[];
  mostrarSetor: boolean;
  colunas: Colunas;
  podeLancar: boolean;
  /** Item recém-alterado noutra tela: chega pela URL e pisca ao carregar. */
  destacar?: string;
  /** Recorte atual, para os cabeçalhos montarem a URL da ordenação. */
  filtros: Filtros;
  /** Destinos possíveis da transferência em lote. Vazio para quem não pode. */
  setores: Array<{ valor: string; rotulo: string }>;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [, transicao] = useTransition();

  // Estado otimista: a célula muda antes da resposta do servidor. Se a action
  // recusar, o valor volta — e um aviso explica. Rollback silencioso é pior que
  // erro visível, porque a pessoa acredita que salvou.
  const [otimista, setOtimista] = useState<Record<string, Partial<LinhaCusto>>>({});
  const [gravando, setGravando] = useState<Set<string>>(new Set());
  const [aceso, setAceso] = useState<string | undefined>(destacar);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  /** Última linha marcada, para o Shift+clique saber de onde estender. */
  const ultimaMarcada = useRef<string | null>(null);

  // Ajuste de estado durante a renderização — o padrão do React para "derivar
  // de uma prop que mudou". Num efeito, a linha destacada pela URL só acenderia
  // um quadro depois, exatamente quando a pessoa já está olhando para ela.
  const [destaqueVindoDaUrl, setDestaqueVindoDaUrl] = useState(destacar);
  if (destaqueVindoDaUrl !== destacar) {
    setDestaqueVindoDaUrl(destacar);
    setAceso(destacar);
  }

  // Trocar de filtro esvazia a seleção. Manter marcado o que saiu da tela
  // faria a barra dizer "12 selecionados" com três linhas visíveis — e a ação
  // em lote atingiria nove custos que a pessoa não está mais vendo.
  const idsVisiveis = useMemo(() => itens.map((i) => i.id).join(","), [itens]);
  const [idsAnteriores, setIdsAnteriores] = useState(idsVisiveis);
  if (idsAnteriores !== idsVisiveis) {
    setIdsAnteriores(idsVisiveis);
    if (selecionados.size > 0) setSelecionados(new Set());
  }

  const linhas = useMemo(
    () => itens.map((i) => ({ ...i, ...(otimista[i.id] ?? {}) })),
    [itens, otimista],
  );

  const grupos = useMemo(
    () => agrupar(linhas, filtros.agrupar, colunas.mensal),
    [linhas, filtros.agrupar, colunas.mensal],
  );

  // Recolher é estado de tela, não de dado: não vai para a URL. Um agrupamento
  // com metade dos grupos fechados não é um recorte que alguém queira colar num
  // e-mail — é o jeito de olhar de agora.
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const alternarGrupo = useCallback((chave: string) => {
    setRecolhidos((r) => {
      const proximo = new Set(r);
      if (!proximo.delete(chave)) proximo.add(chave);
      return proximo;
    });
  }, []);

  // O destaque some depois da animação; mantê-lo faria a linha reacender a
  // cada re-render da lista, o que vira ruído em vez de sinal.
  useEffect(() => {
    if (!aceso) return;
    const prazo = window.setTimeout(() => setAceso(undefined), 2200);
    return () => window.clearTimeout(prazo);
  }, [aceso]);

  const limparOtimista = useCallback((id: string) => {
    setOtimista((o) => {
      const proximo = { ...o };
      delete proximo[id];
      return proximo;
    });
  }, []);

  /**
   * O Desfazer de verdade: chama a ação inversa no servidor e devolve ao aviso
   * o que aconteceu. Um botão que não sabe o que reverter é enfeite; este sabe,
   * porque a action de ida devolveu junto o estado anterior.
   */
  const desfazer = useCallback(
    async (pedido: Desfazer) => {
      const dados = new FormData();

      // O lote tem sua própria ação inversa: cada item volta ao SEU valor
      // anterior. Ações de linha nunca produzem este caso — quem o produz é a
      // barra de seleção, que trata do desfazer dela.
      if (pedido.acao === "reverterLote") {
        dados.set("itens", JSON.stringify(pedido.itens));
        const r = await reverterLote(dados);
        transicao(() => router.refresh());
        return r.ok ? { ok: true, mensagem: r.mensagem } : { ok: false, erro: r.erro };
      }

      dados.set("id", pedido.id);
      const r =
        pedido.acao === "restaurarCusto"
          ? await restaurarItem(dados)
          : await (async () => {
              dados.set("antes", JSON.stringify(pedido.antes));
              return reverterCampo(dados);
            })();

      limparOtimista(pedido.id);
      if (r.ok) setAceso(pedido.id);
      transicao(() => router.refresh());
      return r.ok ? { ok: true, mensagem: r.mensagem } : { ok: false, erro: r.erro };
    },
    [limparOtimista, router, transicao],
  );

  const executar = useCallback(
    async (
      id: string,
      acao: (dados: FormData) => Promise<Resultado>,
      dados: FormData,
      previsao?: Partial<LinhaCusto>,
    ) => {
      if (previsao) setOtimista((o) => ({ ...o, [id]: { ...o[id], ...previsao } }));
      setGravando((g) => new Set(g).add(id));

      const resultado = await acao(dados);

      setGravando((g) => {
        const proximo = new Set(g);
        proximo.delete(id);
        return proximo;
      });

      if (!resultado.ok) {
        // Devolve a célula ao valor real e diz o porquê, na mesma respiração.
        // Rollback silencioso é pior que erro visível: a pessoa acredita que
        // salvou e só descobre no fechamento.
        limparOtimista(id);
        avisar({ mensagem: resultado.erro, tom: "erro" });
        return;
      }

      if (resultado.mensagem) {
        avisar({
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
          // Exclusão ganha mais tempo de leitura que uma troca de situação.
          duracao: resultado.desfazer?.acao === "restaurarCusto" ? 10_000 : 8_000,
          aoDesfazer: resultado.desfazer ? () => desfazer(resultado.desfazer!) : undefined,
        });
      }
      if (resultado.destaqueId) setAceso(resultado.destaqueId);
      if (resultado.irPara) router.push(resultado.irPara as never);

      // A verdade continua sendo o servidor: o refresh troca o valor otimista
      // pelo gravado. Sem isso, dois palpites seguidos divergiriam do banco.
      transicao(() => router.refresh());
      limparOtimista(id);
    },
    [avisar, desfazer, limparOtimista, router, transicao],
  );

  /**
   * Marca uma linha. Com Shift, estende do último clique até aqui — o gesto
   * que a pessoa traz da planilha, e a diferença entre um clique e catorze.
   */
  function marcar(id: string, comShift: boolean) {
    setSelecionados((atuais) => {
      const proximo = new Set(atuais);
      const inicio = ultimaMarcada.current;

      if (comShift && inicio && inicio !== id) {
        const ordem = linhas.map((l) => l.id);
        const a = ordem.indexOf(inicio);
        const b = ordem.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [de, ate] = a < b ? [a, b] : [b, a];
          // O intervalo assume o estado da linha clicada: estender uma seleção
          // e estender uma desmarcação são o mesmo gesto com sinal trocado.
          const marcando = !atuais.has(id);
          for (let i = de; i <= ate; i++) {
            if (marcando) proximo.add(ordem[i]);
            else proximo.delete(ordem[i]);
          }
          return proximo;
        }
      }

      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
    ultimaMarcada.current = id;
  }

  const selecionaveis = linhas.filter((l) => l.podeEditar && !l.naLixeira);
  const todosMarcados =
    selecionaveis.length > 0 && selecionaveis.every((l) => selecionados.has(l.id));
  const algunsMarcados = selecionaveis.some((l) => selecionados.has(l.id));
  const emLote = podeLancar && selecionaveis.length > 0;

  const quantidadeDeColunas =
    // seleção + descrição + cobrança + valor + situação + menu
    (emLote ? 1 : 0) +
    5 +
    (mostrarSetor ? 1 : 0) +
    (colunas.natureza ? 1 : 0) +
    (colunas.aquisicao ? 1 : 0) +
    (colunas.renovacao ? 1 : 0);

  if (linhas.length === 0) return null;

  return (
    <div
      // `relative` não é enfeite: sem ele, o bloco de contenção de um
      // descendente absoluto é o viewport, e não esta faixa. O
      // `<span class="sr-only">Ações</span>` do último cabeçalho — 1px,
      // invisível — ia parar em x=861 e esticava o DOCUMENTO para 862px.
      // Num telefone de 390px isso fazia a página inteira rolar 472px de lado:
      // o cabeçalho saía da tela e a lista virava aquilo que não dá para usar.
      className="relative mt-5 overflow-x-auto rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)]"
    >
      {/* A largura mínima só vale onde as sete colunas existem. Num telefone
          restam três, e exigir 860px ali era o que obrigava a arrastar a lista
          de lado para ler uma linha. */}
      <table className="w-full text-sm md:min-w-[860px]">
        <caption className="sr-only">
          Custos cadastrados. Use o menu de cada linha para editar, duplicar, dividir entre setores
          ou encerrar.
        </caption>
        <thead>
          <tr className="border-b border-[var(--rule)] rotulo-coluna">
            {emLote && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={todosMarcados}
                  ref={(el) => {
                    // Indeterminado só existe por propriedade, não por atributo:
                    // é o estado que diz "parte da lista", e sem ele o quadrado
                    // vazio mente sobre haver seleção ativa.
                    if (el) el.indeterminate = algunsMarcados && !todosMarcados;
                  }}
                  onChange={() =>
                    setSelecionados(
                      todosMarcados ? new Set() : new Set(selecionaveis.map((l) => l.id)),
                    )
                  }
                  aria-label={
                    todosMarcados
                      ? "Desmarcar todos os custos desta tela"
                      : `Marcar os ${selecionaveis.length} custos desta tela`
                  }
                  className="size-4 align-middle accent-[var(--accent)]"
                />
              </th>
            )}
            <Cabecalho campo="descricao" filtros={filtros}>
              Custo
            </Cabecalho>
            {mostrarSetor && (
              <Cabecalho campo="setor" filtros={filtros} secundaria>
                Setor
              </Cabecalho>
            )}
            {colunas.natureza && (
              <th className="hidden px-4 py-3 font-medium md:table-cell">Natureza</th>
            )}
            <Cabecalho campo="cobranca" filtros={filtros} direita secundaria>
              Cobrança
            </Cabecalho>
            <Cabecalho campo="mensal" filtros={filtros} direita>
              {/* O rótulo diz o que a coluna mede nesta aba. "Por mês" em cima
                  de uma lista de compras avulsas seria uma coluna inteira
                  respondendo à pergunta errada. */}
              {colunas.mensal ? "Por mês" : "Total"}
            </Cabecalho>
            {colunas.aquisicao && (
              <th className="hidden px-4 py-3 font-medium md:table-cell">Aquisição</th>
            )}
            {colunas.renovacao && (
              <Cabecalho campo="renovacao" filtros={filtros} secundaria>
                Renova em
              </Cabecalho>
            )}
            <Cabecalho campo="situacao" filtros={filtros} secundaria>
              Situação
            </Cabecalho>
            <th className="w-11 px-2 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        {grupos ? (
          grupos.map((grupo) => {
            const fechado = recolhidos.has(grupo.chave);
            return (
              <tbody key={grupo.chave} data-grupo={grupo.rotulo}>
                <tr className="border-b border-[var(--rule)] bg-[var(--surface)]">
                  <th
                    scope="colgroup"
                    colSpan={quantidadeDeColunas}
                    className="px-3 py-2 text-left font-normal"
                  >
                    <button
                      type="button"
                      onClick={() => alternarGrupo(grupo.chave)}
                      aria-expanded={!fechado}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <IconeSeta
                        aria-hidden
                        className={`size-3 shrink-0 text-[var(--ink-3)] transition-transform ${
                          fechado ? "" : "rotate-90"
                        }`}
                      />
                      <span className="text-dado font-semibold">{grupo.rotulo}</span>
                      <span className="text-meta text-[var(--ink-3)]">
                        {grupo.itens.length} {grupo.itens.length === 1 ? "custo" : "custos"}
                      </span>
                      {grupo.subtotal && (
                        <span className="numero ml-auto text-sm">
                          {formatarBRL(grupo.subtotal)}
                          {colunas.mensal && (
                            <span className="font-normal text-[var(--ink-3)]">/mês</span>
                          )}
                        </span>
                      )}
                    </button>
                  </th>
                </tr>
                {!fechado &&
                  grupo.itens.map((item) => (
                    <Linha
                      key={item.id}
                      item={item}
                      mostrarSetor={mostrarSetor}
                      colunas={colunas}
                      podeLancar={podeLancar}
                      gravando={gravando.has(item.id)}
                      aceso={aceso === item.id}
                      executar={executar}
                      emLote={emLote}
                      marcado={selecionados.has(item.id)}
                      aoMarcar={marcar}
                    />
                  ))}
              </tbody>
            );
          })
        ) : (
          <tbody>
            {linhas.map((item) => (
              <Linha
                key={item.id}
                item={item}
                mostrarSetor={mostrarSetor}
                colunas={colunas}
                podeLancar={podeLancar}
                gravando={gravando.has(item.id)}
                aceso={aceso === item.id}
                executar={executar}
                emLote={emLote}
                marcado={selecionados.has(item.id)}
                aoMarcar={marcar}
              />
            ))}
          </tbody>
        )}
      </table>

      <BarraDeSelecao
        ids={[...selecionados]}
        setores={setores}
        podeTransferir={setores.length > 0}
        aoLimpar={() => setSelecionados(new Set())}
        aoConcluir={() => {
          setSelecionados(new Set());
          transicao(() => router.refresh());
        }}
      />
    </div>
  );
}

function Linha({
  item,
  mostrarSetor,
  colunas,
  podeLancar,
  gravando,
  aceso,
  executar,
  emLote,
  marcado,
  aoMarcar,
}: {
  item: LinhaCusto;
  mostrarSetor: boolean;
  colunas: Colunas;
  podeLancar: boolean;
  gravando: boolean;
  aceso: boolean;
  emLote: boolean;
  marcado: boolean;
  aoMarcar: (id: string, comShift: boolean) => void;
  executar: (
    id: string,
    acao: (dados: FormData) => Promise<Resultado>,
    dados: FormData,
    previsao?: Partial<LinhaCusto>,
  ) => Promise<void>;
}) {
  const abrirMenu = useRef<(() => void) | null>(null);
  const registrarAbertura = useCallback((abrir: (() => void) | null) => {
    abrirMenu.current = abrir;
  }, []);

  const bloqueado = !podeLancar || !item.podeEditar;
  // Valor preenchido, moeda estrangeira, taxa faltando: a linha parece completa
  // e o item não entra em soma nenhuma. É o único caso em que a célula do
  // mensal precisa dizer o que fazer, e não só o que não tem.
  const semCotacao = item.moeda !== "BRL" && item.cambio === null && item.valorPeriodo !== null;
  const motivo = !podeLancar
    ? "Seu perfil permite consultar, não alterar."
    : (item.motivoBloqueio ?? undefined);

  const acoes: ItemMenu[] = item.naLixeira
    ? [
        {
          rotulo: "Restaurar",
          icone: <IconeRestaurar className="size-4" />,
          aoEscolher: () => {
            const d = new FormData();
            d.set("id", item.id);
            executar(item.id, restaurarItem, d);
          },
          desabilitado: bloqueado,
          motivo,
        },
      ]
    : [
        {
          rotulo: "Editar",
          icone: <IconeEditar className="size-4" />,
          href: `/custos/${item.id}`,
        },
        {
          rotulo: "Duplicar",
          icone: <IconeCopiar className="size-4" />,
          aoEscolher: () => {
            const d = new FormData();
            d.set("id", item.id);
            executar(item.id, duplicarItem, d);
          },
          desabilitado: bloqueado,
          motivo,
        },
        {
          rotulo: "Dividir entre setores",
          icone: <IconeRateio className="size-4" />,
          href: `/custos/${item.id}/rateio`,
          desabilitado: !item.podeRatear,
          motivo: item.podeRatear
            ? undefined
            : "Rateio de custo compartilhado é feito pela Controladoria.",
        },
        {
          rotulo: "Ver histórico",
          icone: <IconeHistorico className="size-4" />,
          href: `/custos/${item.id}#historico`,
        },
        {
          separadorAntes: true,
          // O nome muda com o que a ação realmente faz. Chamar de "excluir" o
          // que apenas encerra — ou oferecer "excluir" para um item com
          // histórico contábil, só para recusar depois do clique — é prometer
          // o que a tela já sabe que não vai cumprir.
          rotulo: item.temLancamentos ? "Encerrar custo" : "Excluir",
          icone: item.temLancamentos ? (
            <IconeEncerrar className="size-4" />
          ) : (
            <IconeLixeira className="size-4" />
          ),
          perigoso: true,
          desabilitado: bloqueado,
          motivo,
          aoEscolher: () => {
            const d = new FormData();
            d.set("id", item.id);
            if (item.temLancamentos) {
              d.set("status", "CANCELADO");
              executar(item.id, alterarSituacao, d, { status: "CANCELADO" });
            } else {
              executar(item.id, excluirItem, d, { naLixeira: true });
            }
          },
        },
      ];

  return (
    <tr
      // `group/linha` acende o menu quando o ponteiro entra OU quando o foco
      // chega por teclado — as duas coisas, nunca só a primeira.
      className={`group/linha border-b border-[var(--rule)] transition-colors last:border-0 hover:bg-[var(--ground)] focus-within:bg-[var(--ground)] ${
        item.naLixeira ? "opacity-55" : ""
      } ${marcado ? "bg-[var(--accent)]/[0.06]" : ""} ${
        aceso ? "motion-safe:animate-[destacar_2s_ease-out]" : ""
      }`}
      aria-busy={gravando || undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        abrirMenu.current?.();
      }}
    >
      {emLote && (
        <td className="px-3 py-3">
          {item.podeEditar && !item.naLixeira ? (
            <input
              type="checkbox"
              checked={marcado}
              // `onClick` e não `onChange`: só o evento de clique carrega a
              // tecla Shift, e é ela que transforma catorze cliques em dois.
              onChange={() => {}}
              onClick={(e) => aoMarcar(item.id, e.shiftKey)}
              aria-label={`Selecionar ${item.descricao}`}
              className="size-4 align-middle accent-[var(--accent)]"
            />
          ) : (
            <span
              title={item.motivoBloqueio ?? "Item na lixeira"}
              aria-label="Não selecionável"
              className="block size-4"
            />
          )}
        </td>
      )}
      {/* `data-celula` dá um ponto de referência estável: a posição da coluna
          muda conforme o perfil (a caixa de seleção e a coluna Setor só existem
          para quem pode). Contar posições aqui quebraria a cada ajuste. */}
      <td data-celula="descricao" className="px-4 py-3">
        <Link
          href={`/custos/${item.id}`}
          className="font-medium no-underline hover:text-[var(--accent)]"
        >
          {item.descricao}
        </Link>
        <span className="block text-micro text-[var(--ink-3)]">
          {item.fornecedor ?? "sem fornecedor"}
          {item.categoria ? ` · ${item.categoria}` : ""}
          {/* No telefone a coluna Setor não existe, e "de quem é este custo" é
              a segunda pergunta que alguém faz olhando a lista. Ela não some:
              desce para cá, onde não custa uma coluna. A partir de `md` a
              coluna volta e esta repetição sairia sobrando. */}
          {item.setores.length > 0 && (
            <span className="md:hidden">
              {" · "}
              {item.setores.length === 1 ? item.setores[0]!.nome : `${item.setores.length} setores`}
            </span>
          )}
        </span>
      </td>

      {mostrarSetor && (
        <td className="hidden px-4 py-3 text-[var(--ink-2)] md:table-cell">
          <Setores setores={item.setores} />
        </td>
      )}

      {/* A coluna da cobrança fala a moeda do contrato; a do mensal fala real,
          sempre. Misturar as duas foi o defeito de origem — US$ 500 somava como
          R$ 500 porque as duas colunas diziam "R$". */}
      <td data-celula="cobranca" className="hidden px-4 py-3 text-right tabular-nums md:table-cell">
        {item.valorPeriodo ? formatarMoeda(item.valorPeriodo, item.moeda) : "—"}
        <span className="block text-micro text-[var(--ink-3)]">
          {ROTULOS_PERIODICIDADE[item.periodicidade]}
        </span>
      </td>

      {colunas.natureza && (
        <td
          data-celula="natureza"
          className="hidden px-4 py-3 text-meta text-[var(--ink-2)] md:table-cell"
        >
          {ROTULO_CURTO_NATUREZA[item.natureza] ?? item.natureza}
        </td>
      )}

      <td data-celula="mensal" className="px-4 py-3 text-right font-medium tabular-nums">
        {colunas.mensal ? (
          item.valorMensal ? (
            <>
              {formatarBRL(item.valorMensal)}
              {item.moeda !== "BRL" && (
                <span
                  className="block text-micro font-normal text-[var(--ink-3)]"
                  title={`Convertido de ${item.moeda} a ${item.cambio ? formatarCambio(item.cambio) : "—"}`}
                >
                  a {formatarCambio(item.cambio)}
                </span>
              )}
            </>
          ) : semCotacao ? (
            // Não é "—". Um traço aqui diz "não tem valor", e este item tem: o que
            // falta é a taxa. Confundir os dois manda a pessoa procurar no lugar
            // errado — e o link leva direto ao lugar certo.
            <Link
              href={`/custos/${item.id}`}
              data-falta="cambio"
              className="text-meta font-medium text-[var(--accent)] no-underline hover:underline"
            >
              sem cotação
            </Link>
          ) : (
            "—"
          )
        ) : // Numa aba de período, esta coluna passa a mostrar o total em real —
        // o número que de fato se soma quando o custo aconteceu uma vez.
        item.valorEmReais ? (
          <>
            {formatarBRL(item.valorEmReais)}
            {item.moeda !== "BRL" && (
              <span className="block text-micro font-normal text-[var(--ink-3)]">
                a {formatarCambio(item.cambio)}
              </span>
            )}
          </>
        ) : semCotacao ? (
          <Link
            href={`/custos/${item.id}`}
            data-falta="cambio"
            className="text-meta font-medium text-[var(--accent)] no-underline hover:underline"
          >
            sem cotação
          </Link>
        ) : (
          "—"
        )}
      </td>

      {colunas.aquisicao && (
        <td
          data-celula="aquisicao"
          className="hidden px-4 py-3 text-dado tabular-nums md:table-cell"
        >
          {item.dataInicio ? (
            formatarData(item.dataInicio)
          ) : (
            // Sem a data do fato, a compra não entra em nenhum exercício e some
            // do total do ano. É pendência, e o link leva ao lugar de resolvê-la.
            <Link
              href={`/custos/${item.id}`}
              data-falta="aquisicao"
              className="text-meta font-medium text-[var(--accent)] no-underline hover:underline"
            >
              sem data
            </Link>
          )}
        </td>
      )}

      {colunas.renovacao && (
        <td className="hidden px-4 py-2 md:table-cell">
          <CelulaData item={item} bloqueado={bloqueado} motivo={motivo} executar={executar} />
        </td>
      )}

      <td data-celula="situacao" className="hidden px-4 py-2 md:table-cell">
        <CelulaSituacao item={item} bloqueado={bloqueado} motivo={motivo} executar={executar} />
      </td>

      <td className="px-2 py-3 text-right">
        <MenuDeLinha
          rotulo={`Ações de ${item.descricao}`}
          itens={acoes}
          registrarAbertura={registrarAbertura}
        />
      </td>
    </tr>
  );
}

/**
 * A natureza em uma palavra.
 *
 * `ROTULOS_NATUREZA` traz a frase inteira do formulário — "Investimento / CAPEX
 * (bem que vira patrimônio)" — que é a explicação certa na hora de escolher e a
 * errada dentro de uma célula de tabela.
 */
const ROTULO_CURTO_NATUREZA: Record<string, string> = {
  RECORRENTE: "Recorrente",
  PONTUAL: "Pontual",
  CAPEX: "Investimento",
  PESSOAL: "Pessoal",
};

/** dd/mm/aaaa a partir de "aaaa-mm-dd", sem passar por Date e sem fuso. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * A LISTA AGRUPADA
 *
 * É a resposta ao pedido de "pasta", sem o problema da pasta: o grupo é
 * DERIVADO do dado, não arquivado à mão. Ninguém decide onde um custo mora,
 * nada desatualiza, e trocar o agrupamento reorganiza a tela inteira sem mover
 * um único registro.
 *
 * Cada grupo carrega o seu subtotal, e os subtotais fecham com o total do
 * cabeçalho — é o que faz o agrupamento servir para conferir, e não só para
 * enxugar a tela. Por isso só se agrupa por campo de valor único: ver a nota em
 * `AGRUPAMENTOS`.
 */
type Grupo = { chave: string; rotulo: string; itens: LinhaCusto[]; subtotal: string | null };

function agrupar(linhas: LinhaCusto[], por: string, porMes: boolean): Grupo[] | null {
  if (por !== "fornecedor" && por !== "categoria") return null;

  const vazio = por === "fornecedor" ? "Sem fornecedor" : "Sem categoria";
  const mapa = new Map<string, LinhaCusto[]>();
  for (const l of linhas) {
    const rotulo = (por === "fornecedor" ? l.fornecedor : l.categoria) ?? vazio;
    const atual = mapa.get(rotulo) ?? [];
    atual.push(l);
    mapa.set(rotulo, atual);
  }

  return [...mapa]
    .map(([rotulo, itens]) => {
      // Soma o que a aba mede. Num recorte de período, o mensal é nulo para todo
      // item — subtotalizar por ele daria uma coluna de zeros.
      const soma = itens.reduce((s, i) => {
        const valor = porMes ? i.valorMensal : i.valorEmReais;
        return valor && (i.status === "ATIVO" || i.status === "EM_ANALISE") ? s + Number(valor) : s;
      }, 0);
      return { chave: rotulo, rotulo, itens, subtotal: soma > 0 ? soma.toFixed(2) : null };
    })
    .sort((a, b) => {
      // O grupo sem dono vai para o fim, sempre: ele é uma pendência, não um
      // fornecedor chamado "Sem fornecedor" que por acaso começa com S.
      if (a.rotulo === vazio) return 1;
      if (b.rotulo === vazio) return -1;
      const diferenca = Number(b.subtotal ?? 0) - Number(a.subtotal ?? 0);
      return diferenca !== 0 ? diferenca : a.rotulo.localeCompare(b.rotulo, "pt-BR");
    });
}

/** Barra 100% empilhada: reconhecer 60/40 de relance vale mais que ler dois números. */
function Setores({ setores }: { setores: Array<{ nome: string; percentual: string }> }) {
  if (setores.length === 0) {
    return <span className="text-[var(--ink-3)]">Não rateado</span>;
  }
  if (setores.length === 1) return <>{setores[0].nome}</>;

  const titulo = setores
    .map((s) => `${s.nome} ${Number(s.percentual).toFixed(2).replace(".", ",")}%`)
    .join(" · ");

  return (
    <span title={titulo}>
      <span className="flex h-1.5 w-full max-w-[130px] overflow-hidden rounded-full bg-[var(--rule)]">
        {setores.map((s, i) => (
          <span
            key={s.nome}
            aria-hidden
            style={{ width: `${Number(s.percentual)}%` }}
            className={i % 2 === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink-3)]"}
          />
        ))}
      </span>
      <span className="mt-1 block text-micro text-[var(--ink-3)]">
        {setores.length} setores · {setores[0].nome} {Number(setores[0].percentual).toFixed(0)}%
      </span>
    </span>
  );
}

/**
 * Data de renovação editável na célula.
 *
 * Doze datas em doze digitações: Enter grava e o foco pula para a próxima linha
 * que ainda não tem data, Esc cancela. É o que transforma "12 itens sem data de
 * término" de diagnóstico em fila de trabalho.
 */
function CelulaData({
  item,
  bloqueado,
  motivo,
  executar,
}: {
  item: LinhaCusto;
  bloqueado: boolean;
  motivo?: string;
  executar: (
    id: string,
    acao: (dados: FormData) => Promise<Resultado>,
    dados: FormData,
    previsao?: Partial<LinhaCusto>,
  ) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  function gravar(valor: string) {
    setEditando(false);
    if (valor === (item.dataFim ?? "")) return;
    const dados = new FormData();
    dados.set("id", item.id);
    dados.set("dataFim", valor);
    executar(item.id, definirDataFim, dados, { dataFim: valor || null });
  }

  if (editando) {
    return (
      <input
        ref={campo}
        type="date"
        autoFocus
        defaultValue={item.dataFim ?? ""}
        aria-label={`Data de renovação de ${item.descricao}`}
        onBlur={(e) => gravar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            gravar(e.currentTarget.value);
            // O foco vai para a próxima linha sem data: é a fila de pendências
            // resolvida de cima para baixo, sem tirar as mãos do teclado.
            const proxima = document.querySelector<HTMLElement>("[data-sem-data='true']");
            requestAnimationFrame(() => proxima?.focus());
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditando(false);
          }
        }}
        className="w-[150px] rounded-lg border border-[var(--accent)] bg-[var(--surface)] px-2 py-1 text-dado tabular-nums outline-none"
      />
    );
  }

  if (item.dataFim) {
    return (
      <BotaoDeCelula bloqueado={bloqueado} motivo={motivo} aoAtivar={() => setEditando(true)}>
        <span className="tabular-nums">
          {new Date(`${item.dataFim}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
        </span>
      </BotaoDeCelula>
    );
  }

  if (item.semPrazo) {
    return (
      <BotaoDeCelula bloqueado={bloqueado} motivo={motivo} aoAtivar={() => setEditando(true)}>
        <span className="text-[var(--ink-3)]">sem prazo</span>
      </BotaoDeCelula>
    );
  }

  return (
    <BotaoDeCelula
      bloqueado={bloqueado}
      motivo={motivo}
      pendente
      atributos={{ "data-sem-data": "true" }}
      aoAtivar={() => setEditando(true)}
    >
      informar
    </BotaoDeCelula>
  );
}

/** Situação editável na célula: o selo colorido é o próprio gatilho. */
function CelulaSituacao({
  item,
  bloqueado,
  motivo,
  executar,
}: {
  item: LinhaCusto;
  bloqueado: boolean;
  motivo?: string;
  executar: (
    id: string,
    acao: (dados: FormData) => Promise<Resultado>,
    dados: FormData,
    previsao?: Partial<LinhaCusto>,
  ) => Promise<void>;
}) {
  const opcoes: ItemMenu[] = STATUS_ITEM.map((s) => ({
    rotulo: s.rotulo,
    aoEscolher: () => {
      const dados = new FormData();
      dados.set("id", item.id);
      dados.set("status", s.valor);
      executar(item.id, alterarSituacao, dados, { status: s.valor as StatusItem });
    },
  }));

  if (!item.dataFim && !item.semPrazo) {
    opcoes.push({
      separadorAntes: true,
      rotulo: "Marcar como sem prazo determinado",
      aoEscolher: () => {
        const dados = new FormData();
        dados.set("id", item.id);
        executar(item.id, marcarSemPrazo, dados, { semPrazo: true, dataFim: null });
      },
    });
  }

  if (bloqueado) {
    return <Selo status={item.status} title={motivo} />;
  }

  // O selo É o gatilho. Colocar um menu de três pontos ao lado dele criaria
  // dois alvos para a mesma ação — e a linha já tem um menu de três pontos na
  // ponta direita, com outro conteúdo. Dois desenhos iguais, duas coisas
  // diferentes: é assim que se ensina a pessoa a não confiar na tela.
  return (
    <MenuDeLinha
      rotulo={`Situação de ${item.descricao}: ${ROTULOS_STATUS[item.status]}. Alterar`}
      itens={opcoes}
      conteudoGatilho={
        <>
          <Selo status={item.status} />
          <IconeSeta aria-hidden className="size-3 rotate-90 text-[var(--ink-3)]" />
        </>
      }
      classeGatilho="flex items-center gap-1 rounded-full py-0.5 pr-1 transition-colors hover:bg-[var(--rule)]/50"
    />
  );
}

function BotaoDeCelula({
  children,
  aoAtivar,
  bloqueado,
  motivo,
  pendente,
  atributos,
}: {
  children: React.ReactNode;
  aoAtivar: () => void;
  bloqueado: boolean;
  motivo?: string;
  pendente?: boolean;
  atributos?: Record<string, string>;
}) {
  if (bloqueado) {
    return (
      <span title={motivo} className="px-1 text-[var(--ink-2)]">
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={aoAtivar}
      {...atributos}
      className={`rounded-md border border-dashed px-1.5 py-1 text-left text-dado transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] ${
        pendente
          ? "border-[var(--ink-3)]/50 text-[var(--ink-3)]"
          : "border-transparent text-[var(--ink-2)]"
      }`}
    >
      {children}
    </button>
  );
}

function Selo({ status, title }: { status: StatusItem; title?: string }) {
  const estilo =
    status === "ATIVO"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
      : status === "CANCELADO" || status === "SUBSTITUIDO"
        ? "bg-[var(--ink-3)]/15 text-[var(--ink-3)]"
        : "bg-[var(--accent)]/12 text-[var(--accent)]";
  return (
    // O rótulo textual anda sempre junto da cor: relatório de fundação é
    // impresso em preto e branco, e daltonismo existe.
    <span
      title={title}
      className={`rounded-full px-2 py-0.5 text-micro font-semibold tracking-wide uppercase ${estilo}`}
    >
      {ROTULOS_STATUS[status]}
    </span>
  );
}

/**
 * Cabeçalho de coluna ordenável.
 *
 * Ciclo de dois estados por coluna, começando pela direção que faz sentido para
 * o dado: dinheiro abre do maior para o menor, texto e data abrem do começo.
 * `aria-sort` no `<th>` é o que faz o leitor de tela anunciar a ordem — sem
 * ele, a seta é informação exclusivamente visual.
 */
function Cabecalho({
  campo,
  filtros,
  direita,
  secundaria,
  children,
}: {
  campo: ChaveOrdem;
  filtros: Filtros;
  direita?: boolean;
  /**
   * Some no telefone.
   *
   * Sete colunas não cabem em 390px, e nenhuma escolha de fonte resolve isso —
   * é aritmética. O que cabe é a pergunta que se faz no telefone: o que é, e
   * quanto custa. O resto está a um toque de distância na tela do custo, que
   * mostra tudo.
   *
   * A coluna é escondida por CSS, e não removida do HTML: girar o aparelho ou
   * abrir a mesma página no computador devolve a tabela inteira sem recarregar,
   * e o leitor de tela continua tendo a tabela completa.
   */
  secundaria?: boolean;
  children: React.ReactNode;
}) {
  const ativo = filtros.ordem === campo;
  const padrao = ORDENS.find((o) => o.chave === campo)!.padraoDir as "asc" | "desc";
  const proxima = ativo ? (filtros.dir === "asc" ? "desc" : "asc") : padrao;

  return (
    <th
      scope="col"
      data-coluna={campo}
      aria-sort={ativo ? (filtros.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-semibold ${direita ? "text-right" : "text-left"} ${
        secundaria ? "hidden md:table-cell" : ""
      }`}
    >
      <Link
        href={urlDaLista({ ...filtros, ordem: campo, dir: proxima, destaque: "" })}
        scroll={false}
        className={`inline-flex items-center gap-1 no-underline transition-colors hover:text-[var(--ink)] ${
          ativo ? "text-[var(--ink)]" : ""
        }`}
      >
        {children}
        {/* Triângulo cheio para ordenação; a célula de situação usa um chevron
            de traço para abrir o menu. Se os dois fossem a mesma seta, a mesma
            forma significaria duas coisas na mesma tabela. */}
        {/* Em `em`, e não num tamanho escolhido: o triângulo é acessório do
            rótulo e precisa ficar menor que ele qualquer que seja a escala.
            Uma proporção sobrevive a uma mudança de escala; um `8px` não. */}
        <span aria-hidden className={`text-[0.7em] ${ativo ? "" : "opacity-25"}`}>
          {ativo ? (filtros.dir === "asc" ? "\u25b2" : "\u25bc") : "\u25bc"}
        </span>
      </Link>
    </th>
  );
}
