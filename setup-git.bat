@echo off
echo 🚀 Configurando repositorio Git para Portal UNK...
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git não está instalado ou não está no PATH do sistema.
    echo Por favor, instale Git em: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git encontrado!
echo.

REM Inicializar repositório
echo 📁 Inicializando repositório Git...
git init

REM Configurar informações do usuário (se necessário)
echo 👤 Configurando informações do Git...
git config user.name "UNK Portal"
git config user.email "admin@unkassessoria.com"

REM Adicionar todos os arquivos
echo 📦 Adicionando arquivos ao repositório...
git add .

REM Criar commit inicial
echo 💾 Criando commit inicial...
git commit -m "feat: Implementação completa do sistema de eventos, contratos e pagamentos

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
- Design moderno e limpo"

REM Adicionar repositório remoto
echo 🌐 Configurando repositório remoto...
git remote add origin https://github.com/sejaunky/portalconexaounk.git

REM Renomear branch para main (padrão atual do GitHub)
git branch -M main

REM Fazer push para o repositório remoto
echo ⬆️  Enviando código para o GitHub...
git push -u origin main

echo.
echo ✅ Repositório configurado com sucesso!
echo 🔗 Disponível em: https://github.com/sejaunky/portalconexaounk.git
echo.
pause