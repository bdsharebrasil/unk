# Correções Práticas - Portal de Conexão Sejaunky

## 🚨 CORREÇÃO 1: Configuração do Supabase

### Arquivo: `src/lib/supabase.ts`

**Problema:** URL desatualizada
```typescript
// ANTES (incorreto)
const SUPABASE_URL = "https://fxkhkcvnmvqqjzgsdoec.supabase.co";
```

**Correção:**
```typescript
// DEPOIS (correto)
const SUPABASE_URL = "https://vbfsvbgrpexuzmvzvlpb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZnN2YmdycGV4dXptdnp2bHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTMzMTcsImV4cCI6MjA3MTgyOTMxN30.jQb2Yfq_IaOuFo1oaDISsl6-RxVtKKNct-eTuggWHRw";
```

---

## 🚨 CORREÇÃO 2: Query do Perfil do DJ

### Arquivo: `src/pages/dj-profile/index.tsx`

**Problema:** Query na tabela errada (linha 359)
```typescript
// ANTES (incorreto)
const { data, error } = await supabase.from("djs").select("*").eq("id", djId).single<DJ>();
```

**Correção 1: Atualizar para usar profiles**
```typescript
// DEPOIS (correto)
const { data, error } = await supabase.from("profiles").select("*").eq("id", djId).single<DJ>();
```

**Correção 2: Criar interface atualizada**
```typescript
interface DJProfile {
  id: string;
  artist_name?: string | null;
  real_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  portifolio_url?: string | null;
  birth_date?: string | null;
  location?: string | null;
  pix_key?: string | null;
  base_price?: number | null;
  genre?: string | null;
  bio?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  soundcloud_url?: string | null;
  soundcloud?: string | null;
  avatar_url?: string | null;
  backdrop_url?: string | null;
  background_image_url?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  role: string; // Adicionar role
}
```

---

## 🚨 CORREÇÃO 3: Query dos Eventos do DJ

### Arquivo: `src/pages/dj-profile/index.tsx`

**Problema:** Query antiga (linhas 389-434)
```typescript
// ANTES (incorreto)
const { data: directEvents, error: directError } = await supabase
  .from("events")
  .select("*")
  .eq("dj_id", djId)
  .order("event_date", { ascending: false });
```

**Correção:** Atualizar para usar event_djs
```typescript
// DEPOIS (correto)
const { data: directEvents, error: directError } = await supabase
  .from("events")
  .select("*")
  .in("id", 
    (await supabase.from("event_djs").select("event_id").eq("dj_id", djId)).data?.map(item => item.event_id) || []
  )
  .order("event_date", { ascending: false });
```

---

## 🚨 CORREÇÃO 4: Políticas RLS para DJs

### Arquivo: `supabase/migrations/add_dj_rls_policies.sql`

**Criação de arquivo de migração:**
```sql
-- Adicionar políticas RLS para DJs acessarem seus próprios dados

-- Permitir DJs visualizarem seus próprios perfis
CREATE POLICY "DJs can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Permitir DJs atualizarem seus próprios perfis
CREATE POLICY "DJs can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir DJs criarem eventos próprios
CREATE POLICY "DJs can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'dj'
  )
);

-- Permitir DJs visualizarem eventos próprios
CREATE POLICY "DJs can view own events" ON public.events
FOR SELECT TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.event_djs 
    WHERE event_djs.event_id = events.id 
    AND event_djs.dj_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permitir DJs atualizarem eventos próprios
CREATE POLICY "DJs can update own events" ON public.events
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permitir DJs excluírem eventos próprios
CREATE POLICY "DJs can delete own events" ON public.events
FOR DELETE TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permitir DJs visualizarem contratos próprios
CREATE POLICY "DJs can view own contracts" ON public.contracts
FOR SELECT TO authenticated
USING (dj_id = auth.uid());

-- Permitir DJs assinarem contratos próprios
CREATE POLICY "DJs can sign own contracts" ON public.contracts
FOR UPDATE TO authenticated
USING (dj_id = auth.uid())
WITH CHECK (dj_id = auth.uid());

-- Permitir DJs visualizarem pagamentos próprios
CREATE POLICY "DJs can view own payments" ON public.payments
FOR SELECT TO authenticated
USING (dj_id = auth.uid());

-- Permitir DJs visualizarem mídia própria
CREATE POLICY "DJs can view own media" ON public.media_files
FOR SELECT TO authenticated
USING (dj_id = auth.uid());

-- Permitir DJs gerenciarem mídia própria
CREATE POLICY "DJs can manage own media" ON public.media_files
FOR ALL TO authenticated
USING (dj_id = auth.uid())
WITH CHECK (dj_id = auth.uid());
```

