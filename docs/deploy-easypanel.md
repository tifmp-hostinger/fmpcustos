# Deploy no EasyPanel

## 1. Serviço Postgres

No projeto do EasyPanel, crie um serviço **Postgres**. Ele roda a imagem oficial
com volume persistente, credenciais geradas e aba de **Backups** com agendamento,
retenção e restauração — o que já cobre o requisito de backup da plataforma.

Configure o backup logo na criação: cron diário, retenção de pelo menos 14
cópias, destino em storage externo. **Backup que nunca foi restaurado não é
backup** — teste a restauração antes do go-live.

### Atenção: pgvector

A imagem padrão do serviço Postgres **não traz a extensão `pgvector`**, necessária
para o RAG contratual da Fase 4. Duas opções:

- **Agora (recomendado):** trocar a imagem do serviço para `pgvector/pgvector:pg16`.
  Custa nada hoje.
- **Depois:** migrar o banco para uma imagem com a extensão. Custa uma janela de
  manutenção com o sistema em produção.

## 2. Serviço App

Crie um serviço **App** apontando para este repositório.

- **Build:** `Dockerfile` (não Nixpacks — o `Dockerfile` deste repo já faz build
  multi-stage com `output: standalone`)
- **Porta:** `3000`
- **Domínio:** habilite o SSL automático (Let's Encrypt)

### Variáveis de ambiente

```
DATABASE_URL=postgresql://<usuario>:<senha>@<nome-do-servico-postgres>:5432/<banco>?schema=public
NODE_ENV=production
APP_URL=https://custos.fmp.edu.br
AUTH_SECRET=<gerar com: openssl rand -base64 32>
```

Use o **hostname interno** do serviço Postgres (o nome do serviço dentro do
projeto), não `localhost` nem IP público.

## 3. Migrations

O `docker-entrypoint.sh` roda `prisma migrate deploy` antes de subir a aplicação.
Esse comando **nunca** gera migration nova nem apaga dados — ele apenas aplica o
que já está versionado em `prisma/migrations/`. É seguro no start de cada deploy.

O seed **não** roda automaticamente. Execute uma vez, pelo terminal do serviço:

```bash
prisma db seed
```

A imagem inclui a CLI do Prisma e o `tsx` justamente para este passo, e
`/app/node_modules/.bin` já está no `PATH`.

### Por que a imagem carrega a CLI do Prisma

Duas armadilhas encontradas ao validar este Dockerfile, documentadas para quem
for mexer nele:

1. **`prisma generate` exige `DATABASE_URL` no build.** Ele não conecta ao banco,
   mas carrega o `prisma.config.ts`, e o helper `env()` falha se a variável não
   existir. O estágio de build define um valor descartável; o runner recebe a URL
   real do painel.
2. **Não dá para copiar pedaços de `node_modules`.** `@prisma/config` depende de
   `effect` e de outras transitivas. Por isso existe o estágio `migrator`, que
   instala a CLI inteira e é copiado de uma vez.

## 4. Requisitos do VPS

- Ubuntu com Docker (o instalador do EasyPanel cuida disso)
- **4 GB de RAM.** O mínimo de 2 GB documentado pelo EasyPanel aperta durante o
  build do Next.js com o Postgres no mesmo host.
- Portas 80 e 443 livres

## 5. Healthcheck

A imagem expõe `/api/health`, que testa a conexão com o banco e responde 503
quando o Postgres está fora. O `HEALTHCHECK` do Dockerfile já aponta para ele.

## 6. Ordem do primeiro deploy

1. Subir o serviço Postgres e configurar backup
2. Subir o serviço App com as variáveis de ambiente
3. Conferir que as migrations aplicaram (log do container)
4. Rodar o seed
5. Acessar `/api/health` e confirmar `{"status":"ok"}`
6. Acessar a raiz e conferir os 13 setores no painel
