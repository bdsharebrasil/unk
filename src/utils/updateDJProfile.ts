import { supabase } from '@/integrations/supabase/client';

export async function updateSuzyPradoProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      artist_name: 'Dj Suzy Prado',
      full_name: 'Suzy Silva Sousa',
      real_name: 'Suzy Silva Sousa',
      avatar_url: 'https://fxkhkcvnmvqqjzgsdoec.supabase.co/storage/v1/object/public/dj-media/dj-suzy-prado/profile/1759767516391.jpg',
      whatsapp: '62 99569-2959',
      email: 'suzy@conexaounk.com',
      soundcloud_url: 'https://soundcloud.com/djsuzypradooficial',
      youtube_url: 'https://www.youtube.com/channel/UCF2NirPqdG62uPRnjQKYLYQ',
      tiktok_url: 'https://www.tiktok.com/@suzyprado?lang=en',
      location: 'Guarulhos',
      cpf: '015.082.941-86',
      birth_date: '1985-05-11',
      status: 'ativo',
      role: 'dj'
    })
    .eq('id', 'fc85bc90-ff0f-4420-8535-449a86992f4d');

  if (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error };
  }

  console.log('Perfil atualizado com sucesso!', data);
  return { success: true, data };
}
