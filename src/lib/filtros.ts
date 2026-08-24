import type { Natureza, StatusItem } from "@/generated/prisma/enums";

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

/**
 * AS NATUREZAS, COMO DIVISÃO DA TELA
 *
 * Natureza era um campo escondido no fim do formulário, e a lista somava as
 * quatro na mesma coluna "por mês". O rodapé da tela chegava a pedir desculpa
 * por isso: "o total desta lista soma todas as naturezas; o painel soma só os
 * recorrentes, por isso podem divergir". Um defeito de desenho explicado em vez
 * de corrigido.
 *
 * Uma assinatura de R$ 9.840/mês e um projetor de R$ 9.840 comprado uma vez não
 * são a mesma espécie de número. Vão para demonstrativos diferentes, passam por
 * aprovações diferentes e respondem a perguntas diferentes — "quanto a FMP se
 * comprometeu a pagar todo mês" contra "quanto a FMP gastou este ano". Somá-los
 * numa coluna só não é desorganização: é aritmética errada com aparência de
 * relatório.
 *
 * Por isso a natureza não é um filtro entre outros: é o que a página É. Ela
 * muda o total, A UNIDADE do total, quais colunas fazem sentido, a ordenação
 * padrão e o texto que explica. Trocar de aba é trocar de pergunta.
 *
 * `medida` é o que separa as duas famílias:
 *  - "mensal": o número é um compromisso por mês (soma de valorMensalNormalizado);
 *  - "periodo": o número é o que se gastou num intervalo (soma de valorPeriodo),
 *    e por isso essas abas ganham um seletor de ano.
 */
export const RECORTES = [
  {
    chave: "recorrente",
    naturezas: ["RECORRENTE"] as Natureza[],
    rotulo: "Recorrente",
    medida: "mensal",
    resumo: "O que a FMP se comprometeu a pagar todo mês: contratos, assinaturas, mensalidades.",
  },
  {
    chave: "pontual",
    naturezas: ["PONTUAL"] as Natureza[],
    rotulo: "Pontual",
    medida: "periodo",
    resumo: "Compras avulsas e serviços únicos. Aconteceram uma vez e não se repetem por contrato.",
  },
  {
    chave: "investimento",
    naturezas: ["CAPEX"] as Natureza[],
    rotulo: "Investimento",
    medida: "periodo",
    resumo: "Bens que viram patrimônio. Não são despesa do mês: depreciam ao longo dos anos.",
  },
  {
    // Pessoal existe no enum desde o início para que o dia em que a folha
    // entrar não exija remexer no que já foi lançado. A aba só aparece quando
    // houver item — e, antes disso, a segregação de acesso por natureza
    // (AcessoSetor) precisa passar a valer, senão abrir a aba abriria a folha
    // para os treze setores.
    chave: "pessoal",
    naturezas: ["PESSOAL"] as Natureza[],
    rotulo: "Pessoal",
    medida: "mensal",
    resumo: "Folha, encargos e benefícios.",
  },
  {
    chave: "tudo",
    naturezas: null,
    rotulo: "Tudo",
    medida: null,
    resumo: "As quatro naturezas juntas. Serve para procurar, não para somar.",
  },
] as const;

export type ChaveRecorte = (typeof RECORTES)[number]["chave"];

/**
 * Como a lista se agrupa.
 *
 * É a resposta ao pedido de "pasta" sem o problema da pasta: o grupo é DERIVADO
 * do dado, não arquivado à mão. Não desatualiza, não exige que alguém decida
 * onde uma coisa mora, e o mesmo custo aparece no grupo certo em cada
 * agrupamento — o que uma árvore não consegue fazer, porque um custo rateado
 * 40/30/30 pertence a três setores ao mesmo tempo.
 */
export const AGRUPAMENTOS = [
  { chave: "", rotulo: "Sem agrupar" },
  { chave: "fornecedor", rotulo: "Por fornecedor" },
  { chave: "categoria", rotulo: "Por categoria" },
  // NÃO existe "por setor", e a ausência é uma decisão.
  //
  // Fornecedor e categoria são campos de valor único: cada custo pertence a um,
  // e o subtotal dos grupos fecha com o total. Setor não é — um custo rateado
  // 40/30/30 pertence a três ao mesmo tempo. Agrupar por ele exigiria escolher
  // entre repetir a linha em três grupos (e quebrar seleção, contagem e o
  // próprio conceito de linha) ou mostrá-la só no maior (e somar valor cheio num
  // grupo que só tem 40% dele). As duas saídas produzem um número errado com
  // cara de relatório.
  //
  // A pergunta "quanto é de cada setor" já tem resposta certa noutro lugar: o
  // panorama do setor, que soma a fração rateada. O chip de setor filtra; o
  // panorama soma. Nenhum dos dois precisa mentir.
] as const;

