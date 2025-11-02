import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser(token);

    if (!adminUser) {
      throw new Error('Usuário não autenticado');
    }

    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('role, is_admin')
      .eq('id', adminUser.id)
      .single();

    if (!adminProfile?.is_admin) {
      throw new Error('Apenas administradores podem deletar usuários');
    }

    const { userId } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userId inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Basic UUID v4-ish validation to avoid Supabase admin call with malformed ids
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ error: 'userId must be a UUID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { error } = await supabaseClient.auth.admin.deleteUser(userId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
