"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAviso } from "@/components/avisos";
import { DialogoDeConfirmacao } from "@/components/dialogo";
import { MenuDeLinha, type ItemMenu } from "@/components/menu";
import { Campo, Selecao } from "@/components/campos";
import { IconeEditar, IconeLixeira } from "@/components/icones";
import { codigoDeNome } from "@/lib/organizacao";
import type { Resultado } from "@/lib/acoes";
import { classesDeBotao } from "@/components/botao";

/**
 * A LISTA DE SETORES E DE CATEGORIAS
 *
 * As duas telas são a mesma tela. Não por economia de código: porque as duas
 * respondem à mesma pergunta — "o que existe aqui, quanto dinheiro passa por
 * cada um, e o que acontece se eu mexer" — e duas telas parecidas mas
 * diferentes obrigam quem administra a reaprender a segunda.
 *
 * Três coisas que ela faz e que uma lista de cadastro normalmente não faz.
 *
 * **Mostra o uso antes da ação.** Cada linha diz quantos custos passam por ali
 * e quanto somam por mês. Sem esse número, inativar um setor é uma decisão
 * cega, e a pessoa só descobre o tamanho do que fez quando o painel muda.
 *
 * **Diz qual saída existe, antes do clique.** Apagar só aparece para o que
 * nunca foi usado. Para o resto o menu oferece inativar, e explica por quê no
 * mesmo lugar — em vez de deixar clicar em Apagar e responder com um erro.
 *
 * **O código é derivado e visível.** Ele aparece enquanto se digita o nome, e
 * pode ser trocado. Pedir que alguém invente um código único produz "CAT1"; não
 * mostrar nenhum esconde a referência que vai aparecer no relatório.
 */

export type LinhaOrganizacao = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  paiId: string | null;
  paiNome: string | null;
  /**
   * Quantos custos estão ligados a este registro, TODOS — inclusive cancelados e
   * fora do corrente. É o número que uma ação toca, e prometer outro é dizer
   * "movo 10" e mover 11.
   */
  custos: number;
  /** Quantos deles entram na soma mensal. Igual a `custos` quando não há histórico. */
  correntes: number;
  /** Soma mensal em real dos correntes, já formatada. */
  mensal: string;
  /** Outros vínculos, para a linha dizer o que segura o registro. */
  extras: string[];
  /** Null quando pode ser apagado; a frase do porquê quando não pode. */
  travadoPor: string | null;
};

type Acoes = {
  renomear: (d: FormData) => Promise<Resultado>;
  alterarPai: (d: FormData) => Promise<Resultado>;
  alternarAtivo: (d: FormData) => Promise<Resultado>;
  apagar: (d: FormData) => Promise<Resultado>;
  reverter: (d: FormData) => Promise<Resultado>;
};

