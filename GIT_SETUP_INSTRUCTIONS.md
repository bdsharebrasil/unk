# 🚀 Instruções para Configuração do Git Repository

## ⚠️ Pré-requisito: Instalar Git

Antes de prosseguir, você precisa instalar o Git no seu sistema:

1. **Baixe o Git**: https://git-scm.com/download/win
2. **Instale com as configurações padrão**
3. **Reinicie o terminal/prompt de comando**

## 🎯 Opções para Configurar o Repositório

### Opção 1: Automática (Recomendada)

Após instalar o Git, execute um dos scripts:

```cmd
setup-git.bat
```

ou

```powershell
powershell -ExecutionPolicy Bypass -File setup-git.ps1
```

### Opção 2: Manual

Execute os comandos abaixo um por um:

```bash
# 1. Inicializar repositório Git
git init

# 2. Configurar informações do usuário
git config user.name "UNK Portal"
git config user.email "admin@unkassessoria.com"

# 3. Adicionar todos os arquivos
git add .

# 4. Criar commit inicial
git commit -m "feat: Implementação completa do sistema de eventos, contratos e pagamentos

✨ Funcionalidades implementadas:
- Sistema de criação de eventos com múltiplos DJs
- Geração automática de contratos
- Sistema de assinatura digital
- Upload de comprovantes de pagamento
- Dashboard responsivo redesenhado
- Controle de permissões por role

🔧 Melhorias técnicas:
- Banco de dados reestruturado
- Políticas RLS implementadas
- Componentes React modernos
- Layout responsivo
- Validação de segurança aprimorada"

# 5. Adicionar repositório remoto
git remote add origin https://github.com/sejaunky/portalconexaounk.git

# 6. Configurar branch principal
git branch -M main

# 7. Enviar para GitHub
git push -u origin main
```

## 🔑 Autenticação do GitHub

Se aparecer erro de autenticação, você precisará:

1. **Token de Acesso Pessoal** (recomendado):
   - Vá para GitHub → Settings → Developer Settings → Personal Access Tokens
   - Gere um novo token com permissões de repositório
   - Use o token como senha quando solicitado

2. **Configurar credenciais**:
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

## 🆘 Resolução de Problemas

### Se o repositório remoto já existir:
```bash
git push --force-with-lease origin main
```

### Se houver conflitos:
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### Para verificar status:
```bash
git status
git remote -v
```

## ✅ Verificação Final

Após o setup bem-sucedido, você deve ver:

1. ✅ Repositório local inicializado
2. ✅ Commit inicial criado
3. ✅ Repositório remoto configurado
4. ✅ Código enviado para: https://github.com/sejaunky/portalconexaounk.git

## 📞 Suporte

Se encontrar problemas:

1. Verifique se o Git está instalado: `git --version`
2. Verifique se está no diretório correto
3. Consulte a documentação do Git: https://git-scm.com/doc
4. Verifique as credenciais do GitHub

---

**Repositório Final**: https://github.com/sejaunky/portalconexaounk.git