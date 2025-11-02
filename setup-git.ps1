#!/usr/bin/env pwsh

# Portal UNK - Git Setup Script
# Configura o repositório Git e faz push para o GitHub

Write-Host "🚀 Configurando repositório Git para Portal UNK..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não está instalado ou não está no PATH do sistema." -ForegroundColor Red
    Write-Host "Por favor, instale Git em: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""

# Inicializar repositório
Write-Host "📁 Inicializando repositório Git..." -ForegroundColor Yellow
git init

# Configurar informações do usuário
Write-Host "👤 Configurando informações do Git..." -ForegroundColor Yellow
git config user.name "UNK Portal"
git config user.email "admin@unkassessoria.com"

# Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos ao repositório..." -ForegroundColor Yellow
git add .

# Criar commit inicial com descrição detalhada
Write-Host "💾 Criando commit inicial..." -ForegroundColor Yellow
$commitMessage = @"
feat: Implementação completa do sistema de eventos, contratos e pagamentos

✨ Novas funcionalidades:
- Sistema de criação de eventos com múltiplos DJs
- Geração automática de contratos
- Sistema de assinatura digital para DJs
- Upload de comprovantes de pagamento
- Dashboard responsivo redesenhado
- Controle de permissões baseado em roles
- Relatórios financeiros com controle de acesso

🔧 Melhorias técnicas:
- Banco de dados reestruturado com novas tabelas
- Políticas RLS implementadas
- Componentes React modernos
- Layout responsivo para mobile/desktop
- Validação de arquivos e segurança aprimorada

📱 Interface:
- Perfil do DJ corrigido e funcional
- Producer dashboard redesenhado
- Modais intuitivos para gerenciamento
- Design moderno e limpo

🗂️ Arquivos principais:
- /src/components/events/EventCreationModal.tsx
- /src/components/contracts/ContractModal.tsx
- /src/components/payments/PaymentReceiptModal.tsx
- /supabase/migrations/20251102130000_event_management_improvements.sql
- /src/pages/producer-dashboard/DJProfileProducer.tsx (redesign)

🚀 Para executar:
1. npm install
2. Aplicar migração no Supabase
3. npm run dev
"@

git commit -m $commitMessage

# Adicionar repositório remoto
Write-Host "🌐 Configurando repositório remoto..." -ForegroundColor Yellow
try {
    git remote add origin https://github.com/sejaunky/portalconexaounk.git
} catch {
    Write-Host "⚠️  Remote origin já existe, atualizando..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/sejaunky/portalconexaounk.git
}

# Renomear branch para main
Write-Host "🌿 Configurando branch principal..." -ForegroundColor Yellow
git branch -M main

# Fazer push para o repositório remoto
Write-Host "⬆️  Enviando código para o GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Repositório configurado com sucesso!" -ForegroundColor Green
    Write-Host "🔗 Disponível em: https://github.com/sejaunky/portalconexaounk.git" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "⚠️  Erro ao fazer push. Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   - Repositório remoto já existe com conteúdo" -ForegroundColor Gray
    Write-Host "   - Credenciais do GitHub não configuradas" -ForegroundColor Gray
    Write-Host "   - Sem permissão para o repositório" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 Para resolver:" -ForegroundColor Cyan
    Write-Host "   git push --force-with-lease origin main" -ForegroundColor Gray
    Write-Host "   (se você tem certeza de que quer sobrescrever)" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para continuar"