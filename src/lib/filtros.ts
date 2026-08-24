import type { StatusItem } from "@/generated/prisma/enums";

/**
 * O CONTRATO DA LISTA DE CUSTOS
 *
 * Este módulo existe para que um número do painel e a lista que ele abre não
 * possam discordar. Antes, "Marketing R$ 12.400/mês" era um diagnóstico sem
 * tratamento: não era link, e a lista nem sabia filtrar por setor. Agora o
 * gráfico monta a URL com `urlDaLista` e a lista lê a mesma URL com
 * `lerFiltros` — a definição de "os custos do Marketing" existe uma vez só.
 *
 * Todo estado de leitura mora na URL: filtro, busca, ordenação, destaque.
 * Isso é o que faz o botão Voltar desfazer um filtro por vez, e o que permite
 * colar num e-mail o link exato do que se estava olhando.
 *
 * Este módulo é PURO de propósito — nada de Prisma, sessão ou `next/headers`.
 * A tabela de custos é um componente cliente e importa daqui; se houvesse um
 * import de servidor no caminho, o bundle do navegador tentaria carregar o
 * acesso ao banco junto. A tradução do recorte para consulta mora em
 * `whereDaLista`, no lado do servidor (`src/lib/consultas.ts`).
 */

export const SITUACOES = [
  { chave: "ativos", rotulo: "Ativos", status: ["ATIVO"] as StatusItem[] },
  {
    chave: "analise",
    rotulo: "Em análise",
    status: ["EM_ANALISE", "CANCELAMENTO_SOLICITADO"] as StatusItem[],
  },
  { chave: "pendencia", rotulo: "Falta dado", status: null },
  { chave: "renovacao", rotulo: "Renova em 90 dias", status: null },
  {
    chave: "encerrados",
    rotulo: "Encerrados",
    status: ["CANCELADO", "SUBSTITUIDO"] as StatusItem[],
  },
  { chave: "todos", rotulo: "Todos", status: null },
  { chave: "lixeira", rotulo: "Excluídos", status: null },
] as const;

export type ChaveSituacao = (typeof SITUACOES)[number]["chave"];

/** O que pode faltar num cadastro. Cada um é uma fila de trabalho distinta. */
export const FALTAS = [
  { chave: "valor", rotulo: "sem valor" },
  { chave: "data", rotulo: "sem data de renovação" },
  { chave: "categoria", rotulo: "sem categoria" },
  { chave: "fornecedor", rotulo: "sem fornecedor" },
  // Custo em moeda estrangeira sem cotação existe, tem valor na tela e não é
  // contado em lugar nenhum. É a pendência mais cara de todas justamente porque
  // não parece uma: a linha está preenchida.
  { chave: "cambio", rotulo: "sem cotação" },
] as const;

export const ORDENS = [
  { chave: "mensal", rotulo: "Por mês", padraoDir: "desc" },
  { chave: "descricao", rotulo: "Custo", padraoDir: "asc" },
  { chave: "cobranca", rotulo: "Cobrança", padraoDir: "desc" },
  { chave: "renovacao", rotulo: "Renova em", padraoDir: "asc" },
  { chave: "situacao", rotulo: "Situação", padraoDir: "asc" },
  { chave: "setor", rotulo: "Setor", padraoDir: "asc" },
] as const;

export type ChaveOrdem = (typeof ORDENS)[number]["chave"];

export type Filtros = {
  situacao: ChaveSituacao;
  busca: string;
  setor: string;
  categoria: string;
  fornecedor: string;
  falta: string;
  ordem: ChaveOrdem;
  dir: "asc" | "desc";
  destaque: string;
};

