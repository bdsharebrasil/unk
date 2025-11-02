// Correção para src/lib/supabase.ts
// Substituir o conteúdo atual por este

import { supabase as supabaseClient } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://vbfsvbgrpexuzmvzvlpb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZnN2YmdycGV4dXptdnp2bHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTMzMTcsImV4cCI6MjA3MTgyOTMxN30.jQb2Yfq_IaOuFo1oaDISsl6-RxVtKKNct-eTuggWHRw";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
export const supabase = supabaseClient;
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };

// Adicionar verificação de conexão
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

// Debug helper
export const debugSupabaseConfig = () => {
  console.log('=== DEBUG SUPABASE CONFIG ===');
  console.log('URL:', SUPABASE_URL);
  console.log('Key (primeiros 20 chars):', SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...');
  console.log('Configured:', isSupabaseConfigured);
  console.log('Client type:', typeof supabase);
  console.log('================================');
};