export type ChaveAgrupamento = (typeof AGRUPAMENTOS)[number]["chave"];

/** Valor explícito de "sem recorte de ano" — distinto da ausência, que vira o padrão. */
export const TODOS_OS_ANOS = "todos";

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
  // Só vale para o que aconteceu uma vez: sem a data do fato, a compra não
  // entra em nenhum exercício e some do total do ano.
  { chave: "aquisicao", rotulo: "sem data de aquisição" },
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
  /** A natureza — o que a página é, não um filtro entre outros. */
  natureza: ChaveRecorte;
  situacao: ChaveSituacao;
  /** Ano de referência das abas que medem período. Vazio = todos os anos. */
  ano: string;
  agrupar: ChaveAgrupamento;
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
  // Recorrente é o padrão, e não "tudo", porque é o que o painel mede: sem
  // isso, clicar em "R$ 138.629,78/mês" abre uma lista cujo total é outro — e a
  // promessa de que todo número é uma porta deixa de valer no primeiro clique.
  const natureza = RECORTES.find((r) => r.chave === unico(params.nat))?.chave ?? "recorrente";
  const agrupar = AGRUPAMENTOS.find((a) => a.chave === unico(params.g))?.chave ?? "";

  const ordemPedida = ORDENS.find((o) => o.chave === unico(params.ordem))?.chave;
  // Numa aba que mede período, ordenar por "valor mensal" ordena por uma coluna
  // que nem existe: o padrão passa a ser o valor da cobrança.
  const medida = RECORTES.find((r) => r.chave === natureza)!.medida;
  const ordem = ordemPedida ?? (medida === "periodo" ? "cobranca" : "mensal");
  const dirBruta = unico(params.dir);

  return {
    natureza,
    situacao,
    // "todos" é um valor explícito, e não a ausência: sem ele não haveria como
    // dizer "quero todos os anos" numa aba cujo padrão é o ano corrente.
    ano:
      unico(params.ano) === TODOS_OS_ANOS || /^\d{4}$/.test(unico(params.ano))
        ? unico(params.ano)
        : "",
    agrupar,
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
    // "recorrente" não vai para a URL: é o padrão, e endereço limpo é endereço
    // que se cola num e-mail sem parecer erro.
    nat: recorte.natureza === "recorrente" ? "" : recorte.natureza,
    f: recorte.situacao,
    ano: recorte.ano,
    g: recorte.agrupar,
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

/**
 * As situações que fazem sentido nesta aba.
 *
 * "Renova em 90 dias" numa lista de compras avulsas é um filtro que só pode
 * devolver vazio: o que aconteceu uma vez não renova. Oferecê-lo é convidar a
 * pessoa a clicar, não achar nada, e concluir que o sistema perdeu os dados
 * dela — o mesmo raciocínio que já tira do menu de linha as ações que a action
 * recusaria depois do clique.
 */
export function situacoesDe(natureza: ChaveRecorte): typeof SITUACOES {
  const recorte = RECORTES.find((r) => r.chave === natureza)!;
  if (recorte.medida !== "periodo") return SITUACOES;
  return SITUACOES.filter((s) => s.chave !== "renovacao") as unknown as typeof SITUACOES;
}

/**
 * As lacunas que fazem sentido nesta aba.
 *
 * Espelha a regra da própria pendência: "sem data de renovação" só se cobra de
 * quem renova, e "sem data de aquisição" só de quem aconteceu uma vez.
 */
export function faltasDe(natureza: ChaveRecorte): typeof FALTAS {
  const recorte = RECORTES.find((r) => r.chave === natureza)!;
  if (!recorte.naturezas) return FALTAS;
  const fora = recorte.medida === "periodo" ? "data" : "aquisicao";
  return FALTAS.filter((x) => x.chave !== fora) as unknown as typeof FALTAS;
}

/**
 * O ano que vale nesta tela.
 *
 * As abas que medem período (pontual, investimento) precisam de um recorte
 * temporal para o total significar alguma coisa: "R$ 84 mil em compras avulsas"
 * sem dizer de quando é um número que só cresce e nunca se compara com nada. O
 * padrão é o ano corrente, e o cabeçalho declara isso em voz alta — escopo dito
 * não é escopo escondido.
 *
 * O ano de hoje entra por parâmetro em vez de ser lido aqui dentro: uma função
 * pura que muda de resposta na virada do ano é uma função que só falha em
 * janeiro, no dia em que ninguém está olhando.
 */
export function anoEfetivo(f: Pick<Filtros, "natureza" | "ano">, anoAtual: number): string {
  if (f.ano === TODOS_OS_ANOS) return "";
  if (f.ano) return f.ano;
  const recorte = RECORTES.find((r) => r.chave === f.natureza)!;
  return recorte.medida === "periodo" ? String(anoAtual) : "";
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