/** Query string repetida (?q=a&q=b) chega como array — normaliza para o primeiro. */
function unico(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export type ParamsBrutos = Record<string, string | string[] | undefined>;

export function lerFiltros(params: ParamsBrutos): Filtros {
  const situacao = SITUACOES.find((s) => s.chave === unico(params.f))?.chave ?? "ativos";
  const ordem = ORDENS.find((o) => o.chave === unico(params.ordem))?.chave ?? "mensal";
  const dirBruta = unico(params.dir);
  return {
    situacao,
    busca: unico(params.q).trim().slice(0, 120),
    setor: unico(params.setor).slice(0, 40),
    categoria: unico(params.categoria).slice(0, 40),
    fornecedor: unico(params.fornecedor).slice(0, 40),
    falta: FALTAS.find((f) => f.chave === unico(params.falta))?.chave ?? "",
    ordem,
    dir:
      dirBruta === "asc" || dirBruta === "desc"
        ? dirBruta
        : (ORDENS.find((o) => o.chave === ordem)!.padraoDir as "asc" | "desc"),
    destaque: unico(params.destaque).slice(0, 40),
  };
}

/**
 * Monta a URL da lista a partir de um recorte.
 *
 * Chaves com valor vazio somem da URL em vez de virarem `?setor=` — endereço
 * limpo é endereço que se cola num e-mail sem parecer erro.
 */
export function urlDaLista(recorte: Partial<Filtros>) {
  const bruto: Record<string, string | undefined> = {
    f: recorte.situacao,
    q: recorte.busca,
    setor: recorte.setor,
    categoria: recorte.categoria,
    fornecedor: recorte.fornecedor,
    falta: recorte.falta,
    ordem: recorte.ordem,
    dir: recorte.dir,
    destaque: recorte.destaque,
  };
  return {
    pathname: "/custos" as const,
    query: Object.fromEntries(Object.entries(bruto).filter(([, v]) => v !== undefined && v !== "")),
  };
}

/**
 * A mesma URL em texto.
 *
 * `<Link href={objeto}>` aceita a forma estruturada, mas `router.push` e
 * qualquer navegação imperativa querem string. Derivar as duas do mesmo lugar
 * evita que a busca do cabeçalho e a da lista montem endereços diferentes para
 * o mesmo recorte.
 */
export function enderecoDaLista(recorte: Partial<Filtros>): string {
  const { query } = urlDaLista(recorte);
  const busca = new URLSearchParams(query as Record<string, string>).toString();
  return busca ? `/custos?${busca}` : "/custos";
}

/** Chaves que o painel usa quando o agrupamento não tem dono. */
export const SEM_SETOR = "nao-rateado";
export const SEM_CATEGORIA = "sem-categoria";
export const SEM_FORNECEDOR = "sem-fornecedor";

/**
 * Os filtros ativos, cada um com o endereço que o remove.
 *
 * Filtro que a pessoa não vê é filtro que a faz concluir que o custo sumiu do
 * sistema. Os chips existem para que a lista nunca minta por omissão sobre o
 * porquê de estar mostrando o que mostra.
 */
export function chipsAtivos(
  f: Filtros,
  nomes: {
    setores: Map<string, string>;
    categorias: Map<string, string>;
    fornecedores: Map<string, string>;
  },
): Array<{ rotulo: string; url: ReturnType<typeof urlDaLista> }> {
  const chips: Array<{ rotulo: string; url: ReturnType<typeof urlDaLista> }> = [];

  if (f.setor) {
    chips.push({
      rotulo: `Setor: ${f.setor === SEM_SETOR ? "não rateado" : (nomes.setores.get(f.setor) ?? f.setor)}`,
      url: urlDaLista({ ...f, setor: "" }),
    });
  }
  if (f.categoria) {
    chips.push({
      rotulo: `Categoria: ${f.categoria === SEM_CATEGORIA ? "sem categoria" : (nomes.categorias.get(f.categoria) ?? f.categoria)}`,
      url: urlDaLista({ ...f, categoria: "" }),
    });
  }
  if (f.fornecedor) {
    chips.push({
      rotulo: `Fornecedor: ${f.fornecedor === SEM_FORNECEDOR ? "sem fornecedor" : (nomes.fornecedores.get(f.fornecedor) ?? f.fornecedor)}`,
      url: urlDaLista({ ...f, fornecedor: "" }),
    });
  }
  if (f.falta) {
    chips.push({
      rotulo: `Falta: ${FALTAS.find((x) => x.chave === f.falta)!.rotulo}`,
      url: urlDaLista({ ...f, falta: "" }),
    });
  }
  if (f.busca) {
    chips.push({ rotulo: `Busca: “${f.busca}”`, url: urlDaLista({ ...f, busca: "" }) });
  }
  return chips;
}

/** Um filtro está "limpo" quando só a situação está escolhida. */
export function temRecorte(f: Filtros): boolean {
  return Boolean(f.setor || f.categoria || f.fornecedor || f.falta || f.busca);
}
