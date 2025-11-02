Instalar ferramentas e aplicar migrations

1) Tornar scripts executáveis:
   chmod +x /workspaces/unkportal/scripts/*.sh

2) Instalar ferramentas (no container):
   bash /workspaces/unkportal/scripts/install_supabase_cli.sh

3) Aplicar migrations usando psql:
   export DATABASE_URL="postgres://user:pass@host:5432/db"
   bash /workspaces/unkportal/scripts/apply_migrations_with_psql.sh

4) Opcional (usar Supabase CLI):
   supabase login
   supabase link --project-ref <PROJECT_REF>
   supabase db push

Observações:
- Se usar Supabase hosted, prefira service_role para mudanças via CLI e proteja suas chaves.
- Verifique que a extensão pgcrypto esteja habilitada no DB quando usar gen_random_uuid().
