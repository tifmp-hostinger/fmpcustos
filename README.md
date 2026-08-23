# Custos FMP

Plataforma corporativa de inteligência de custos da **FMP — Fundação Escola Superior do Ministério Público**.

Cobre os 13 setores da Fundação desde a primeira versão. Não é um sistema de cadastro:
o objetivo é que o dado gere indicador, alerta, rateio e recomendação.

> **Estado atual:** sistema utilizável. Login, gestão de usuários por perfil e
> setor, cadastro de custos e dashboards de decisão estão no ar. Fechamento de
> competência, CAPEX e pessoal ainda não.

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
| Login com e-mail e senha, sessão assinada | ✅ |
| Gestão de usuários por perfil e setor | ✅ |
| Cadastro de custos com escopo por setor | ✅ |
| Dashboards de decisão | ✅ |
| Scripts SQL para aplicar direto no banco | ✅ |
| Fechamento mensal por competência | ⛔ próximo |
| SSO Microsoft Entra ID | ⛔ próximo |
| CAPEX e custo de pessoal | ⏸ decisão em aberto (integrar × construir) |

---

## Quem faz o quê

| Perfil | Enxerga | Pode |
| --- | --- | --- |
| **Administrador** | todos os setores | tudo, incluindo criar usuários e definir perfil e setor |
| **Gestor de setor** | só o próprio setor | cadastrar e editar os custos da própria área |
| **Gestor de contrato** | só o próprio setor | cadastrar e editar os custos da própria área |
| **Controladoria** | todos os setores | consultar; não gerencia usuários |
| **Leitor** | só o próprio setor | consultar |

O gestor de setor **não escolhe** o setor ao lançar: o custo vai para a área dele.
Só quem enxerga por inteiro pode escolher.

---

## Começando

```bash
cp .env.example .env
# Preencha DATABASE_URL, AUTH_SECRET (openssl rand -base64 32) e ADMIN_EMAIL.
npm install
docker compose up -d db       # ou aponte para um Postgres existente
npm run db:migrate
npm run db:seed               # setores, categorias, capacidades e o 1º admin
npm run dev
```

Aplicação em <http://localhost:3000>. Healthcheck em `/api/health`.

O seed imprime a senha do administrador **uma única vez**. Se já houver qualquer
administrador no banco, ele não faz nada — rodar de novo nunca reabre uma conta.

### Aplicar o banco por SQL, sem o Prisma

Para quem prefere rodar direto no Postgres:

```bash
psql "$DATABASE_URL" -f scripts/sql/00-diagnostico.sql    # só leitura: mostra o estado
psql "$DATABASE_URL" -f scripts/sql/01-esquema.sql        # tabelas, enums, índices
psql "$DATABASE_URL" -f scripts/sql/02-dados-iniciais.sql # 13 setores + categorias

npx tsx scripts/gerar-sql-admin.ts "voce@fmp.com.br" "Seu Nome" "suaSenhaForte123"
psql "$DATABASE_URL" -f scripts/sql/03-administrador.sql  # primeiro admin
```

Se o container já está no ar, as migrations **já foram aplicadas** e você não
precisa do `01`: vá direto para o `02`.

O `02` roda **sem transação**, de propósito. Cada comando é independente e
idempotente, então um erro aparece com a causa real, em vez de virar
`current transaction is aborted` (25P02) — que só informa que algo anterior
falhou e esconde o motivo. Ele também não usa `gen_random_uuid()` nem blocos
`DO $$`, que quebram em cliente gráfico ou em PostgreSQL antigo.

O `01` e o `02` são gerados a partir das migrations e do seed, então nunca
divergem deles. Rodar de novo não duplica nada. O terceiro é um **gerador**,
não um arquivo fixo: a senha vira hash na sua máquina e o SQL nunca carrega a
senha em texto — por isso ele fica fora do versionamento.

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

**9. Escopo por setor é aplicado na consulta, não na tela.**
`escopoDeItens()` em `src/lib/consultas.ts` entra no `where` de toda busca.
Esconder um botão não é controle de acesso.

**10. Os gráficos são de magnitude, não de identidade.**
Todas as barras medem reais por mês, então usam um único tom. Colorir por
posição no ranking faria a cor mudar de dono a cada filtro.

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
| `npm run importar -- <arquivo.xlsx>` | Audita uma planilha e gera o relatório |
| `npm run importar -- <arquivo.xlsx> --sql TI` | O mesmo, e gera o SQL de carga para o setor |
| `npm run diagnostico` | Estado do ambiente: variáveis, banco, esquema, usuários |
| `npm run senha -- <email> '<senha>'` | Define a senha de um usuário; cria como ADMIN se não existir |
| `npx tsx scripts/gerar-sql-dados.ts` | Regera o SQL de dados iniciais |
| `npx tsx scripts/gerar-sql-admin.ts <email> <nome> [senha]` | Gera o SQL do primeiro admin |

---

## Stack

Next.js 16 · TypeScript · PostgreSQL 16 · Prisma 7 · Tailwind CSS 4 · Docker.

Deploy em **EasyPanel** a partir do `Dockerfile`. Ver `docs/deploy-easypanel.md`.
