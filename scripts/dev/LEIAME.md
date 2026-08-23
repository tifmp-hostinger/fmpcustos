# Ferramentas de desenvolvimento

Nada aqui roda em produção. São dois scripts para conferir o sistema numa base
descartável, antes de subir qualquer coisa para o EasyPanel.

## `semear-demo.ts` — base de demonstração

Apaga tudo e recria 13 setores, 5 usuários (um de cada perfil), 4 categorias e
25 custos representativos — mensais, anuais, trimestrais, por consumo, com e sem
data de renovação, alguns já com lançamentos de competência. É a base que o
teste de ponta a ponta espera encontrar.

```bash
DATABASE_URL="postgresql://…" npm run dev:semear
```

Todos os usuários usam a senha `teste12345`:

| e-mail | perfil |
|---|---|
| `admin@fmp.com.br` | Administrador |
| `ti@fmp.com.br` | Gestor do setor de TI |
| `mkt@fmp.com.br` | Gestor de Comunicação e Marketing |
| `controladoria@fmp.com.br` | Controladoria |
| `leitor@fmp.com.br` | Leitor |

**Nunca aponte para o banco de produção.** A primeira instrução do script é um
`TRUNCATE`.

## `e2e.mjs` — teste de ponta a ponta

Sobe um navegador de verdade e percorre o sistema pelos quatro perfis,
verificando o que a interface promete: os atalhos da linha, o desfazer, a
lixeira, o rateio com setor âncora, a proposta e o aceite, o que o leitor não
pode fazer e a navegação por teclado.

```bash
# 1. build de produção e servidor
npm run build && node .next/standalone/server.js

# 2. base limpa
DATABASE_URL="postgresql://…" npm run dev:semear

# 3. teste
E2E_URL=http://127.0.0.1:3000 npm run dev:e2e
```

Sai com código 1 se qualquer verificação falhar.

## `testar-rateio.ts` — aritmética do rateio

Roda sem banco e sem navegador. Cobre o caso que originou o desenho da tela
(100% num setor, entra outro com 10%, o primeiro cai para 90%), os terços que
precisam somar exatamente 100%, o centavo do arredondamento e os formatos que
as pessoas realmente digitam.

```bash
npm run testar:rateio
```
