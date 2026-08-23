import { prisma } from "@/lib/db";
import { formatarBRL } from "@/lib/dinheiro";
import { ROTULOS_NATUREZA, ROTULOS_PERIODICIDADE, ROTULOS_STATUS } from "@/lib/opcoes";

/**
 * O histórico do custo.
 *
 * Toda alteração já era gravada em `Auditoria` — com autor, data e o diff entre
 * antes e depois — desde o primeiro dia, e a página do custo até prometia que
 * "alterações ficam registradas na auditoria". Nenhuma tela mostrava. Dado que
 * o sistema guarda e não exibe é dívida, não recurso: ninguém conseguia
 * responder "quem mudou este valor, e de quanto para quanto".
 */

/** Campos cujo histórico interessa a quem confere. O resto é ruído de máquina. */
const RELEVANTES: Record<string, { rotulo: string; formato: (v: unknown) => string }> = {
  descricao: { rotulo: "Descrição", formato: texto },
  valorPeriodo: { rotulo: "Valor", formato: (v) => (v === null ? "—" : formatarBRL(String(v))) },
  valorMensalNormalizado: {
    rotulo: "Equivalente mensal",
    formato: (v) => (v === null ? "—" : formatarBRL(String(v))),
  },
  status: { rotulo: "Situação", formato: (v) => ROTULOS_STATUS[String(v)] ?? texto(v) },
  natureza: { rotulo: "Natureza", formato: (v) => ROTULOS_NATUREZA[String(v)] ?? texto(v) },
  periodicidade: {
    rotulo: "Periodicidade",
    formato: (v) => ROTULOS_PERIODICIDADE[String(v)] ?? texto(v),
  },
  dataFim: { rotulo: "Renovação", formato: data },
  dataInicio: { rotulo: "Início", formato: data },
  quantidade: { rotulo: "Quantidade", formato: texto },
  observacoes: { rotulo: "Observações", formato: texto },
  semPrazoDeterminado: {
    rotulo: "Prazo",
    formato: (v) => (v === true || v === "true" ? "sem prazo determinado" : "com prazo"),
  },
  excluidoEm: { rotulo: "Lixeira", formato: (v) => (v ? "excluído" : "restaurado") },
};

function texto(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function data(v: unknown): string {
  if (!v) return "sem data";
  const d = new Date(String(v).length === 10 ? `${v}T00:00:00Z` : String(v));
  return Number.isNaN(d.getTime()) ? texto(v) : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

type Mudanca = { rotulo: string; de: string; para: string };

/** Extrai do diff só o que mudou de fato, já em português e formatado. */
function mudancas(diff: unknown): Mudanca[] {
  if (typeof diff !== "object" || diff === null) return [];
  const { antes, depois } = diff as { antes?: unknown; depois?: unknown };
  const a = (typeof antes === "object" && antes !== null ? antes : {}) as Record<string, unknown>;
  const d = (typeof depois === "object" && depois !== null ? depois : {}) as Record<
    string,
    unknown
  >;

  const lista: Mudanca[] = [];
  for (const [campo, regra] of Object.entries(RELEVANTES)) {
    if (!(campo in d) && !(campo in a)) continue;
    const de = regra.formato(a[campo] ?? null);
    const para = regra.formato(d[campo] ?? null);
    // Campo presente no diff mas com o mesmo valor não é alteração — é ruído
    // do update que reescreve o item inteiro.
    if (de === para) continue;
    lista.push({ rotulo: regra.rotulo, de, para });
  }
  return lista;
}

export async function Historico({ itemId }: { itemId: string }) {
  const registros = await prisma.auditoria.findMany({
    where: { tabela: "item_custo", registroId: itemId },
    select: {
      id: true,
      acao: true,
      diff: true,
      criadoEm: true,
      usuario: { select: { colaborador: { select: { nome: true } } } },
    },
    orderBy: { criadoEm: "desc" },
    take: 40,
  });

  if (registros.length === 0) return null;

  return (
    <section id="historico" className="mt-10 scroll-mt-20">
      <h2 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
        Histórico
      </h2>

      <ol className="mt-3 space-y-0">
        {registros.map((r) => {
          const lista = r.acao === "ALTERACAO" ? mudancas(r.diff) : [];
          const autor = r.usuario?.colaborador.nome ?? "sistema";
          const quando = r.criadoEm.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <li
              key={r.id}
              className="border-l-2 border-[var(--rule)] py-2.5 pl-4 last:border-l-transparent"
            >
              <p className="text-[13px]">
                <strong className="font-medium">{autor}</strong>{" "}
                <span className="text-[var(--ink-2)]">
                  {r.acao === "CRIACAO"
                    ? "cadastrou o custo"
                    : r.acao === "EXCLUSAO"
                      ? "excluiu o custo"
                      : lista.length === 0
                        ? "salvou sem alterar nenhum campo"
                        : "alterou"}
                </span>
                <span className="ml-2 text-[11.5px] tabular-nums text-[var(--ink-3)]">
                  {quando}
                </span>
              </p>

              {lista.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {lista.map((m) => (
                    <li key={m.rotulo} className="text-[12.5px] text-[var(--ink-2)]">
                      <span className="text-[var(--ink-3)]">{m.rotulo}:</span>{" "}
                      <span className="line-through opacity-60">{m.de}</span>{" "}
                      <span aria-hidden>→</span> <strong className="font-medium">{m.para}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {registros.length === 40 && (
        <p className="mt-2 text-[11.5px] text-[var(--ink-3)]">
          Exibindo as 40 alterações mais recentes.
        </p>
      )}
    </section>
  );
}
