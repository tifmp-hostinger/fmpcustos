# ---------------------------------------------------------------------------
# Imagem de produção para o EasyPanel.
# Build multi-stage: as dependências de build não vão para a imagem final.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- dependências --------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build ---------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `prisma generate` NÃO conecta ao banco, mas carrega o prisma.config.ts — e o
# helper env() falha se a variável não existir. Este valor é descartável e vive
# só neste estágio: o runner recebe a DATABASE_URL real do painel.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npx prisma generate && npx next build

# --- Ferramentas de operação (migrations e seed) --------------------------
# A CLI do Prisma tem árvore de dependências própria (@prisma/config puxa
# `effect`, entre outras). Copiar subpastas de node_modules a dedo quebra.
# Aqui ela é instalada inteira, num estágio isolado, e só ela vai para o runner.
#
# tsx, adapter-pg e pg entram porque `prisma db seed` executa prisma/seed.ts —
# o Next embute essas dependências no bundle do servidor, mas o seed roda fora dele.
#
# As versões DEVEM acompanhar as de package.json.
FROM base AS migrator
WORKDIR /migrator
RUN npm install --no-save --no-audit --no-fund \
      prisma@7.9.1 \
      dotenv@17.4.2 \
      tsx@4.23.12 \
      @prisma/adapter-pg@7.9.1 \
      pg@8.23.0

# --- runtime -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# `prisma db seed` invoca `tsx` pelo PATH, não pelo node_modules/.bin.
# Também permite ao operador rodar `prisma` direto no terminal do container.
ENV PATH=/app/node_modules/.bin:$PATH

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Saída standalone do Next.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations + CLI do Prisma, para aplicar o schema no start.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
# O client gerado e os utilitários são importados por prisma/seed.ts, que roda
# FORA do bundle do Next — o tracing do Next não os alcança.
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/src/lib ./src/lib
# Árvore completa da CLI, mesclada no node_modules do standalone. O prisma.config.ts
# resolve `prisma/config` e `dotenv` a partir daqui.
COPY --from=migrator --chown=nextjs:nodejs /migrator/node_modules ./node_modules
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
