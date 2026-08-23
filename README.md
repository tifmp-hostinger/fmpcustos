# Custos FMP

Plataforma corporativa de inteligência de custos da **FMP — Fundação Escola Superior do Ministério Público**.

Cobre os 13 setores da Fundação desde a primeira versão. Não é um sistema de cadastro:
o objetivo é que o dado gere indicador, alerta, rateio e recomendação.

> **Estado atual:** esqueleto da Entrega 1. Modelo de dados, importador/auditor da
> planilha, camada semântica e empacotamento estão prontos. Telas de cadastro,
> autenticação e fechamento de competência ainda não.

---

## O que já existe

| Componente | Estado |
| --- | --- |
| Modelo de dados completo (23 entidades) | ✅ migration aplicada |
| Camada semântica (métricas nomeadas e tipadas) | ✅ |
| Importador/auditor da planilha atual | ✅ 108 achados na base real |
| Seed dos 13 setores, categorias e capacidades | ✅ |
| Dockerfile multi-stage para EasyPanel | ✅ |
| CI (typecheck, lint, migrations, build) | ✅ |
| Autenticação SSO Microsoft | ⛔ Entrega 1 |
| Telas de cadastro e fechamento de competência | ⛔ Entrega 1 |
| CAPEX e custo de pessoal | ⏸ decisão em aberto (integrar × construir) |

---

## Começando

```bash
cp .env.example .env          # ajuste DATABASE_URL
npm install
docker compose up -d db       # ou aponte para um Postgres existente
npm run db:migrate
npm run db:seed               # 13 setores, 16 categorias, 16 capacidades
npm run dev
```

Aplicação em <http://localhost:3000>. Healthcheck em `/api/health`.

### Auditar a planilha atual

```bash
npm run importar -- caminho/para/planilha.xlsx
```

Gera `dados/saida/relatorio-inconsistencias.md` e `dados/saida/staging.json`.
O importador é também o auditor: ele não corrige nada em silêncio — ele lista
o que precisa de decisão humana.

---

## Decisões de arquitetura que valem conhecer antes de mexer

**1. Contrato ≠ Item de custo ≠ Lançamento mensal.**
São três entidades. Achatá-las numa linha só foi a causa raiz de quase todos os
problemas da planilha: não havia onde colocar vigência (é do contrato),
quantidade (é do item) nem variação mensal (é do lançamento).

**2. `natureza` é obrigatória em todo fato.**
`RECORRENTE`, `PONTUAL`, `CAPEX`, `PESSOAL`. Nenhuma métrica soma naturezas
diferentes por padrão — consolidar é sempre um ato explícito de quem chama.
É o que permite abrir a plataforma para 13 setores sem abrir custo de pessoal junto.

**3. Dinheiro é `Decimal(14,2)` com moeda explícita.**
Nunca `float`, nunca texto. A planilha atual já carrega artefato de ponto
flutuante nos próprios totais (`116874.36000000002`).

**4. `valorMensalNormalizado` é derivado, nunca digitado.**
Ver `src/lib/dinheiro.ts`. A planilha somava mensal, trimestral, semestral e
anual na mesma coluna e chamava o resultado de total mensal.

**5. Status é enum. Cor de célula não é dado.**
Item cancelado sai do total corrente e permanece no histórico.

**6. Rateio é entidade versionada por vigência.**
Soma validada em 100%. Rateio do lançamento vence o rateio padrão do item.
Lançamento sem rateio cai em "Não rateado" — visível, nunca descartado.

**7. A camada semântica é a única fonte de cálculo.**
`src/lib/metricas/`. Dashboard, relatório e (na Fase 4) a IA chamam as mesmas
funções tipadas. A IA nunca escreve SQL contra o banco.

**8. Completude por setor é requisito, não enfeite.**
Um sistema com 1 setor preenchido e 12 vazios é pior que a planilha, porque
parece completo. Nenhuma visão consolidada é renderizada sem dizer quem ainda
não reportou.

---

## Estrutura

```
prisma/
  schema.prisma          modelo de dados
  migrations/            migrations versionadas
  seed.ts                13 setores, categorias, capacidades
scripts/
  importar-planilha.ts   importador + auditor (as 22 regras do diagnóstico)
src/
  app/                   Next.js App Router
  lib/
    db.ts                Prisma client com adapter pg
    dinheiro.ts          Decimal + normalização de periodicidade
    metricas/            CAMADA SEMÂNTICA — toda métrica vive aqui
docs/
  modelo-de-dados.md
  deploy-easypanel.md
```

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Cria e aplica migration (dev) |
| `npm run db:deploy` | Aplica migrations pendentes (produção) |
| `npm run db:seed` | Popula setores, categorias e capacidades |
| `npm run db:studio` | Prisma Studio |
| `npm run importar -- <arquivo.xlsx>` | Importa e audita uma planilha |

---

## Stack

Next.js 16 · TypeScript · PostgreSQL 16 · Prisma 7 · Tailwind CSS 4 · Docker.

Deploy em **EasyPanel** a partir do `Dockerfile`. Ver `docs/deploy-easypanel.md`.
