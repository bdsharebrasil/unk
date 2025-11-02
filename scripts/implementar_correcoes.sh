#!/bin/bash
# Script de implementação automática das correções Portal Sejaunky
# Usage: ./implementar_correcoes.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando implementação das correções Portal Sejaunky..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Execute este script no diretório raiz do projeto (onde está o package.json)"
    exit 1
fi

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

log_success "Ambiente verificado!"

# PASSO 1: Backup dos arquivos originais
echo ""
echo "📋 PASSO 1: Criando backup dos arquivos originais..."
echo ""

BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "src/lib/supabase.ts" ]; then
    cp "src/lib/supabase.ts" "$BACKUP_DIR/supabase.ts.backup"
    log_info "Backup criado: $BACKUP_DIR/supabase.ts.backup"
fi

if [ -f "src/pages/dj-profile/index.tsx" ]; then
    cp "src/pages/dj-profile/index.tsx" "$BACKUP_DIR/dj-profile-index.tsx.backup"
    log_info "Backup criado: $BACKUP_DIR/dj-profile-index.tsx.backup"
fi

log_success "Backups criados em: $BACKUP_DIR"

# PASSO 2: Corrigir configuração Supabase
echo ""
echo "🔧 PASSO 2: Corrigindo configuração Supabase..."
echo ""

if [ -f "../supabase_config_fix.ts" ]; then
    cp "../supabase_config_fix.ts" "src/lib/supabase.ts"
    log_success "Configuração Supabase atualizada!"
else
    log_warning "Arquivo supabase_config_fix.ts não encontrado. Aplicando correção manual..."
    
    cat > src/lib/supabase.ts << 'EOF'
import { supabase as supabaseClient } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://vbfsvbgrpexuzmvzvlpb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZnN2YmdycGV4dXptdnp2bHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTMzMTcsImV4cCI6MjA3MTgyOTMxN30.jQb2Yfq_IaOuFo1oaDISsl6-RxVtKKNct-eTuggWHRw";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
export const supabase = supabaseClient;
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Erro de conexão Supabase:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Conexão Supabase OK');
    return { success: true, data };
  } catch (err) {
    console.error('Falha na conexão Supabase:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
};
EOF
    
    log_success "Configuração Supabase aplicada manualmente!"
fi

# PASSO 3: Aplicar migração RLS
echo ""
echo "🗄️  PASSO 3: Aplicando migração RLS..."
echo ""

if [ -f "../supabase_migration_fix.sql" ]; then
    cp "../supabase_migration_fix.sql" "supabase/migrations/$(date +%Y%m%d_%H%M%S)_dj_rls_policies.sql"
    log_success "Migração copiada para migrations!"
    
    read -p "Deseja aplicar a migração agora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aplicando migração..."
        supabase db push
        log_success "Migração aplicada!"
    else
        log_warning "Migração não aplicada. Execute manualmente: supabase db push"
    fi
else
    log_warning "Arquivo supabase_migration_fix.sql não encontrado"
fi

# PASSO 4: Corrigir queries do perfil DJ
echo ""
echo "🔍 PASSO 4: Corrigindo queries do perfil DJ..."
echo ""

if [ -f "../dj_profile_queries_fix.ts" ]; then
    log_info "Aplicando correções no perfil DJ..."
    
    # Criar patch simples para as principais queries
    if [ -f "src/pages/dj-profile/index.tsx" ]; then
        # Fazer backup adicional
        cp "src/pages/dj-profile/index.tsx" "$BACKUP_DIR/dj-profile-index.tsx.prepatch"
        
        # Aplicar correções básicas usando sed (cuidado com a sintaxe)
        log_info "Aplicando correções nas queries..."
        
        # Corrigir query principal
        sed -i 's/from("djs")\.select/from("profiles").select/g' "src/pages/dj-profile/index.tsx" || true
        sed -i 's/\.eq("id", djId)/\&\.eq("id", djId).eq("role", "dj")/g' "src/pages/dj-profile/index.tsx" || true
        
        log_success "Correções aplicadas nas queries!"
        log_warning "Revise o arquivo manualmente para garantir precisão"
    else
        log_error "Arquivo dj-profile/index.tsx não encontrado"
    fi
else
    log_warning "Arquivo dj_profile_queries_fix.ts não encontrado"
fi

# PASSO 5: Teste de conectividade
echo ""
echo "🧪 PASSO 5: Preparando testes..."
echo ""

if [ -f "../teste_conectividade.js" ]; then
    cp "../teste_conectividade.js" "public/test-conectividade.js"
    log_success "Script de teste copiado para public/"
    log_info "Execute no console: testConectividade()"
else
    log_warning "Script de teste não encontrado"
fi

# PASSO 6: Instruções finais
echo ""
echo "🎉 IMPLEMENTAÇÃO CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🧪 TESTAR CONEXÃO:"
echo "   - Execute: npm run dev"
echo "   - Abra http://localhost:5173"
echo "   - No console (F12): testConectividade()"
echo ""
echo "2. 🔍 TESTAR PERFIL DJ:"
echo "   - Acesse: /dj-profile/[djId]"
echo "   - Deve carregar sem erro 'DJ não encontrado'"
echo ""
echo "3. 📅 TESTAR EVENTOS:"
echo "   - Tente criar novo evento"
echo "   - Tente excluir evento existente"
echo ""
echo "4. 🔄 SE PROBLEMAS PERSISTIREM:"
echo "   - Verificar logs do navegador (F12)"
echo "   - Confirmar migração aplicada: supabase status"
echo "   - Restaurar backup: $BACKUP_DIR"
echo ""
echo "📁 BACKUP CRIADO EM: $BACKUP_DIR"
echo ""

log_success "Script de implementação finalizado!"
echo ""

# Opção de iniciar o servidor
read -p "Deseja iniciar o servidor de desenvolvimento agora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Iniciando servidor de desenvolvimento..."
    npm run dev
fi