export function ListaOrganizacao({
  linhas,
  acoes,
  rotulos,
  aoAbrirExtra,
}: {
  linhas: LinhaOrganizacao[];
  acoes: Acoes;
  rotulos: { singular: string; plural: string; campoPai: string; rotuloPai: string };
  /** Ação extra no menu, específica de cada tela (fundir, responsáveis). */
  aoAbrirExtra?: (linha: LinhaOrganizacao) => ItemMenu | null;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [, transicao] = useTransition();
  const [editando, setEditando] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<LinhaOrganizacao | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function executar(
    id: string,
    acao: (d: FormData) => Promise<Resultado>,
    dados: FormData,
    reverter?: (d: FormData) => Promise<Resultado>,
  ) {
    setOcupado(id);
    const r = await acao(dados);
    setOcupado(null);

    if (!r.ok) {
      avisar({ mensagem: r.erro, tom: "erro", duracao: 12_000 });
      return false;
    }

    const voltarPara = reverter && r.desfazer?.acao === "reverterCampo" ? r.desfazer.antes : null;
    const paraDesfazer = voltarPara && reverter ? { antes: voltarPara, acao: reverter } : null;
    avisar({
      mensagem: r.mensagem ?? "Pronto.",
      detalhe: r.detalhe,
      duracao: r.detalhe ? 12_000 : 8_000,
      aoDesfazer: paraDesfazer
        ? async () => {
            const volta = new FormData();
            volta.set("id", id);
            volta.set("antes", JSON.stringify(paraDesfazer.antes));
            const resposta = await paraDesfazer.acao(volta);
            transicao(() => router.refresh());
            return resposta.ok
              ? { ok: true, mensagem: resposta.mensagem }
              : { ok: false, erro: resposta.erro };
          }
        : undefined,
    });
    transicao(() => router.refresh());
    return true;
  }

  const opcoesPai = linhas.filter((l) => l.ativo).map((l) => ({ valor: l.id, rotulo: l.nome }));

  return (
    <>
      {/* A faixa rola por dentro, e a página não vai junto. O `relative` é o
          que impede o `<caption class="sr-only">` — absoluto, invisível, de um
          pixel — de escapar daqui e esticar o documento inteiro. */}
      <div className="relative -mx-1 mt-6 overflow-x-auto px-1">
        <table className="w-full text-sm">
          <caption className="sr-only">{rotulos.plural} cadastrados, com o uso de cada um</caption>
          <thead>
            <tr className="border-b border-[var(--rule)] text-left rotulo-coluna">
              <th className="py-2 font-medium">Nome</th>
              <th className="hidden py-2 font-medium sm:table-cell">Código</th>
              <th className="py-2 text-right font-medium">Custos</th>
              <th className="py-2 text-right font-medium">Por mês</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rule)]">
            {linhas.map((linha) => {
              const extra = aoAbrirExtra?.(linha) ?? null;
              const menu: ItemMenu[] = [
                {
                  rotulo: "Renomear",
                  icone: <IconeEditar className="size-4" />,
                  aoEscolher: () => setEditando(linha.id),
                },
                ...(extra ? [extra] : []),
                {
                  rotulo: linha.ativo ? "Inativar" : "Reativar",
                  aoEscolher: () => {
                    const d = new FormData();
                    d.set("id", linha.id);
                    void executar(linha.id, acoes.alternarAtivo, d, acoes.reverter);
                  },
                },
                {
                  rotulo: "Apagar",
                  icone: <IconeLixeira className="size-4" />,
                  perigoso: true,
                  // Desabilitado com motivo, em vez de ausente: quem procura o
                  // botão precisa achar a explicação, não o vazio.
                  desabilitado: linha.travadoPor !== null,
                  motivo: linha.travadoPor ?? undefined,
                  aoEscolher: () => setConfirmar(linha),
                },
              ];

              return (
                <tr
                  key={linha.id}
                  data-organizacao={linha.id}
                  // O nome no atributo, e não só no texto: cada linha carrega um
                  // `<select>` com TODOS os outros nomes, então casar por texto
                  // acerta qualquer linha da tabela.
                  data-nome={linha.nome}
                  data-ativo={linha.ativo ? "sim" : "nao"}
                  className={linha.ativo ? "" : "opacity-55"}
                >
                  <td className="py-2.5 pr-3">
                    {editando === linha.id ? (
                      <FormaDeRenomear
                        linha={linha}
                        ocupado={ocupado === linha.id}
                        aoCancelar={() => setEditando(null)}
                        aoSalvar={async (nome) => {
                          const d = new FormData();
                          d.set("id", linha.id);
                          d.set("nome", nome);
                          const deu = await executar(linha.id, acoes.renomear, d, acoes.reverter);
                          if (deu) setEditando(null);
                        }}
                      />
                    ) : (
                      <>
                        <span className="font-medium">{linha.nome}</span>
                        {!linha.ativo && (
                          <span className="ml-2 text-micro text-[var(--ink-3)]">inativo</span>
                        )}
                        <span className="mt-0.5 block text-meta text-[var(--ink-3)]">
                          {linha.paiNome ? `dentro de ${linha.paiNome}` : "no topo"}
                          {linha.extras.length > 0 && ` · ${linha.extras.join(" · ")}`}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="hidden py-2.5 pr-3 font-mono text-meta text-[var(--ink-3)] sm:table-cell">
                    {linha.codigo}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {linha.custos > 0 ? (
                      <Link
                        href={{
                          pathname: "/custos",
                          query: {
                            f: "todos",
                            [rotulos.campoPai === "setorPaiId" ? "setor" : "categoria"]: linha.id,
                          },
                        }}
                        className="text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                      >
                        {linha.custos}
                      </Link>
                    ) : (
                      <span className="text-[var(--ink-3)]">0</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {linha.mensal}
                    {/* Quando os dois números divergem, dizer por quê: senão a
                      pergunta é "por que 11 custos somam o mesmo que 10?". */}
                    {linha.correntes < linha.custos && (
                      <span className="block text-micro text-[var(--ink-3)]">
                        {linha.correntes} {linha.correntes === 1 ? "corrente" : "correntes"}
                      </span>
                    )}
                  </td>
                  <td className="w-10 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <SeletorDePai
                        linha={linha}
                        opcoes={opcoesPai.filter((o) => o.valor !== linha.id)}
                        rotulo={rotulos.rotuloPai}
                        campo={rotulos.campoPai}
                        desabilitado={ocupado === linha.id}
                        aoEscolher={(paiId) => {
                          const d = new FormData();
                          d.set("id", linha.id);
                          d.set(rotulos.campoPai, paiId);
                          void executar(linha.id, acoes.alterarPai, d, acoes.reverter);
                        }}
                      />
                      <MenuDeLinha rotulo={`Ações de ${linha.nome}`} itens={menu} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DialogoDeConfirmacao
        aberto={confirmar !== null}
        titulo={`Apagar ${confirmar?.nome}?`}
        rotuloConfirmar="Apagar"
        perigoso
        aoFechar={() => setConfirmar(null)}
        aoConfirmar={() => {
          if (!confirmar) return;
          const d = new FormData();
          d.set("id", confirmar.id);
          void executar(confirmar.id, acoes.apagar, d);
          setConfirmar(null);
        }}
      >
        <p>
          {`Nunca foi usado: nenhum custo, nenhuma pessoa, nenhum vínculo. Apagar não perde nada.`}
        </p>
        <p className="text-dado text-[var(--ink-3)]">
          Isto não tem desfazer — {rotulos.singular} apagado sai do banco. Se houver dúvida, inative
          em vez de apagar.
        </p>
      </DialogoDeConfirmacao>
    </>
  );
}

function FormaDeRenomear({
  linha,
  ocupado,
  aoSalvar,
  aoCancelar,
}: {
  linha: LinhaOrganizacao;
  ocupado: boolean;
  aoSalvar: (nome: string) => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState(linha.nome);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <input
        value={nome}
        autoFocus
        disabled={ocupado}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            aoSalvar(nome.trim());
          }
          if (e.key === "Escape") {
            e.preventDefault();
            aoCancelar();
          }
        }}
        className="min-w-0 flex-1 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
      />
      <button
        type="button"
        disabled={ocupado || nome.trim() === ""}
        onClick={() => aoSalvar(nome.trim())}
        className="rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-meta font-medium text-[var(--ground)] disabled:opacity-50"
      >
        {ocupado ? "Salvando…" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={aoCancelar}
        className="text-meta text-[var(--ink-3)] hover:underline"
      >
        Cancelar
      </button>
    </span>
  );
}

/** Um `<select>` que muda o pai na hora, e volta ao rótulo — nunca guarda estado. */
function SeletorDePai({
  linha,
  opcoes,
  rotulo,
  campo,
  desabilitado,
  aoEscolher,
}: {
  linha: LinhaOrganizacao;
  opcoes: Array<{ valor: string; rotulo: string }>;
  rotulo: string;
  campo: string;
  desabilitado?: boolean;
  aoEscolher: (paiId: string) => void;
}) {
  return (
    <select
      value={linha.paiId ?? ""}
      disabled={desabilitado}
      aria-label={`${rotulo} de ${linha.nome}`}
      data-campo={campo}
      onChange={(e) => aoEscolher(e.target.value)}
      className="max-w-[150px] rounded-lg border border-[var(--rule)] bg-transparent px-2 py-1 text-meta text-[var(--ink-2)] outline-none disabled:opacity-50"
    >
      <option value="">no topo</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}

/**
 * O formulário de criar, com o código derivado à vista.
 *
 * O código aparece enquanto se digita o nome, e é editável. Quem tem um código
 * institucional usa o dele; quem não tem não precisa inventar um — que é como
 * nascem "CAT1" e "X".
 */
export function FormaDeCriar({
  acao,
  rotulos,
  opcoesPai,
}: {
  acao: (anterior: Resultado | null, dados: FormData) => Promise<Resultado>;
  rotulos: { singular: string; campoPai: string; rotuloPai: string; exemplo: string };
  opcoesPai: Array<{ valor: string; rotulo: string }>;
}) {
  const avisar = useAviso();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const sugerido = nome.trim() ? codigoDeNome(nome) : "";

  async function enviar(dados: FormData) {
    setEnviando(true);
    // O código só é enviado quando a pessoa escreveu um: em branco, o servidor
    // deriva do nome — e é ele quem resolve colisão, porque só ele conhece os
    // códigos que já existem.
    if (codigo.trim() === "") dados.delete("codigo");
    const r = await acao(null, dados);
    setEnviando(false);

    if (!r.ok) {
      setErro(r.erro);
      avisar({ mensagem: r.erro, tom: "erro", duracao: 12_000 });
      return;
    }
    setErro(null);
    setNome("");
    setCodigo("");
    avisar({ mensagem: r.mensagem ?? "Criado.", detalhe: r.detalhe });
    router.refresh();
  }

  return (
    <form
      action={enviar}
      className="space-y-4 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5"
    >
      <h2 className="rotulo-secao">Novo {rotulos.singular}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <Campo
          rotulo="Nome"
          nome="nome"
          obrigatorio
          valor={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErro(null);
          }}
          placeholder={rotulos.exemplo}
          erro={erro ?? undefined}
        />
        <Campo
          rotulo="Código"
          nome="codigo"
          valor={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder={sugerido || "derivado do nome"}
          dica="Aparece nos relatórios. Em branco, o sistema deriva do nome."
        />
      </div>
      {opcoesPai.length > 0 && (
        <Selecao
          rotulo={rotulos.rotuloPai}
          nome={rotulos.campoPai}
          opcoes={opcoesPai}
          vazio="No topo"
        />
      )}
      <button
        type="submit"
        disabled={enviando || nome.trim() === ""}
        className={classesDeBotao("primario")}
      >
        {enviando ? "Criando…" : `Criar ${rotulos.singular}`}
      </button>
    </form>
  );
}
