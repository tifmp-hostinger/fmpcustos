/**
 * IDENTIDADE DE FORNECEDOR
 *
 * "Microsoft", "Microsoft Brasil", "MICROSOFT LTDA" e "microsoft " são quatro
 * registros diferentes num cadastro ingênuo — e o gráfico de concentração por
 * fornecedor, que existe justamente para mostrar onde a negociação vale mais,
 * morre na origem sem ninguém perceber. Não aparece erro: aparece um gráfico
 * plausível e errado, que é pior.
 *
 * A defesa tem duas camadas, de propósito:
 *
 *  1. O formulário avisa enquanto a pessoa digita, e oferece adotar o nome que
 *     já existe. É onde o erro é barato de corrigir.
 *  2. `acharOuCriarFornecedor` compara pela forma normalizada antes de criar.
 *     É a rede embaixo: importação, requisição forjada e digitação com espaço
 *     sobrando não passam por tela nenhuma.
 *
 * O que NÃO se faz aqui é unificar sozinho. "Microsoft" e "Microsoft Brasil"
 * podem ser dois contratos com duas pessoas jurídicas diferentes, e juntar
 * dois fornecedores de verdade num só é um estrago silencioso na direção
 * oposta. O sistema sugere; quem cadastra decide.
 */

/** Sufixos societários que não distinguem uma empresa de outra. */
const SUFIXOS = [
  "ltda",
  "limitada",
  "sa",
  "s a",
  "s/a",
  "eireli",
  "epp",
  "me",
  "mei",
  "inc",
  "llc",
  "corp",
  "corporation",
  "co",
  "company",
  "gmbh",
  "bv",
  "nv",
  "plc",
  "ag",
];

/**
 * Reduz o nome à sua forma comparável: minúsculas, sem acento, sem pontuação,
 * sem sufixo societário e com um espaço só entre palavras.
 */
export function normalizar(nome: string): string {
  const semAcento = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // "S/A", "S.A." e "S A" viram "sa" ANTES de a pontuação sumir. Sem este
  // passo, a barra vira espaço e o sufixo se parte em duas palavras de uma
  // letra que a remoção adiante não reconhece — "Thomson Reuters S/A" ficaria
  // como "thomson reuters s a" e nunca casaria com "Thomson Reuters".
  const comSufixoInteiro = semAcento.replace(/\bs[.\/\s]?a\.?\s*$/, " sa");

  const semPontuacao = comSufixoInteiro
    .replace(/[.,;:!?"'`´^~()[\]{}\-_/\\|&+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const palavras = semPontuacao.split(" ").filter(Boolean);
  // Só remove o sufixo quando ele não é a única palavra: um fornecedor
  // chamado literalmente "ME" existe e não pode virar string vazia.
  while (palavras.length > 1 && SUFIXOS.includes(palavras[palavras.length - 1])) {
    palavras.pop();
  }
  return palavras.join(" ");
}

/** Distância de edição, com corte: acima do limite não interessa quanto é. */
function distancia(a: string, b: string, limite: number): number {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
      if (atual[j] < menor) menor = atual[j];
    }
    // Toda a linha já passou do limite: nenhum caminho adiante melhora.
    if (menor > limite) return limite + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

export type Candidato = { nome: string; motivo: "igual" | "contido" | "parecido" };

/**
 * Fornecedores já cadastrados que podem ser a mesma empresa do nome digitado.
 *
 * Três parentescos, em ordem de certeza:
 *  - `igual`: mesma forma normalizada. "MICROSOFT LTDA" é "Microsoft".
 *  - `contido`: um nome começa com o outro. "Microsoft Brasil" e "Microsoft".
 *  - `parecido`: um erro de digitação de distância curta, proporcional ao
 *    tamanho — em nome curto, uma letra trocada já é outra empresa.
 */
export function parecidos(digitado: string, existentes: string[]): Candidato[] {
  const alvo = normalizar(digitado);
  if (alvo.length < 3) return [];

  const achados: Candidato[] = [];
  const vistos = new Set<string>();

  for (const nome of existentes) {
    const outro = normalizar(nome);
    if (!outro || vistos.has(outro)) continue;

    const [curto, longo] = alvo.length <= outro.length ? [alvo, outro] : [outro, alvo];

    let motivo: Candidato["motivo"] | null = null;
    if (outro === alvo) {
      // Idêntico depois de normalizar, mas escrito de outro jeito: só vale
      // avisar se a grafia diferir de fato.
      motivo = nome.trim() === digitado.trim() ? null : "igual";
    } else if (outro.startsWith(`${alvo} `) || alvo.startsWith(`${outro} `)) {
      // Um nome é o outro mais palavras: "Microsoft" e "Microsoft Brasil".
      // Podem ser a mesma empresa ou duas pessoas jurídicas distintas — quem
      // cadastra decide, o sistema só aponta.
      motivo = "contido";
    } else if (curto.length >= 4 && longo.length - curto.length <= 2 && longo.startsWith(curto)) {
      // Letra a mais ou a menos no fim: "Adobee" por "Adobe".
      motivo = "parecido";
    } else {
      // Troca de letra no meio. Só a partir de oito caracteres: em nome curto,
      // uma letra diferente costuma ser outra empresa — "Vivo" e "Nivo" não
      // têm nada a ver uma com a outra, e alarme falso ensina a ignorar avisos.
      const limite = alvo.length < 8 ? 0 : alvo.length <= 14 ? 1 : 2;
      if (limite > 0 && distancia(alvo, outro, limite) <= limite) motivo = "parecido";
    }

    if (motivo) {
      achados.push({ nome, motivo });
      vistos.add(outro);
    }
  }

  const ordem = { igual: 0, contido: 1, parecido: 2 } as const;
  return achados.sort((a, b) => ordem[a.motivo] - ordem[b.motivo]).slice(0, 3);
}

/** A frase que a tela mostra para cada tipo de parentesco. */
export function explicar(candidato: Candidato, digitado: string): string {
  switch (candidato.motivo) {
    case "igual":
      return `Já existe “${candidato.nome}” — é o mesmo nome escrito de outro jeito.`;
    case "contido":
      return `Já existe “${candidato.nome}”. Se for a mesma empresa, use o nome que já está no sistema.`;
    default:
      return `Já existe “${candidato.nome}”. Foi engano de digitação em “${digitado}”?`;
  }
}
