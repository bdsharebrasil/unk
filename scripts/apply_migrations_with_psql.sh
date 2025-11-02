#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="/workspaces/unkportal/migrations"

# DATABASE_URL pode ser passado como primeiro argumento ou via env
if [ "${1:-}" != "" ]; then
  DATABASE_URL="$1"
elif [ "${DATABASE_URL:-}" = "" ]; then
  echo "Erro: defina DATABASE_URL ou passe como primeiro argumento."
  echo "Ex: DATABASE_URL=\"postgres://user:pass@host:5432/db\" $0"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql não encontrado. Rode scripts/install_supabase_cli.sh primeiro."
  exit 1
fi

if [ ! -d "${MIGRATIONS_DIR}" ]; then
  echo "Diretório de migrations não encontrado: ${MIGRATIONS_DIR}"
  exit 1
fi

echo "Aplicando migrations em ${MIGRATIONS_DIR} para ${DATABASE_URL}"

shopt -s nullglob
sql_files=("${MIGRATIONS_DIR}"/*.sql)
if [ ${#sql_files[@]} -eq 0 ]; then
  echo "Nenhum arquivo .sql encontrado em ${MIGRATIONS_DIR}. Nada a aplicar."
  exit 0
fi

for file in "${sql_files[@]}"; do
  echo "=> Aplicando: ${file}"
  PGPASSWORD="${PGPASSWORD:-}" psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${file}"
done

echo "Migrations aplicadas com sucesso."