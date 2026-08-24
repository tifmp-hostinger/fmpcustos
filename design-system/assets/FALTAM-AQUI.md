# Faltam os arquivos da marca

O `ui_kits/website/` referencia estes arquivos, e a plataforma precisa deles
para pôr a marca no cabeçalho:

- `logo-red.png` · `logo-black.png` · `logo-primary.png` (branco)
- `symbol-red.png` · `symbol-black.png` — a fagulha de quatro pontas

O guia da marca proíbe recriar o logotipo em texto ou redesenhar a fagulha em
vetor. Enquanto os arquivos não chegarem, `src/components/marca.tsx` mantém o
espaço reservado com o nome por extenso — errado de propósito e fácil de achar.
