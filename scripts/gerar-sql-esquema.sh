#!/bin/sh
# Regenera scripts/sql/01-esquema.sql a partir de prisma/migrations.
# Rode sempre que criar uma migration nova:  sh scripts/gerar-sql-esquema.sh
set -e
cd "$(dirname "$0")/.."
DESTINO=scripts/sql/01-esquema.sql

{
  echo "-- ============================================================================"
  echo "-- 01 · ESQUEMA COMPLETO"
  echo "--"
  echo "-- GERADO por scripts/gerar-sql-esquema.sh a partir de prisma/migrations."
  echo "-- Não edite à mão; regenere após criar uma migration."
  echo "--"
  echo "-- Como rodar:"
  echo "--   psql \"\$DATABASE_URL\" -f scripts/sql/01-esquema.sql"
  echo "--"
  echo "-- Você NÃO precisa deste arquivo se usar o container: o entrypoint roda"
  echo "-- 'prisma migrate deploy' sozinho no start."
  echo "--"
  echo "-- Este script CRIA o esquema e roda numa transação: DDL é tudo ou nada."
  echo "-- Por isso, aqui um erro vira \"current transaction is aborted\" (25P02) nos"
  echo "-- comandos seguintes — o erro real é sempre o PRIMEIRO da saída."
  echo "-- ============================================================================"
  echo ""
  echo "BEGIN;"
  echo ""
  echo "-- Guarda: rodar duas vezes deve dizer o motivo, não despejar erro cru."
  echo "DO \$\$"
  echo "BEGIN"
  echo "  IF to_regclass('public.setor') IS NOT NULL THEN"
  echo "    RAISE EXCEPTION 'O esquema ja existe neste banco. Este script so roda em banco vazio; para dados iniciais use 02-dados-iniciais.sql.';"
  echo "  END IF;"
  echo "END \$\$;"
  echo ""
  for d in prisma/migrations/*/; do
    nome=$(basename "$d")
    [ -f "$d/migration.sql" ] || continue
    echo "-- ---- migration: $nome ----"
    cat "$d/migration.sql"
    echo ""
  done
  echo "-- Registra as migrations como aplicadas, para o Prisma não reaplicá-las."
  echo "CREATE TABLE IF NOT EXISTS \"_prisma_migrations\" ("
  echo "    id                      VARCHAR(36) PRIMARY KEY,"
  echo "    checksum                VARCHAR(64) NOT NULL,"
  echo "    finished_at             TIMESTAMPTZ,"
  echo "    migration_name          VARCHAR(255) NOT NULL,"
  echo "    logs                    TEXT,"
  echo "    rolled_back_at          TIMESTAMPTZ,"
  echo "    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),"
  echo "    applied_steps_count     INTEGER NOT NULL DEFAULT 0"
  echo ");"
  for d in prisma/migrations/*/; do
    nome=$(basename "$d")
    [ -f "$d/migration.sql" ] || continue
    soma=$(sha256sum "$d/migration.sql" | cut -d' ' -f1)
    uuid=$(printf '%s' "$nome" | sha256sum | cut -c1-32 | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\).*/\1-\2-\3-\4-\5/')
    echo "INSERT INTO \"_prisma_migrations\" (id, checksum, finished_at, migration_name, applied_steps_count)"
    echo "VALUES ('$uuid', '$soma', now(), '$nome', 1)"
    echo "ON CONFLICT DO NOTHING;"
  done
  echo ""
  echo "COMMIT;"
} > "$DESTINO"
echo "$DESTINO regenerado com $(ls -d prisma/migrations/*/ | wc -l | tr -d ' ') migrations."
