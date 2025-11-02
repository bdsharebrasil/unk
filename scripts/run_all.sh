#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Executa instalação de ferramentas
bash "${SCRIPT_DIR}/install_supabase_cli.sh"

# aceita DATABASE_URL como argumento ou via env
if [ "${1:-}" != "" ]; then
  DATABASE_URL_ARG="$1"
else
  DATABASE_URL_ARG="${DATABASE_URL:-}"
fi

if [ -z "${DATABASE_URL_ARG}" ]; then
  echo ""
  echo "AVISO: Nenhum DATABASE_URL fornecido. Defina a variável ou passe como argumento."
  echo "Exemplo:"
  echo "  export DATABASE_URL=\"postgres://user:pass@host:5432/db\""
  echo "  sudo bash ${SCRIPT_DIR}/run_all.sh"
  exit 1
fi

bash "${SCRIPT_DIR}/apply_migrations_with_psql.sh" "${DATABASE_URL_ARG}"