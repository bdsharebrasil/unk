#!/usr/bin/env bash
set -euo pipefail

# Instala dependências básicas e Node.js LTS (Nodesource) se necessário
if ! command -v node >/dev/null 2>&1; then
  echo "Instalando Node.js LTS e dependências..."
  sudo apt-get update -y
  sudo apt-get install -y curl ca-certificates gnupg lsb-release apt-transport-https
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js já instalado: $(node -v)"
fi

# Instala supabase CLI via npm global (alternativa portátil)
if ! command -v supabase >/dev/null 2>&1; then
  echo "Instalando supabase CLI via npm..."
  sudo npm install -g supabase
else
  echo "Supabase CLI já instalado: $(supabase --version || echo 'versão indisponível')"
fi

# Instala psql (cliente Postgres) se não existir
if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando postgresql-client (psql)..."
  sudo apt-get install -y postgresql-client
else
  echo "psql já instalado: $(psql --version | head -n1)"
fi

echo "Instalação concluída. Para usar a CLI: supabase login && supabase link --project-ref <PROJECT_REF>"