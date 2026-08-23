"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { IconeAlerta, IconeCheck, IconeFechar, IconeVoltar } from "@/components/icones";

/**
 * A camada de aviso do sistema.
 *
 * Antes disto, cadastrar, editar, cancelar e excluir terminavam todos na mesma
 * tela silenciosa: a interface não distinguia sucesso de destruição. Aqui toda
 * ação diz o que fez, com o objeto pelo nome ("Adobe Creative Cloud foi
 * excluído"), e oferece o caminho de volta quando é reversível.
 *
 * Regras que este componente cumpre e que não são negociáveis:
 *
 * - Nunca rouba o foco. Um aviso que sequestra o cursor interrompe quem está
 *   digitando a próxima linha — o oposto de fluido.
 * - O botão Desfazer é alcançável por Tab e o cronômetro para no hover e no
 *   foco: o tempo de leitura de quem usa teclado ou lê devagar não pode ser
 *   o mesmo tempo de quem só olhou de passagem.
 * - Um aviso por vez. Empilhar avisos transforma feedback em ruído, e o que
 *   importa (o Desfazer) fica escondido atrás do que não importa.
 * - O aviso nunca é o único caminho de volta. Quem só percebe o erro no dia
 *   seguinte encontra o item na aba "Excluídos (30 dias)".
 */

export type TomAviso = "sucesso" | "erro" | "neutro";

/** O que uma ação devolve ao ser desfeita — o mínimo para dar retorno visual. */
type RespostaDesfazer = { ok: boolean; mensagem?: string; erro?: string };

export type PedidoDeAviso = {
  mensagem: string;
  tom?: TomAviso;
  /** Detalhe secundário: o delta, o total, o motivo. Uma linha, no máximo. */
  detalhe?: string;
  /** Presente = o aviso mostra "Desfazer". Ausente = ação irreversível ou trivial. */
  aoDesfazer?: () => Promise<RespostaDesfazer>;
  /** Milissegundos até sumir. Destrutivo ganha mais tempo de leitura. */
  duracao?: number;
};

type Aviso = PedidoDeAviso & { chave: number };

const Contexto = createContext<((pedido: PedidoDeAviso) => void) | null>(null);

/** Levanta um aviso de qualquer componente cliente abaixo do provedor. */
export function useAviso() {
  const avisar = useContext(Contexto);
  if (!avisar) {
    throw new Error("useAviso precisa estar dentro de <ProvedorDeAvisos>.");
  }
  return avisar;
}

const DURACAO_PADRAO = 8000;

export function ProvedorDeAvisos({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const sequencia = useRef(0);

  const avisar = useCallback((pedido: PedidoDeAviso) => {
    sequencia.current += 1;
    setAviso({ ...pedido, chave: sequencia.current });
  }, []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      {aviso && (
        <Faixa key={aviso.chave} aviso={aviso} aoFechar={() => setAviso(null)} avisar={avisar} />
      )}
    </Contexto.Provider>
  );
}

function Faixa({
  aviso,
  aoFechar,
  avisar,
}: {
  aviso: Aviso;
  aoFechar: () => void;
  avisar: (pedido: PedidoDeAviso) => void;
}) {
  const [pausado, setPausado] = useState(false);
  const [desfazendo, setDesfazendo] = useState(false);
  const tom = aviso.tom ?? "sucesso";

  // O cronômetro para enquanto o ponteiro está em cima ou o foco está dentro.
  // Quem está lendo, ou tabulando até o Desfazer, não pode perder a janela.
  useEffect(() => {
    if (pausado || desfazendo) return;
    const prazo = window.setTimeout(aoFechar, aviso.duracao ?? DURACAO_PADRAO);
    return () => window.clearTimeout(prazo);
  }, [pausado, desfazendo, aviso.duracao, aoFechar]);

  async function desfazer() {
    if (!aviso.aoDesfazer) return;
    setDesfazendo(true);
    const resposta = await aviso.aoDesfazer();
    aoFechar();
    // Desfazer que falha em silêncio é pior que não ter Desfazer: a pessoa
    // acredita que reverteu. O segundo aviso conta o que aconteceu de fato.
    startTransition(() =>
      avisar(
        resposta.ok
          ? { mensagem: resposta.mensagem ?? "Desfeito.", tom: "neutro" }
          : { mensagem: resposta.erro ?? "Não consegui desfazer.", tom: "erro" },
      ),
    );
  }

  const cor =
    tom === "erro"
      ? "border-[var(--accent)]/35 bg-[var(--accent)]/8"
      : tom === "neutro"
        ? "border-[var(--rule)] bg-[var(--surface)]"
        : "border-emerald-600/30 bg-emerald-600/8";

  return (
    <div
      // pointer-events-none no invólucro para a faixa nunca bloquear cliques na
      // paginação nem no botão "Cadastrar custo", que moram nesta mesma quina.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-5 sm:justify-end sm:pr-6"
    >
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocusCapture={() => setPausado(true)}
        onBlurCapture={() => setPausado(false)}
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/5 backdrop-blur ${cor} motion-safe:animate-[surgir_180ms_ease-out]`}
      >
        <span aria-hidden className="mt-0.5 shrink-0">
          {tom === "erro" ? (
            <IconeAlerta className="size-[18px] text-[var(--accent)]" />
          ) : tom === "neutro" ? (
            <IconeVoltar className="size-[18px] text-[var(--ink-3)]" />
          ) : (
            <IconeCheck className="size-[18px] text-emerald-700 dark:text-emerald-400" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-snug font-medium">{aviso.mensagem}</p>
          {aviso.detalhe && (
            <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-3)]">{aviso.detalhe}</p>
          )}
        </div>

        {aviso.aoDesfazer && (
          <button
            type="button"
            onClick={desfazer}
            disabled={desfazendo}
            className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-[var(--accent)] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {desfazendo ? "Desfazendo…" : "Desfazer"}
          </button>
        )}

        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar aviso"
          className="-mr-1 shrink-0 rounded-lg p-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
        >
          <IconeFechar className="size-4" />
        </button>
      </div>
    </div>
  );
}