---

## 🚨 CORREÇÃO 5: Atualização do Service de Eventos

### Arquivo: `src/services/supabaseService.ts`

**Problema:** Função de exclusão pode falhar por RLS
```typescript
// ANTES (pode falhar)
async delete(id: string) {
  // ...
  const { error: deleteRelationsError } = await supabase.from('event_djs').delete().eq('event_id', id);
  // ...
}
```

**Correção:** Adicionar tratamento de erro melhorado
```typescript
// DEPOIS (melhorado)
async delete(id: string) {
  try {
    if (!isSupabaseConfigured) {
      return { error: 'supabase_not_configured' };
    }

    if (!id) {
      return { error: 'event_id_required' };
    }

    // Primeiro, verificar se o usuário tem permissão para excluir
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Verificar se é o criador do evento ou admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();

    const canDelete = event?.created_by === userId || profile?.role === 'admin';
    
    if (!canDelete) {
      return { error: 'unauthorized' };
    }

    // Excluir relações primeiro
    const { error: deleteRelationsError } = await supabase.from('event_djs').delete().eq('event_id', id);
    if (deleteRelationsError) {
      console.warn('Error deleting event_djs relations:', deleteRelationsError);
    }

    // Excluir evento
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      throw error;
    }

    return { error: null, success: true };
  } catch (error) {
    console.error('Error deleting event:', formatError(error));
    return { error: (error as any)?.message ?? String(error) };
  }
}
```

---

## 🚨 CORREÇÃO 6: Service de Upload de Mídia

### Arquivo: `src/services/mediaService.ts`

**Verificar bucket correto:**
```typescript
// Verificar se o bucket 'dj-media' existe ou criar
const DJ_PROFILE_BUCKET = "dj-media";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const mediaService = {
  async uploadMedia(djId: string, file: File, category: string) {
    try {
      const fileName = `${djId}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(DJ_PROFILE_BUCKET)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(DJ_PROFILE_BUCKET)
        .getPublicUrl(fileName);

      // Salvar referência no banco
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          dj_id: djId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_category: category,
          file_size: file.size
        });

      if (dbError) throw dbError;

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { error: error.message };
    }
  }
};
```

---

## 🚨 CORREÇÃO 7: Validação de Dados no Frontend

### Arquivo: `src/pages/dj-profile/index.tsx`

**Adicionar validação de resposta:**
```typescript
const {
  data: dj,
  isPending: isDjLoading,
  isError: hasDjError,
  error: djError,
} = useQuery<DJ | null, Error>({
  queryKey: ["dj", djId],
  enabled: Boolean(djId),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", djId)
      .eq("role", "dj") // Garantir que é um DJ
      .single<DJ>();
    
    if (error) {
      console.error('Erro ao carregar DJ:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('DJ não encontrado');
    }
    
    return data;
  },
  retry: (failureCount, error) => {
    // Não retry em erros de autorização
    if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      return false;
    }
    return failureCount < 3;
  }
});
```

---

## Aplicação das Correções

### Ordem de Execução:

1. **Executar migração RLS**: `supabase/migrations/add_dj_rls_policies.sql`
2. **Corrigir configurações Supabase**: `src/lib/supabase.ts`
3. **Atualizar queries DJ**: `src/pages/dj-profile/index.tsx`
4. **Testar conexão**: Verificar se perfil carrega
5. **Testar eventos**: Verificar criação/exclusão

### Comandos de Aplicação:

```bash
# 1. Aplicar migração
supabase db push

# 2. Reiniciar aplicação
npm run dev

# 3. Verificar logs do navegador (F12)
```

### Verificações Pós-Correção:

✅ **Perfil DJ carrega**: Não deve mais mostrar "DJ não encontrado"
✅ **Criar evento**: Deve funcionar para DJs e admins
✅ **Excluir evento**: Deve funcionar para criadores do evento
✅ **Upload mídia**: Deve funcionar sem erros de bucket

---

## Script de Verificação

```javascript
// Executar no console do navegador para testar
async function testConnection() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, artist_name')
    .eq('role', 'dj')
    .limit(1);
    
  console.log('Teste de conexão:', { data, error });
  return { data, error };
}

testConnection();
```