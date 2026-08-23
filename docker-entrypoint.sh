#!/bin/sh
set -e

# Oculta a senha antes de imprimir a URL no log.
mascarar_url() {
  echo "$1" | sed -E 's#(://[^:/]+):[^@]*@#\1:***@#'
}

separador() {
  echo "======================================================================" >&2
}

if [ -z "$DATABASE_URL" ]; then
  separador
  echo "DATABASE_URL não está definida." >&2
  echo "" >&2
  echo "Defina-a nas variáveis de ambiente do serviço, no painel." >&2
  echo "Use o hostname INTERNO do serviço Postgres dentro do projeto —" >&2
  echo "nunca 'localhost' nem IP público. Exemplo:" >&2
  echo "" >&2
  echo "  postgresql://usuario:senha@fmpcustos_db:5432/fmpcustos?schema=public" >&2
  echo "" >&2
  echo "A aplicação vai subir mesmo assim e mostrar esse diagnóstico na tela." >&2
  separador
else
  echo "Banco: $(mascarar_url "$DATABASE_URL")"

  tentativa=1
  maximo=6
  aplicou=0

  while [ "$tentativa" -le "$maximo" ]; do
    if prisma migrate deploy; then
      aplicou=1
      break
    fi

    if [ "$tentativa" -eq "$maximo" ]; then
      break
    fi

    espera=$((tentativa * 3))
    echo "Tentativa $tentativa/$maximo falhou. Nova tentativa em ${espera}s…" >&2
    sleep "$espera"
    tentativa=$((tentativa + 1))
  done

  if [ "$aplicou" -eq 0 ]; then
    separador
    echo "Não foi possível aplicar as migrations após $maximo tentativas." >&2
    echo "" >&2
    echo "Causas mais comuns, nesta ordem:" >&2
    echo "  1. DATABASE_URL aponta para 'localhost' em vez do hostname interno" >&2
    echo "     do serviço Postgres dentro do projeto." >&2
    echo "  2. O serviço Postgres ainda não subiu ou está com outro nome." >&2
    echo "  3. Usuário, senha ou nome do banco divergem do serviço." >&2
    echo "" >&2
    echo "A aplicação vai subir mesmo assim: acesse a URL do serviço para ver" >&2
    echo "o diagnóstico na tela, e /api/health para o estado em JSON." >&2
    separador
  else
    echo "Migrations aplicadas."
  fi
fi

exec "$@"
