#!/bin/sh
set -e

# Aplica as migrations pendentes antes de subir a aplicação.
# `migrate deploy` nunca gera migration nova nem apaga dados — é seguro no start.
if [ -n "$DATABASE_URL" ]; then
  echo "Aplicando migrations…"
  ./node_modules/.bin/prisma migrate deploy || {
    echo "Falha ao aplicar migrations." >&2
    exit 1
  }
else
  echo "DATABASE_URL não definida — pulando migrations." >&2
fi

exec "$@"
