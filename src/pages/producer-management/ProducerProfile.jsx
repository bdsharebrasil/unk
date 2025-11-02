import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { supabase } from '@/integrations/supabase/client';
import { Icon } from '@/components/Icon';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const HERO_BG_1 = 'https://cdn.builder.io/api/v1/image/assets%2F8cf61040483740a0a2ae073a76888180%2Ff230f2b66d1c400981f85490fc4169ec?format=webp&width=1200';
const HERO_BG_2 = 'https://cdn.builder.io/api/v1/image/assets%2F8cf61040483740a0a2ae073a76888180%2F7fdfa126596a4d36ae33a97c4d61283c?format=webp&width=1200';

const ProducerProfile = () => {
  const params = useParams();
  const producerId = params.producerId || params.id;
  const [producer, setProducer] = useState(null);
  const [company, setCompany] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    company_name: '',
    fantasy_name: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    commercial_phone: '',
    contact_phone: '',
    contact_person: '',
    owner_name: '',
    rating: 0,
    admin_notes: '',
    avatar_url: '',
  }));

  useEffect(() => {
    setForm({
      company_name: company?.company_name || '',
      fantasy_name: company?.fantasy_name || producer?.fantasy_name || '',
      cnpj: company?.cnpj || '',
      address: company?.address || '',
      city: company?.city || producer?.city || '',
      state: company?.state || producer?.state || '',
      cep: company?.cep || '',
      commercial_phone: company?.commercial_phone || company?.phone || '',
      contact_phone: company?.contact_phone || '',
      contact_person: company?.contact_person || producer?.full_name || '',
      owner_name: company?.owner_name || '',
      rating: company?.rating ?? 0,
      admin_notes: company?.admin_notes || '',
      avatar_url: company?.avatar_url || producer?.avatar_url || '',
    });
  }, [company, producer]);

  const handleChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    try {
      const payload = {
        profile_id: producer.id,
        company_name: form.company_name,
        fantasy_name: form.fantasy_name,
        cnpj: form.cnpj,
        address: form.address,
        city: form.city,
        state: form.state,
        cep: form.cep,
        commercial_phone: form.commercial_phone,
        contact_phone: form.contact_phone,
        contact_person: form.contact_person,
        owner_name: form.owner_name,
        rating: Number(form.rating) || 0,
        admin_notes: form.admin_notes,
        avatar_url: form.avatar_url,
      };

      if (company && company.id) {
        const { error } = await supabase.from('producers').update(payload).eq('id', company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('producers').insert(payload);
        if (error) throw error;
      }

      // reload company data
      const { data: prodData } = await supabase.from('producers').select('*').eq('profile_id', producer.id).maybeSingle();
      setCompany(prodData || null);
      setIsEditing(false);
      try { toast.success('Perfil salvo com sucesso'); } catch(e) { console.log('toast error', e); }
    } catch (err) {
      console.error('Failed to save producer:', err);
      try { toast.error('Falha ao salvar perfil'); } catch(e) { console.log('toast error', e); }
    }
  };

  const resetFormFromData = () => {
    setForm({
      company_name: company?.company_name || '',
      fantasy_name: company?.fantasy_name || producer?.fantasy_name || '',
      cnpj: company?.cnpj || '',
      address: company?.address || '',
      city: company?.city || producer?.city || '',
      state: company?.state || producer?.state || '',
      cep: company?.cep || '',
      commercial_phone: company?.commercial_phone || company?.phone || '',
      contact_phone: company?.contact_phone || '',
      contact_person: company?.contact_person || producer?.full_name || '',
      owner_name: company?.owner_name || '',
      rating: company?.rating ?? 0,
      admin_notes: company?.admin_notes || '',
      avatar_url: company?.avatar_url || producer?.avatar_url || '',
    });
  };

  const handleCancel = () => {
    resetFormFromData();
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${producer.id}.${fileExt}`;
      const filePath = `producers/${producer.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('producer-avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('producer-avatars').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || '';

      setForm((s) => ({ ...s, avatar_url: publicUrl }));

      if (company && company.id) setCompany({ ...company, avatar_url: publicUrl });
      else setProducer({ ...producer, avatar_url: publicUrl });

      try { toast.success('Foto atualizada'); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      try { toast.error('Falha ao enviar imagem'); } catch (e) { /* ignore */ }
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', producerId).maybeSingle();
        if (error) throw error;
        if (!mounted) return;
        setProducer(data || null);

        const { data: prodData } = await supabase.from('producers').select('*').eq('profile_id', producerId).maybeSingle();
        if (!mounted) return;
        setCompany(prodData || null);

        // fetch events for producer
        const { data: evData } = await supabase
          .from('events')
          .select('id, event_name, event_date, city, venue, fee, payment_status')
          .eq('producer_id', producerId)
          .order('event_date', { ascending: false });
        if (!mounted) return;
        setEvents(evData || []);
      } catch (err) {
        console.error('Error loading producer profile:', err);
        setProducer(null);
        setCompany(null);
        setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (producerId) load();
    return () => { mounted = false; };
  }, [producerId]);

  if (loading) return <div className="p-6">Carregando perfil...</div>;
  if (!producer) return <div className="p-6">Produtor não encontrado.</div>;

  const displayName = producer.fantasy_name || producer.full_name || 'Produtor';
  const avatar = producer.avatar_url || company?.avatar_url || '';
  const companyName = company?.company_name || '';

  return (
    <div className="p-6">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl overflow-hidden mb-6"
        style={{ minHeight: 160 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-slate-900/40 to-purple-900/60" />
        <img src={HERO_BG_1} alt="hero" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 backdrop-blur-lg bg-white/5 mix-blend-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex items-center gap-6">
            <div className="relative w-36 h-36">
            <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white/20 shadow-lg flex items-center justify-center bg-gradient-to-br from-white/5 to-white/2">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="text-3xl font-bold text-white/90">{displayName.slice(0,1)}</div>
              )}
            </div>

            <label className="absolute bottom-0 right-0 bg-white/10 p-2 rounded-full cursor-pointer hover:bg-white/20">
              <Icon name="Upload" size={16} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 text-white">
            <h1 className="text-3xl font-bold drop-shadow">{displayName}</h1>
            <div className="mt-1 text-sm opacity-90">{companyName}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-white/6 text-sm">Eventos: {events.length}</div>
              <div className="px-3 py-1 rounded-full bg-white/6 text-sm">Avaliação: ★★★★☆</div>
            </div>
          </div>

          <div className="text-right">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="px-4 py-2 rounded bg-green-500 text-white">Salvar</button>
                <button onClick={handleCancel} className="px-4 py-2 rounded bg-gray-600 text-white">Cancelar</button>
                <Link href="/producer-management" className="text-sm text-white/60 ml-3">Voltar</Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded bg-gradient-to-r from-primary to-accent text-white">Editar Perfil</button>
                <Link href="/producer-management" className="text-sm text-white/80">Voltar</Link>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.aside
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1"
        >
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-white/10">
                {avatar ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" /> : <div className="text-xl">{displayName.slice(0,1)}</div>}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">{displayName}</div>
                    <div className="text-sm text-muted-foreground">{companyName}</div>
                    <div className="mt-3 text-sm text-muted-foreground">{producer.city}{producer.city && producer.state ? ', ' : ''}{producer.state || ''}</div>
                  </div>
                  <div className="ml-4">
                    <button onClick={() => setIsEditing((s) => !s)} className="text-sm px-3 py-1 rounded bg-white/6">{isEditing ? 'Cancelar' : 'Editar'}</button>
                  </div>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                <label className="block text-xs">Nome Fantasia</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.fantasy_name} onChange={(e) => handleChange('fantasy_name', e.target.value)} />
                <label className="block text-xs">Razão Social</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
                <label className="block text-xs">CNPJ</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.cnpj} onChange={(e) => handleChange('cnpj', e.target.value)} />
                <label className="block text-xs">Endereço</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs">Cidade</label>
                    <input className="w-full p-2 rounded bg-white/5" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs">UF</label>
                    <input className="w-full p-2 rounded bg-white/5" value={form.state} onChange={(e) => handleChange('state', e.target.value)} />
                  </div>
                </div>
                <label className="block text-xs">CEP</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.cep} onChange={(e) => handleChange('cep', e.target.value)} />

                <label className="block text-xs">Telefone Comercial</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.commercial_phone} onChange={(e) => handleChange('commercial_phone', e.target.value)} />
                <label className="block text-xs">Telefone de Contato</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.contact_phone} onChange={(e) => handleChange('contact_phone', e.target.value)} />
                <label className="block text-xs">Pessoa de Contato</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.contact_person} onChange={(e) => handleChange('contact_person', e.target.value)} />
                <label className="block text-xs">Nome do Proprietário</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.owner_name} onChange={(e) => handleChange('owner_name', e.target.value)} />
                <label className="block text-xs">Rating (0-5)</label>
                <input type="number" min="0" max="5" className="w-full p-2 rounded bg-white/5" value={form.rating} onChange={(e) => handleChange('rating', e.target.value)} />
                <label className="block text-xs">Avatar URL</label>
                <input className="w-full p-2 rounded bg-white/5" value={form.avatar_url} onChange={(e) => handleChange('avatar_url', e.target.value)} />
                <label className="block text-xs">Notas Admin</label>
                <textarea className="w-full p-2 rounded bg-white/5" value={form.admin_notes} onChange={(e) => handleChange('admin_notes', e.target.value)} />

                <div className="flex gap-2 mt-3">
                  <button onClick={handleSave} className="px-4 py-2 rounded bg-green-500 text-white">Salvar</button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded bg-gray-600 text-white">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                {producer.contact_person && <div><div className="text-xs text-muted-foreground">Nome de Contato</div><div className="text-sm">{producer.contact_person}</div></div>}
                {producer.email && <div className="flex items-center gap-2"><Icon name="Mail" size={16} />{producer.email}</div>}
                {producer.phone && <div className="flex items-center gap-2"><Icon name="Phone" size={16} />{producer.phone}</div>}
                {company?.company_name && <div className="mt-4"><div className="text-xs text-muted-foreground">Empresa</div><div className="text-sm">{company.company_name}</div></div>}
              </div>
            )}
          </div>

          <div className="mt-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-2">Sobre a Empresa</div>
            <div className="text-sm text-muted-foreground">{company?.description || producer.about || 'Sem descrição disponível.'}</div>
          </div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events && events.length > 0 ? (
              events.map((ev) => (
                <motion.article key={ev.id} whileHover={{ scale: 1.01 }} className="bg-white/4 backdrop-blur-md border border-white/6 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{new Date(ev.event_date).toLocaleDateString()}</div>
                      <div className="text-lg font-semibold text-foreground">{ev.event_name}</div>
                      <div className="text-sm text-muted-foreground">{ev.venue} • {ev.city}</div>
                    </div>
                    <div className="text-sm font-medium text-foreground">R$ {ev.fee ?? '—'}</div>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="col-span-2 p-6 bg-white/4 backdrop-blur-md border border-white/6 rounded-xl">Nenhum evento encontrado.</div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/4 backdrop-blur-md border border-white/6">
              <h4 className="text-sm text-muted-foreground">Eventos em destaque</h4>
              <div className="mt-3">Placeholder para eventos em destaque</div>
            </div>
            <div className="p-4 rounded-xl bg-white/4 backdrop-blur-md border border-white/6">
              <h4 className="text-sm text-muted-foreground">Equipe / Contatos</h4>
              <div className="mt-3">Informações de contato e equipe aqui</div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ProducerProfile;
