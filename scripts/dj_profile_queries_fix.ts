// Correções para src/pages/dj-profile/index.tsx

// 1. CORREÇÃO DA QUERY PRINCIPAL DO DJ (linha 359)
// ANTES:
// const { data, error } = await supabase.from("djs").select("*").eq("id", djId).single<DJ>();

// DEPOIS:
// Usar profiles ao invés de djs
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", djId)
  .eq("role", "dj")
  .single<DJ>();

// 2. CORREÇÃO DA QUERY DE EVENTOS (linha 389)
// ANTES:
// const { data: directEvents, error: directError } = await supabase
//   .from("events")
//   .select("*")
//   .eq("dj_id", djId)
//   .order("event_date", { ascending: false });

// DEPOIS:
// Buscar eventos através da tabela event_djs
const { data: eventDjsData, error: eventDjsError } = await supabase
  .from("event_djs")
  .select("event_id")
  .eq("dj_id", djId);

if (eventDjsError) throw eventDjsError;

const eventIds = eventDjsData?.map(item => item.event_id) || [];

const { data: directEvents, error: directError } = await supabase
  .from("events")
  .select("*")
  .in("id", eventIds)
  .order("event_date", { ascending: false });

// 3. CORREÇÃO DA MUTAÇÃO DE UPDATE (linha 438)
// ANTES:
// const { data, error } = await supabase
//   .from("djs")
//   .update(payload)
//   .eq("id", djId)
//   .select()
//   .single<DJ>();

// DEPOIS:
// Usar profiles ao invés de djs
const { data, error } = await supabase
  .from("profiles")
  .update(payload)
  .eq("id", djId)
  .select()
  .single<DJ>();

// 4. FUNÇÃO DE TESTE PARA ADICIONAR NO COMPONENTE
const testDJBConnection = async (djId: string) => {
  console.log('=== TESTE CONEXÃO DJ ===');
  console.log('DJ ID:', djId);
  
  try {
    // Test 1: Verificar se DJ existe
    const { data: dj, error: djError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", djId)
      .eq("role", "dj")
      .single();
    
    console.log('Test 1 - DJ existe:', { dj: !!dj, error: djError?.message });
    
    // Test 2: Verificar eventos
    const { data: eventDjs, error: eventError } = await supabase
      .from("event_djs")
      .select("event_id")
      .eq("dj_id", djId);
    
    console.log('Test 2 - Eventos DJ:', { 
      count: eventDjs?.length || 0, 
      error: eventError?.message 
    });
    
    // Test 3: Verificar mídia
    const { data: media, error: mediaError } = await supabase
      .from("media_files")
      .select("*")
      .eq("dj_id", djId);
    
    console.log('Test 3 - Mídia DJ:', { 
      count: media?.length || 0, 
      error: mediaError?.message 
    });
    
    return { success: true, dj, eventDjs, media };
  } catch (err) {
    console.error('Erro no teste:', err);
    return { success: false, error: err };
  }
};

// 5. INTERFACE ATUALIZADA PARA DJ PROFILE
interface DJ {
  id: string;
  // Campos do profiles
  user_id?: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'dj' | 'admin' | 'producer';
  created_at: string;
  updated_at: string;
  
  // Campos específicos do DJ (opcionais)
  artist_name?: string | null;
  real_name?: string | null;
  email?: string | null;
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
}

// 6. HOOK DE DEBUG PARA ADICIONAR NO COMPONENTE
const useDebugDJConnection = (djId: string) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  useEffect(() => {
    if (djId) {
      testDJBConnection(djId).then(setDebugInfo);
    }
  }, [djId]);
  
  return debugInfo;
};

// 7. IMPLEMENTAÇÃO NO COMPONENTE DJsProfile
// Adicionar no início do componente:
const debugInfo = useDebugDJConnection(djId);

// Adicionar no render (para debug):
{process.env.NODE_ENV === 'development' && debugInfo && (
  <div className="bg-yellow-100 p-4 m-4 rounded">
    <h3>Debug Info:</h3>
    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
  </div>
)}

// 8. TRATAMENTO DE ERRO MELHORADO
if (hasDjError) {
  console.error('Erro ao carregar perfil DJ:', djError);
  
  // Verificar se é erro de permissão
  if (djError?.message?.includes('permission') || djError?.message?.includes('unauthorized')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 p-8">
        <LiquidCard className="max-w-md">
          <CardContent className="py-10 text-center">
            <p className="mb-4 text-muted-foreground">
              Você não tem permissão para visualizar este perfil.
            </p>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </LiquidCard>
      </div>
    );
  }
}