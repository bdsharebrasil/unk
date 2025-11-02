# Portal UNK 🎵

Sistema completo de gerenciamento para DJs e produtores musicais com funcionalidades avançadas de eventos, contratos e pagamentos.

## 🚀 Configuração do Git Repository

Para configurar o repositório Git e fazer push para o GitHub, execute um dos seguintes comandos:

### Opção 1: Usando PowerShell (Recomendado)
```powershell
powershell -ExecutionPolicy Bypass -File setup-git.ps1
```

### Opção 2: Usando Batch
```cmd
setup-git.bat
```

### Opção 3: Manual
```bash
git init
git remote add origin https://github.com/sejaunky/portalconexaounk.git
git add .
git commit -m "feat: Implementação completa do sistema de eventos, contratos e pagamentos"
git branch -M main
git push -u origin main
```

## 📋 Pré-requisitos

- **Git**: [Download aqui](https://git-scm.com/download/win)
- **Node.js**: [Download aqui](https://nodejs.org/)
- **Conta Supabase**: Para banco de dados

## 🛠️ Configuração do Projeto

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar ambiente**:
   - O arquivo `.env` já está configurado com as credenciais do Supabase
   
3. **Aplicar migração do banco de dados**:
   - Execute o SQL em `/supabase/migrations/20251102130000_event_management_improvements.sql` no Supabase Dashboard

4. **Iniciar o servidor**:
   ```bash
   npm run dev
   ```
   ou
   ```powershell
   powershell -ExecutionPolicy Bypass -File start.ps1
   ```

## ✨ Funcionalidades Implementadas

### 🎯 Sistema de Eventos
- ✅ Criação de eventos com múltiplos DJs
- ✅ Seleção de produtor responsável
- ✅ Definição individual de cachê por DJ
- ✅ Controle de visibilidade do evento

### 📄 Sistema de Contratos
- ✅ Geração automática de contratos
- ✅ Assinatura digital para DJs
- ✅ Templates personalizáveis
- ✅ Status tracking completo

### 💰 Sistema de Pagamentos
- ✅ Upload de comprovantes por produtores
- ✅ Controle de pagamentos pelo admin
- ✅ Relatórios financeiros detalhados
- ✅ Histórico de transações

### 📱 Interface Responsiva
- ✅ Dashboard redesenhado
- ✅ Layout mobile-friendly
- ✅ Perfis de DJ completos
- ✅ Modais intuitivos

## 🔐 Controle de Acesso

### Administradores
- Criação e gestão completa de eventos
- Controle total de pagamentos
- Acesso a relatórios financeiros
- Gerenciamento de usuários

### Produtores
- Criação de eventos próprios
- Upload de comprovantes
- Gestão de DJs contratados
- Edição de contratos

### DJs
- Visualização de eventos
- Assinatura de contratos
- Compartilhamento com admin
- Acesso ao próprio perfil

## 🗄️ Estrutura do Banco

### Novas Tabelas
- `event_djs`: Relacionamento eventos ↔ DJs
- `contracts`: Contratos automáticos
- `payment_receipts`: Comprovantes de pagamento

### Segurança
- Row Level Security (RLS) implementado
- Políticas baseadas em roles
- Audit trail completo

## 🔗 Links Importantes

- **Repositório GitHub**: https://github.com/sejaunky/portalconexaounk.git
- **Supabase Dashboard**: https://vbfsvbgrpexuzmvzvlpb.supabase.co
- **Documentação Técnica**: `IMPLEMENTATION_SUMMARY.md`

---

## 📞 Suporte

Para dúvidas ou suporte técnico, consulte a documentação em `IMPLEMENTATION_SUMMARY.md` ou entre em contato com a equipe de desenvolvimento.

---

## Project info (Original)

**URL**: https://lovable.dev/projects/a7637651-d6e1-4f85-80d6-ef66c6ed6081

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a7637651-d6e1-4f85-80d6-ef66c6ed6081) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a7637651-d6e1-4f85-80d6-ef66c6ed6081) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
