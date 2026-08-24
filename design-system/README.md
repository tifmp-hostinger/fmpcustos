# Design System FMP — dentro do repositório

Esta pasta é a **fonte** do desenho da plataforma, não uma cópia de referência.
Ela está versionada aqui por um motivo prático: uma sessão em nuvem não guarda
anexos, e um sistema de design que precisa ser reenviado a cada conversa não é
um sistema — é um arquivo perdido.

## O que tem aqui

| Caminho | O que é |
|---|---|
| `colors_and_type.css` | **A autoridade.** Paleta Pantone, neutros derivados, estados do vermelho, superfícies escuras, escala tipográfica, raios, espaçamento, sombras, movimento. |
| `fonts/` | Os TTFs variáveis da marca (Outfit e Noto Serif, eixo vertical). |
| `ui_kits/website/` | O site institucional recriado em React. Não é código de produção: é o **idioma** — como a marca escreve um botão, um cartão, um filtro, um número. |

## Como a plataforma consome

`src/app/globals.css` repete o bloco `:root` de `colors_and_type.css`
**literalmente**, para que um diff entre os dois arquivos seja visível. Se a
paleta mudar aqui, ela muda lá pelo mesmo diff.

O que a plataforma *não* copia:

- **As fontes** vêm do `next/font`, não dos TTFs desta pasta. O Next baixa,
  submete a subset e serve do nosso domínio no momento do build — inclusive o
  eixo itálico do Noto Serif, que o TTF local não tem (o local é só o vertical).
  Os arquivos ficam aqui como o mestre da marca.
- **A escala tipográfica inteira.** O sistema foi desenhado para uma página de
  marketing, onde o corpo é 16px e o passo abaixo dele é 14. Uma linha de tabela
  não é um parágrafo: `globals.css` acrescenta três degraus densos abaixo do
  `--text-sm` e não mexe em nenhum degrau existente. A extensão está declarada
  como extensão, com o motivo escrito ao lado.

## O que ainda falta

`assets/` — o logotipo e o símbolo (a fagulha) em arquivo. O guia da marca é
explícito em nunca recriá-los em texto ou vetor desenhado à mão, então enquanto
os arquivos não chegarem o cabeçalho da plataforma segue sem a marca.
