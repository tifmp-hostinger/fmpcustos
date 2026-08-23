# Deploy no EasyPanel

> **A ordem importa.** O serviço Postgres tem que existir *antes* do serviço da
> aplicação. Sem ele, a aplicação sobe mas não tem o que ler — e é o erro mais
> comum no primeiro deploy.

## 1. Serviço Postgres

No projeto do EasyPanel: **+ Service → Postgres**. Anote três coisas que o
painel gera ou que você define, porque elas montam a `DATABASE_URL` do passo 2:

| Campo | Onde aparece | Vira o quê na URL |
| --- | --- | --- |
| Nome do serviço | você escolhe, ex. `fmpcustos-db` | o **host** |
| Usuário e senha | gerados pelo painel | as credenciais |
| Nome do banco | você escolhe, ex. `fmpcustos` | o banco |

O serviço roda a imagem oficial Ele roda a imagem oficial
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

Monte a `DATABASE_URL` com os dados anotados no passo 1:

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

A imagem expõe `/api/health`, e o `HEALTHCHECK` do Dockerfile aponta para ele.
Ele mede **liveness do processo**, não do banco: responde 200 sempre que a
aplicação está de pé, informando o estado do banco no corpo da resposta.

## 6. Quando algo dá errado

A aplicação **não** morre quando o banco está fora. O entrypoint tenta aplicar as
migrations 6 vezes, com espera crescente, e mesmo falhando entrega o controle ao
servidor. Isso é proposital: um container em loop de reinício não mostra nada, e
o sintoma vira apenas "não abre".

Com o banco indisponível você tem dois lugares para olhar, ambos respondendo:

- a **URL do serviço** mostra uma tela nomeando o problema e o que verificar;
- **`/api/health`** devolve o mesmo em JSON, e responde 200 mesmo com o banco
  fora — de propósito. Se devolvesse 503, o HEALTHCHECK marcaria o container como
  não saudável, o proxy pararia de rotear, e você perderia justamente o
  diagnóstico.

O log do container traz o mesmo texto.

## 7. Ordem do primeiro deploy

1. Criar o serviço Postgres e configurar backup — **antes de tudo**
2. Subir o serviço App com as variáveis de ambiente apontando para ele
3. Conferir que as migrations aplicaram (log do container)
4. Rodar o seed
5. Acessar `/api/health` e confirmar `{"status":"ok"}`
6. Acessar a raiz e conferir os 13 setores no painel
