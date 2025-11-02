import { supabase } from '@/lib/supabase';
import { formatError } from '../lib/errorUtils';

export const paymentService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          event:events (
            *,
            producer:producers!events_producer_id_fkey (*),
            event_djs (
              *,
              dj:djs (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // If PostgREST relationship metadata is missing, assemble manually
      try {
        const { data: payments, error: e2 } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (e2) throw e2;
        if (!payments || payments.length === 0) return [];

        const eventIds = Array.from(new Set(payments.map(p => p.event_id).filter(Boolean)));

        const { data: events } = eventIds.length ? await supabase.from('events').select('*').in('id', eventIds) : { data: [] };

        const producerIds = Array.from(new Set([...(events || []).map(ev => ev.producer_id).filter(Boolean)]));

        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds) : { data: [] };
        const producerProfileIds = (producers || []).map(p => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : { data: [] };

        const { data: eventDjs } = eventIds.length ? await supabase.from('event_djs').select('*').in('event_id', eventIds) : { data: [] };
        const djIds = Array.from(new Set((eventDjs || []).map(ed => ed.dj_id).filter(Boolean)));
        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };

        const eventsMap = (events || []).reduce((acc, ev) => {
          const producerRaw = (producers || []).find(p => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find(pr => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter(ed => ed.event_id === ev.id).map(ed => ({ ...ed, dj: (djs || []).find(d => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, producer, event_djs: eds };
          return acc;
        }, {});

        const enriched = (payments || []).map(p => ({ ...p, event: p.event_id ? eventsMap[p.event_id] || null : null }));
        return enriched;
      } catch (inner) {
        const msg = formatError(inner);
        const lower = (msg || '').toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('typeerror')) {
          console.warn('Supabase network error detected while fetching payments; returning empty list.');
        } else {
          console.error('Error fetching payments (fallback):', msg);
        }
        return [];
      }
    }
  },

  async getByDJ(djId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          event:events!inner (
            *,
            producer:producers!events_producer_id_fkey (*),
            event_djs!inner (
              *,
              dj:djs (*)
            )
          )
        `)
        .eq('event.event_djs.dj_id', djId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      try {
        // Fallback: find events via event_djs relation
        const { data: linkedEventDjs } = await supabase.from('event_djs').select('event_id').eq('dj_id', djId);
        const eventIds = Array.from(new Set((linkedEventDjs || []).map(ed => ed.event_id)));
        if (eventIds.length === 0) return [];
        const { data: payments } = await supabase.from('payments').select('*').in('event_id', eventIds).order('created_at', { ascending: false });

        // reuse getAll fallback logic to enrich
        const eventIdsAll = Array.from(new Set(payments.map(p => p.event_id).filter(Boolean)));
        const { data: events } = eventIdsAll.length ? await supabase.from('events').select('*').in('id', eventIdsAll) : { data: [] };
        const producerIds = Array.from(new Set((events || []).map(ev => ev.producer_id).filter(Boolean)));
        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds) : { data: [] };
        const producerProfileIds = (producers || []).map(p => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : { data: [] };
        const { data: eventDjs } = eventIdsAll.length ? await supabase.from('event_djs').select('*').in('event_id', eventIdsAll) : { data: [] };
        const djIds = Array.from(new Set((eventDjs || []).map(ed => ed.dj_id).filter(Boolean)));
        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };

        const eventsMap = (events || []).reduce((acc, ev) => {
          const producerRaw = (producers || []).find(p => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find(pr => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter(ed => ed.event_id === ev.id).map(ed => ({ ...ed, dj: (djs || []).find(d => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, producer, event_djs: eds };
          return acc;
        }, {});

        const enriched = (payments || []).map(p => ({ ...p, event: p.event_id ? eventsMap[p.event_id] || null : null }));
        return enriched;
      } catch (inner) {
        const msg = formatError(inner);
        const lower = (msg || '').toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('typeerror')) {
          console.warn('Supabase network error detected while fetching DJ payments; returning empty list.');
        } else {
          console.error('Error fetching DJ payments (fallback):', msg);
        }
        return [];
      }
    }
  },

  async getByProducer(producerId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          event:events!inner (
            *,
            dj:djs!events_dj_id_fkey (*),
            producer:producers!events_producer_id_fkey (*),
            event_djs (
              *,
              dj:djs (*)
            )
          )
        `)
        .eq('event.producer_id', producerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      try {
        const { data: events } = await supabase.from('events').select('id').eq('producer_id', producerId);
        const eventIds = (events || []).map(e => e.id).filter(Boolean);
        if (eventIds.length === 0) return [];
        const { data: payments } = await supabase.from('payments').select('*').in('event_id', eventIds).order('created_at', { ascending: false });

        // enrich similar to getAll fallback
        const eventIdsAll = Array.from(new Set(payments.map(p => p.event_id).filter(Boolean)));
        const { data: eventsFull } = eventIdsAll.length ? await supabase.from('events').select('*').in('id', eventIdsAll) : { data: [] };
        const producerIds = Array.from(new Set((eventsFull || []).map(ev => ev.producer_id).filter(Boolean)));
        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds) : { data: [] };
        const producerProfileIds = (producers || []).map(p => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : { data: [] };
        const { data: eventDjs } = eventIdsAll.length ? await supabase.from('event_djs').select('*').in('event_id', eventIdsAll) : { data: [] };
        const djIds = Array.from(new Set((eventDjs || []).map(ed => ed.dj_id).filter(Boolean)));
        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };

        const eventsMap = (eventsFull || []).reduce((acc, ev) => {
          const producerRaw = (producers || []).find(p => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find(pr => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter(ed => ed.event_id === ev.id).map(ed => ({ ...ed, dj: (djs || []).find(d => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, producer, event_djs: eds };
          return acc;
        }, {});

        const enriched = (payments || []).map(p => ({ ...p, event: p.event_id ? eventsMap[p.event_id] || null : null }));
        return enriched;
      } catch (inner) {
        const msg = formatError(inner);
        const lower = (msg || '').toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('typeerror')) {
          console.warn('Supabase network error detected while fetching producer payments; returning empty list.');
        } else {
          console.error('Error fetching producer payments (fallback):', msg);
        }
        return [];
      }
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating payment:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async confirmPayment(id, data) {
    return this.update(id, {
      status: 'pago',
      paid_at: data.paid_at || new Date().toISOString(),
      payment_method: data.payment_method,
      payment_proof_url: data.proofUrl || data.payment_proof_url
    });
  },

  async delete(id) {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting payment:', formatError(error));
      return { error: (error && (error as any).message) || String(error) };
    }
  }
};

export default paymentService;
