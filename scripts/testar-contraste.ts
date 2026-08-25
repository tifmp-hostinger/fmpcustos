import { readFileSync } from "node:fs";

/**
 * O CONTRASTE DO TEMA, CONFERIDO POR MÁQUINA.
 *
 * Existe por causa de um defeito que passou por uma revisão inteira: trocar
 * `--accent` de `#c81e33` para o vermelho oficial `#EE2A42` acertou a marca e
 * derrubou o texto vermelho pequeno de 4,90:1 para 3,59:1 — abaixo do AA. Nada
 * quebrou, nenhum teste ficou vermelho, e a tela continuou parecendo certa;
 * simplesmente ficou menos legível para quem tem pouca visão, que é justamente
 * quem não vai relatar.
 *
 * Contraste é aritmética, e aritmética não precisa de olho humano para ser
 * conferida. Este arquivo lê os tokens do `globals.css` DE VERDADE — não uma
 * cópia deles — e reprova o build quando um par cai abaixo do que a WCAG pede.
 * Se alguém trocar uma cor sem fazer a conta, é aqui que descobre.
 *
 * Os limites da WCAG 2.1 AA usados aqui:
 *   4,5:1  texto normal
 *   3,0:1  texto grande (≥24px, ou ≥18,66px em negrito) e componente de UI
 */

/*
 * Os comentários saem ANTES de qualquer leitura.
 *
 * Este arquivo documenta as próprias cores em prosa — inclusive escrevendo
 * `--accent: #c81e33` para contar o que havia antes. Sem tirar os comentários,
 * o teste lia a explicação em vez do código e aprovava um valor que não está
 * em lugar nenhum do tema.
 */
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/**
 * Lê `--nome: #rrggbb`, seguindo `var()` quando for o caso.
 *
 * O escopo é onde se procura PRIMEIRO — o bloco do modo escuro sobrescreve
 * alguns nomes e não define os outros. Quando não acha ali, cai para o arquivo
 * inteiro: é exatamente o que a cascata do CSS faz.
 */
function token(nome: string, escopo: string): string {
  const daqui = escopo.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  const doTema = css.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  const achado = daqui ?? doTema;
  if (!achado) throw new Error(`token --${nome} não existe em globals.css`);
  const valor = achado[1].trim();
  const referencia = valor.match(/^var\(--([\w-]+)\)$/);
  return referencia ? token(referencia[1], escopo) : valor;
}

function luminancia(cor: string): number {
  const h = cor.replace("#", "");
  const canal = (par: string) => {
    const v = parseInt(par, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * canal(h.slice(0, 2)) + 0.7152 * canal(h.slice(2, 4)) + 0.0722 * canal(h.slice(4, 6))
  );
}

function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

let falhas = 0;
function exige(nome: string, frente: string, fundo: string, minimo: number) {
  const r = razao(frente, fundo);
  const passou = r >= minimo;
  if (!passou) falhas++;
  console.log(
    `${passou ? "  ok  " : " FALHA"}  ${nome}  → ${r.toFixed(2)}:1 (mínimo ${minimo.toFixed(1)})  ${frente} sobre ${fundo}`,
  );
}

// O bloco do modo escuro é lido à parte: lá os mesmos nomes têm outros valores.
const escuro = css.slice(css.indexOf("prefers-color-scheme: dark"));

console.log("\n— Tema claro —");
const claro = css.slice(0, css.indexOf("prefers-color-scheme: dark"));
const fundoClaro = token("ground", claro);
exige("texto principal", token("ink", claro), fundoClaro, 4.5);
exige("texto secundário", token("ink-2", claro), fundoClaro, 4.5);
// `--ink-3` é legenda e apoio, sempre texto pequeno: vale o limite cheio.
exige("texto de apoio", token("ink-3", claro), fundoClaro, 4.5);
exige("texto em vermelho (pequeno)", token("accent-texto", claro), fundoClaro, 4.5);
// O preenchimento vermelho é COMPONENTE contra o fundo, não texto: 3:1.
exige("vermelho como preenchimento", token("accent", claro), fundoClaro, 3);
// E como texto grande — o total do painel em serifa itálica — também 3:1.
exige("vermelho em número grande", token("accent", claro), fundoClaro, 3);

console.log("\n— Tema escuro (o tratamento “prestígio” do sistema) —");
const fundoEscuro = token("ground", escuro);
exige("texto principal", token("ink", escuro), fundoEscuro, 4.5);
exige("texto secundário", token("ink-2", escuro), fundoEscuro, 4.5);
exige("texto de apoio", token("ink-3", escuro), fundoEscuro, 4.5);
exige("texto em vermelho (pequeno)", token("accent-texto", escuro), fundoEscuro, 4.5);
exige("vermelho como preenchimento", token("accent", claro), fundoEscuro, 3);

console.log("\n— Superfícies elevadas (cartão sobre o fundo) —");
exige("texto principal no cartão", token("ink", claro), token("surface", claro), 4.5);
exige("texto de apoio no cartão", token("ink-3", claro), token("surface", claro), 4.5);
exige("texto principal no cartão escuro", token("ink", escuro), token("surface", escuro), 4.5);

console.log(
  falhas === 0
    ? "\n✓ todos os pares passam no AA\n"
    : `\n✗ ${falhas} par(es) abaixo do mínimo — ver o comentário no topo de globals.css\n`,
);
process.exit(falhas === 0 ? 0 : 1);
