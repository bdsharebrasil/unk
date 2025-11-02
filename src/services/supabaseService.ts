import { formatError } from '../lib/errorUtils';
import { paymentService } from './paymentService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type EventPayload = Record<string, any>;
type FeeMap = Record<string, unknown>;
type ProducerRecord = Record<string, any>;

const createBaseEventColumnSet = (): Set<string> =>
  new Set([
    'event_name',
    'event_date',
    'producer_id',
    'status',
    'description',
    'venue',
    'location',
    'city',
    'state',
    'address',
    'cache_value',
    'commission_rate',
    'commission_amount',
    'expected_attendees',
    'start_time',
    'end_time',
    'special_requirements',
    'payment_status',
    'payment_proof',
    'shared_with_manager',
    'equipment_provided',
  ]);

let cachedEventColumns: Set<string> | null = null;

const getEventColumnSet = async (): Promise<Set<string>> => {
  if (cachedEventColumns) {
    return new Set(cachedEventColumns);
  }

  const baseColumns = createBaseEventColumnSet();

  if (!isSupabaseConfigured) {
    cachedEventColumns = baseColumns;
    return new Set(baseColumns);
  }

  try {
    const { data, error } = await supabase.from('events').select('*').limit(1).maybeSingle();
    if (!error && data && typeof data === 'object') {
      Object.keys(data).forEach((key) => baseColumns.add(key));
    }
  } catch (err) {
    console.warn('Unable to inspect event columns:', formatError(err));
  }

  cachedEventColumns = baseColumns;
  return new Set(baseColumns);
};

const updateEventColumnCache = (columns: Set<string>) => {
  cachedEventColumns = new Set(columns);
};

const sanitizeEventRecord = (raw: EventPayload, allowedColumns: Set<string>): EventPayload => {
  const sanitized: EventPayload = {};
  allowedColumns.forEach((column) => {
    if (raw[column] !== undefined) {
      sanitized[column] = raw[column];
    }
  });
  return sanitized;
};

const prepareSanitizedEventRecord = (raw: EventPayload, allowedColumns: Set<string>): EventPayload => {
  const sanitized = sanitizeEventRecord(raw, allowedColumns);
  return sanitized;
};

const extractUndefinedColumn = (error: any): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  const combined = `${message} ${details}`;

  const patterns = [
    /column\s+"?([\w]+)"?\s+of\s+relation/i,
    /relation\s+"?[\w]+"?\.\s*column\s+"?([\w]+)"/i,
    /"([\w]+)"\s+does not exist/i,
    /could not find the '([\w]+)' column/i,
    /could not find column "?([\w]+)"?/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return typeof (error as { column?: string }).column === 'string' ? (error as { column?: string }).column! : null;
};

const parseNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundCurrencyValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const normalizeTimestamp = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return trimmed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const pickFirstString = (...candidates: unknown[]): string | null => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
};

const normalizeDjIds = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  input.forEach((candidate) => {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(trimmed);
      }
    }
  });
  return result;
};

const mergeDjIds = (primaryDjId: string | null | undefined, djIds: string[]): string[] => {
  const normalized = normalizeDjIds(djIds);
  if (primaryDjId && typeof primaryDjId === 'string') {
    const trimmed = primaryDjId.trim();
    if (trimmed) {
      const rest = normalized.filter((id) => id !== trimmed);
      return [trimmed, ...rest];
    }
  }
  return normalized;
};

const buildEventRecord = (payload: EventPayload, primaryDjId: string | null): EventPayload => {
  const eventName = pickFirstString(payload.event_name, payload.title, payload.name);
  if (!eventName) {
    throw new Error('Event name is required.');
  }

  const eventDate = pickFirstString(payload.event_date, payload.date);
  if (!eventDate) {
    throw new Error('Event date is required.');
  }

  const cacheValue = parseNumericValue(payload.cache_value ?? payload.cache) ?? 0;
  const cache = cacheValue >= 0 ? roundCurrencyValue(cacheValue) : 0;

  const commissionRate = parseNumericValue(payload.commission_rate ?? payload.commission_percentage);
  const commissionAmount = parseNumericValue(payload.commission_amount);
  const expectedAttendees = parseNumericValue(payload.expected_attendees ?? payload.expectedAttendance ?? payload.expected_attendance);

  const description = pickFirstString(payload.description);
  const requirements = pickFirstString(payload.special_requirements, payload.requirements);
  const venueValue = pickFirstString(payload.venue, payload.location);
  const locationValue = pickFirstString(payload.location);
  const cityValue = pickFirstString(payload.city);
  const stateValue = pickFirstString(payload.state);
  const addressValue = pickFirstString(payload.address);
  const producerId = pickFirstString(payload.producer_id, payload.producerId);

  const eventRecord: EventPayload = {
    event_name: eventName,
    event_date: eventDate,
    cache_value: cache,
  };

  if (producerId) {
    eventRecord.producer_id = producerId;
  }
  if (payload.status !== undefined) {
    eventRecord.status = payload.status;
  }
  if (description) {
    eventRecord.description = description;
  }
  if (venueValue) {
    eventRecord.venue = venueValue;
  }
  if (locationValue) {
    eventRecord.location = locationValue;
  }
  if (cityValue) {
    eventRecord.city = cityValue;
  }
  if (stateValue) {
    eventRecord.state = stateValue;
  }
  if (addressValue) {
    eventRecord.address = addressValue;
  }
  if (payload.start_time !== undefined && payload.start_time !== null) {
    eventRecord.start_time = payload.start_time;
  }
  if (payload.end_time !== undefined && payload.end_time !== null) {
    eventRecord.end_time = payload.end_time;
  }
  if (expectedAttendees !== null) {
    eventRecord.expected_attendees = expectedAttendees;
  }
  if (commissionRate !== null) {
    eventRecord.commission_rate = roundCurrencyValue(commissionRate);
  }
  if (commissionAmount !== null) {
    eventRecord.commission_amount = roundCurrencyValue(commissionAmount);
  }
  if (requirements) {
    eventRecord.special_requirements = requirements;
  }
  if (payload.payment_status !== undefined) {
    eventRecord.payment_status = payload.payment_status;
  }
  if (payload.payment_proof !== undefined) {
    eventRecord.payment_proof = payload.payment_proof;
  }
  if (payload.shared_with_manager !== undefined) {
    eventRecord.shared_with_manager = Boolean(payload.shared_with_manager);
  }
  if (payload.equipment_provided !== undefined) {
    eventRecord.equipment_provided = payload.equipment_provided;
  }

  return eventRecord;
};

const syncEventDjRelations = async (eventId: string, djIds: string[], feeMapInput: FeeMap) => {
  const normalizedDjIds = normalizeDjIds(djIds);
  const feeMap = isPlainRecord(feeMapInput) ? feeMapInput : {};

  const { error: deleteError } = await supabase.from('event_djs').delete().eq('event_id', eventId);
  if (deleteError) {
    throw deleteError;
  }

  if (normalizedDjIds.length === 0) {
    return;
  }

  const rows = normalizedDjIds.map((djId) => {
    const feeValue = parseNumericValue((feeMap as Record<string, unknown>)[djId]);
    return {
      event_id: eventId,
      dj_id: djId,
      fee: feeValue != null && feeValue >= 0 ? roundCurrencyValue(feeValue) : null,
    };
  });

  const { error: insertError } = await supabase.from('event_djs').insert(rows);
  if (insertError) {
    throw insertError;
  }
};

const ensurePendingPaymentForEvent = async (
  eventRecord: Record<string, any>,
  fallbackRecord: EventPayload,
) => {
  const rawEventId = eventRecord?.id ?? fallbackRecord?.id ?? null;
  if (!rawEventId) {
    return;
  }
  const eventId = String(rawEventId);

  const amountSource =
    eventRecord?.cache_value ??
    fallbackRecord?.cache_value ??
    0;

  const parsedAmount = parseNumericValue(amountSource);
  const amount =
    parsedAmount != null && parsedAmount >= 0 ? roundCurrencyValue(parsedAmount) : 0;

  const rawProducerId = eventRecord?.producer_id ?? fallbackRecord?.producer_id ?? null;
  const producerId = rawProducerId ? String(rawProducerId) : null;

  const dueDate =
    normalizeTimestamp(
      eventRecord?.due_date ??
      eventRecord?.event_date ??
      fallbackRecord?.due_date ??
      fallbackRecord?.event_date,
    ) ?? null;

  const existingResponse = await supabase
    .from('payments')
    .select('id, status')
    .eq('event_id', eventId)
    .limit(1)
    .maybeSingle();

  if (existingResponse.error) {
    throw existingResponse.error;
  }

  if (existingResponse.data) {
    const updates: Record<string, any> = {
      amount,
      producer_id: producerId ?? null,
      due_date: dueDate,
    };

    if (!existingResponse.data.status || existingResponse.data.status === 'pendente') {
      updates.status = 'pendente';
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', existingResponse.data.id);
    if (updateError) {
      throw updateError;
    }
    return;
  }

  const insertPayload = {
    event_id: eventId,
    amount,
    status: 'pendente' as const,
    producer_id: producerId ?? null,
    due_date: dueDate,
  };

  const { error: insertPaymentError } = await supabase.from('payments').insert(insertPayload);
  if (insertPaymentError) {
    throw insertPaymentError;
  }
};

const syncDjProducerRelationStats = async (
  eventRecord: Record<string, any>,
  fallbackRecord: EventPayload,
  djIds: string[],
  feeMapInput: FeeMap,
) => {
  const normalizedDjIds = normalizeDjIds(djIds);
  if (normalizedDjIds.length === 0) {
    return;
  }

  const rawProducerId = eventRecord?.producer_id ?? fallbackRecord?.producer_id ?? null;
  if (!rawProducerId) {
    return;
  }
  const producerId = String(rawProducerId);

  const eventDate =
    normalizeTimestamp(eventRecord?.event_date ?? fallbackRecord?.event_date) ?? null;

  const totalAmountSource =
    eventRecord?.cache_value ??
    fallbackRecord?.cache_value ??
    0;
  const parsedTotalAmount = parseNumericValue(totalAmountSource);
  const totalAmount =
    parsedTotalAmount != null && parsedTotalAmount >= 0
      ? roundCurrencyValue(parsedTotalAmount)
      : 0;

  const feeMap = isPlainRecord(feeMapInput) ? (feeMapInput as Record<string, unknown>) : {};
  const allocationMap = new Map<string, number>();

  normalizedDjIds.forEach((djId) => {
    const feeValue = parseNumericValue(feeMap[djId]);
    let amount =
      feeValue != null && feeValue >= 0 ? roundCurrencyValue(feeValue) : null;

    if (amount == null && totalAmount > 0 && normalizedDjIds.length > 0) {
      amount = roundCurrencyValue(totalAmount / normalizedDjIds.length);
    }

    allocationMap.set(djId, amount ?? 0);
  });

  for (const djId of normalizedDjIds) {
    const allocation = allocationMap.get(djId) ?? 0;
    const allocationValue = allocation >= 0 ? roundCurrencyValue(allocation) : 0;

    const existingResponse = await supabase
      .from('dj_producer_relations')
      .select('id, total_events, total_revenue, last_event_date')
      .eq('dj_id', djId)
      .eq('producer_id', producerId)
      .limit(1)
      .maybeSingle();

    if (existingResponse.error) {
      throw existingResponse.error;
    }

    const candidateLastDate = eventDate;
    let resolvedLastDate = normalizeTimestamp(existingResponse.data?.last_event_date) ?? null;
    if (candidateLastDate) {
      const newDate = new Date(candidateLastDate);
      if (!Number.isNaN(newDate.getTime())) {
        if (!resolvedLastDate) {
          resolvedLastDate = newDate.toISOString();
        } else {
          const existingDate = new Date(resolvedLastDate);
          if (
            Number.isNaN(existingDate.getTime()) ||
            newDate.getTime() >= existingDate.getTime()
          ) {
            resolvedLastDate = newDate.toISOString();
          }
        }
      } else {
        resolvedLastDate = candidateLastDate;
      }
    }

    if (existingResponse.data) {
      const currentEvents = Number(existingResponse.data.total_events ?? 0);
      const currentRevenue =
        parseNumericValue(existingResponse.data.total_revenue) ?? 0;
      const updatedPayload = {
        total_events: Number.isFinite(currentEvents) ? currentEvents + 1 : 1,
        total_revenue: roundCurrencyValue(currentRevenue + allocationValue),
        last_event_date: resolvedLastDate ?? candidateLastDate ?? null,
        is_active: true,
      };

      const { error: updateError } = await supabase
        .from('dj_producer_relations')
        .update(updatedPayload)
        .eq('id', existingResponse.data.id);
      if (updateError) {
        throw updateError;
      }
    } else {
      const insertPayload = {
        dj_id: djId,
        producer_id: producerId,
        total_events: 1,
        total_revenue: allocationValue,
        last_event_date: candidateLastDate,
        is_active: true,
      };

      const { error: insertRelationError } = await supabase
        .from('dj_producer_relations')
        .insert(insertPayload);
      if (insertRelationError) {
        throw insertRelationError;
      }
    }
  }
};


const getProducerSortLabel = (producer: ProducerRecord) => {
  const candidates = [
    producer?.company_name,
    producer?.name,
    producer?.profile?.full_name,
    producer?.profile?.name,
    producer?.email,
    producer?.profile?.email,
  ].filter((value) => value != null && String(value).trim().length > 0);
  return String(candidates[0] ?? '').trim();
};

const normalizeProducerRecord = (record: ProducerRecord | null | undefined): ProducerRecord | null => {
  if (!record) return null;

  const profile = record.profile ?? null;
  const profileId = record.profile_id ?? profile?.id ?? record.id ?? null;
  const resolvedId = record.id ?? profileId ?? null;

  const name =
    record.name ??
    record.company_name ??
    profile?.full_name ??
    profile?.name ??
    profile?.company_name ??
    record.email ??
    profile?.email ??
    '';

  const companyName =
    record.company_name ??
    record.name ??
    profile?.company_name ??
    profile?.full_name ??
    profile?.name ??
    '';

  const email = record.email ?? profile?.email ?? '';

  return {
    ...record,
    id: resolvedId ?? null,
    profile_id: profileId ?? resolvedId ?? null,
    profile,
    name,
    company_name: companyName,
    email,
  };
};

const normalizeProducers = (records: ProducerRecord[]): ProducerRecord[] => {
  const normalized = records
    .map((record) => normalizeProducerRecord(record))
    .filter((record): record is ProducerRecord => Boolean(record));

  normalized.sort((a, b) => getProducerSortLabel(a).localeCompare(getProducerSortLabel(b), 'pt-BR', { sensitivity: 'base' }));

  return normalized;
};

// Analytics Service
export const analyticsService = {
  async getDashboardMetrics() {
    try {
      // Get counts from various tables
      const [djsResult, contractsResult, eventsResult, paymentsResult] = await Promise.all([
        supabase.from('djs').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true })
      ]);

      const totalDJs = djsResult.count || 0;
      const totalContracts = contractsResult.count || 0;

      // Get pending contracts
      const pendingContracts = 0;

      return {
        totalDJs,
        totalContracts,
        pendingContracts: pendingContracts || 0,
        djsChange: 'N/A',
        contractsChange: 'N/A',
        djsChangeType: 'neutral',
        contractsChangeType: 'neutral'
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', formatError(error));
      return {
        totalDJs: 0,
        totalContracts: 0,
        pendingContracts: 0,
        djsChange: 'Erro',
        contractsChange: 'Erro',
        djsChangeType: 'neutral',
        contractsChangeType: 'neutral'
      };
    }
  }
};

// Event Service
export const eventService = {
  __serviceName: 'eventService',
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service skipped - Supabase not configured');
        return { data: [], error: 'supabase_not_configured' };
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          dj:djs!events_dj_id_fkey (*),
          producer:producers!events_producer_id_fkey (
            *,
            profile:profiles!producers_id_fkey (*)
          ),
          event_djs (
            *,
            dj:djs (*)
          )
        `)
        .order('event_date', { ascending: false });

      if (error) {
        // Fallback when DB relationship metadata is missing: fetch base records and assemble relations manually
        const { data: events, error: e2 } = await supabase.from('events').select('*').order('event_date', { ascending: false });
        if (e2) throw e2;
        if (!events) return [];

        const eventIds = events.map(ev => ev.id).filter(Boolean);
        const producerIds = Array.from(new Set(events.map(ev => ev.producer_id).filter(Boolean)));

        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds) : { data: [] };

        const producerProfileIds = (producers || []).map(p => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : { data: [] };

        const { data: eventDjs } = eventIds.length ? await supabase.from('event_djs').select('*').in('event_id', eventIds) : { data: [] };
        const djIds = Array.from(new Set((eventDjs || []).map(ed => ed.dj_id).filter(Boolean)));
        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };

        const enriched = (events || []).map(ev => {
          const producerRaw = (producers || []).find(p => p.id === ev.producer_id) || null;
          let producer = producerRaw;
          if (producerRaw && 'profile_id' in producerRaw && producerRaw.profile_id) {
            producer = { ...producerRaw, profile: (profiles || []).find(pr => pr.id === producerRaw.profile_id) || null };
          }
          if (producerRaw && (!('profile_id' in producerRaw) || !producerRaw.profile_id)) {
            producer = { ...producerRaw, profile: null };
          }
          const eds = (eventDjs || []).filter(ed => ed.event_id === ev.id).map(ed => ({ ...ed, dj: (djs || []).find(d => d.id === ed.dj_id) || null }));
          return { ...ev, producer, event_djs: eds };
        });

        return { data: enriched, error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching events:', formatError(error));
      return { data: [], error: formatError(error) };
    }
  },

  async getById(id: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service getById skipped - Supabase not configured');
        return null;
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          dj:djs!events_dj_id_fkey (*),
          producer:producers!events_producer_id_fkey (
            *,
            profile:profiles!producers_id_fkey (*)
          ),
          event_djs (
            *,
            dj:djs (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        // Fallback: fetch base event and related records manually
        const { data: ev, error: e2 } = await supabase.from('events').select('*').eq('id', id).single();
        if (e2) throw e2;
        if (!ev) return null;

        const { data: producerRaw } = ev.producer_id ? await supabase.from('producers').select('*').eq('id', ev.producer_id).single() : { data: null };
        let profile = null;
        if (producerRaw && 'profile_id' in producerRaw && producerRaw.profile_id) {
          const res = await supabase.from('profiles').select('*').eq('id', String(producerRaw.profile_id)).single();
          profile = res.data;
        }
        const { data: eventDjs } = await supabase.from('event_djs').select('*').eq('event_id', id);
        const djIds = (eventDjs || []).map(ed => ed.dj_id).filter(Boolean);
        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };

        const eds = (eventDjs || []).map(ed => ({ ...ed, dj: (djs || []).find(d => d.id === ed.dj_id) || null }));
        const producer = producerRaw ? { ...producerRaw, profile: profile || null } : null;

        return { ...ev, producer, event_djs: eds };
      }

      return data;
    } catch (error) {
      console.error('Error fetching event:', formatError(error));
      return null;
    }
  },

  async getByDj(djId: string | null | undefined) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service getByDj skipped - Supabase not configured');
        return [];
      }

      if (!djId) {
        return [];
      }

      const selectFields = `
        *,
        dj:djs!events_dj_id_fkey (*),
        producer:producers!events_producer_id_fkey (
          *,
          profile:profiles!producers_id_fkey (*)
        ),
        event_djs (
          *,
          dj:djs (*)
        )
      `;

      const [primaryResponse, relationResponse] = await Promise.all([
        supabase
          .from('events')
          .select(selectFields)
          .eq('dj_id', djId)
          .order('event_date', { ascending: false }),
        supabase
          .from('event_djs')
          .select('event_id')
          .eq('dj_id', djId),
      ]);

      if (primaryResponse.error) throw primaryResponse.error;
      if (relationResponse.error) throw relationResponse.error;

      const eventsMap = new Map<string, any>();
      (primaryResponse.data ?? []).forEach((event) => {
        if (event?.id != null) {
          eventsMap.set(String(event.id), event);
        }
      });

      const relationIds = (relationResponse.data ?? [])
        .map((row) => row?.event_id)
        .filter((id): id is string => id != null);

      const missingIds = relationIds.filter((id) => !eventsMap.has(String(id)));
      const uniqueMissingIds = Array.from(new Set(missingIds));

      if (uniqueMissingIds.length > 0) {
        const { data: linkedEvents, error: linkedError } = await supabase
          .from('events')
          .select(selectFields)
          .in('id', uniqueMissingIds as any[])
          .order('event_date', { ascending: false });
        if (linkedError) throw linkedError;
        (linkedEvents ?? []).forEach((event) => {
          if (event?.id != null) {
            eventsMap.set(String(event.id), event);
          }
        });
      }

      const events = Array.from(eventsMap.values());
      events.sort((a, b) => {
        const extractTimestamp = (record: any) => {
          const value = record?.event_date ?? record?.date ?? record?.start_date ?? null;
          if (!value) return 0;
          const timestamp = new Date(value as any).getTime();
          return Number.isNaN(timestamp) ? 0 : timestamp;
        };
        return extractTimestamp(b) - extractTimestamp(a);
      });

      return events;
    } catch (error) {
      console.error('Error fetching events by DJ:', formatError(error));
      return [];
    }
  },

  async create(payload: EventPayload) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service create skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const input: EventPayload = payload ?? {};
      const providedDjIdsRaw = Array.isArray(input.dj_ids)
        ? input.dj_ids
        : Array.isArray(input['djIds'])
          ? input['djIds']
          : [];
      const normalizedDjIds = normalizeDjIds(providedDjIdsRaw);
      const explicitPrimaryDj = pickFirstString(input.dj_id);
      const primaryDjId = explicitPrimaryDj ?? (normalizedDjIds[0] ?? null);

      const rawRecord = buildEventRecord(input, primaryDjId);
      let allowedColumns = await getEventColumnSet();
      let sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
      if (!sanitizedRecord.event_name || !sanitizedRecord.event_date) {
        throw new Error('Event name and event date are required.');
      }

      const feeMap = isPlainRecord(input.dj_fee_map) ? (input.dj_fee_map as FeeMap) : {};
      const mergedDjIds = mergeDjIds(primaryDjId, normalizedDjIds);

      let attempt = 0;
      let lastError: any = null;

      while (attempt < 3) {
        const { data, error } = await supabase.from('events').insert([sanitizedRecord] as any).select().single();

        if (!error) {
          updateEventColumnCache(allowedColumns);
          if (data?.id) {
            await syncEventDjRelations(String(data.id), mergedDjIds, feeMap);
            await ensurePendingPaymentForEvent(data, sanitizedRecord);
            await syncDjProducerRelationStats(data, sanitizedRecord, mergedDjIds, feeMap);
          }
          return { data, error: null };
        }

        lastError = error;
        const missingColumn = extractUndefinedColumn(error);
        if (missingColumn && allowedColumns.has(missingColumn)) {
          allowedColumns.delete(missingColumn);
          updateEventColumnCache(allowedColumns);
          sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
          attempt += 1;
          continue;
        }

        throw error;
      }

      throw lastError || new Error('Unable to create event.');
    } catch (error) {
      console.error('Error creating event:', formatError(error));
      return { data: null, error: (error as any)?.message ?? String(error) };
    }
  },

  async update(id: string, payload: EventPayload) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service update skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      if (!id) {
        return { data: null, error: 'event_id_required' };
      }

      const input: EventPayload = payload ?? {};
      const providedDjIdsRaw = Array.isArray(input.dj_ids)
        ? input.dj_ids
        : Array.isArray(input['djIds'])
          ? input['djIds']
          : [];
      const normalizedDjIds = normalizeDjIds(providedDjIdsRaw);
      const explicitPrimaryDj = pickFirstString(input.dj_id);
      const primaryDjId = explicitPrimaryDj ?? (normalizedDjIds[0] ?? null);

      const rawRecord = buildEventRecord(input, primaryDjId);
      let allowedColumns = await getEventColumnSet();
      let sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
      if (!sanitizedRecord.event_name || !sanitizedRecord.event_date) {
        throw new Error('Event name and event date are required.');
      }

      const feeMap = isPlainRecord(input.dj_fee_map) ? (input.dj_fee_map as FeeMap) : {};
      const mergedDjIds = mergeDjIds(primaryDjId, normalizedDjIds);

      let attempt = 0;
      let lastError: any = null;

      while (attempt < 3) {
        const { data, error } = await supabase
          .from('events')
          .update(sanitizedRecord)
          .eq('id', id)
          .select()
          .single();

        if (!error) {
          updateEventColumnCache(allowedColumns);
          await syncEventDjRelations(id, mergedDjIds, feeMap);
          return { data, error: null };
        }

        lastError = error;
        const missingColumn = extractUndefinedColumn(error);
        if (missingColumn && allowedColumns.has(missingColumn)) {
          allowedColumns.delete(missingColumn);
          updateEventColumnCache(allowedColumns);
          sanitizedRecord = prepareSanitizedEventRecord(rawRecord, allowedColumns);
          attempt += 1;
          continue;
        }

        throw error;
      }

      throw lastError || new Error('Unable to update event.');
    } catch (error) {
      console.error('Error updating event:', formatError(error));
      return { data: null, error: (error as any)?.message ?? String(error) };
    }
  },

  async delete(id: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Event service delete skipped - Supabase not configured');
        return { error: 'supabase_not_configured' };
      }

      if (!id) {
        return { error: 'event_id_required' };
      }

      // Fetch event to provide better error messages and potential authorization checks
      const { data: event, error: fetchError } = await supabase.from('events').select('created_by').eq('id', id).maybeSingle();
      if (fetchError) {
        console.warn('Error fetching event before delete:', fetchError);
        // continue - we'll still attempt deletion below, letting RLS or DB return appropriate errors
      }

      // Attempt to delete event_djs relations first. If RLS prevents it, log and continue to try deleting the event itself
      try {
        const { error: deleteRelationsError } = await supabase.from('event_djs').delete().eq('event_id', id);
        if (deleteRelationsError) {
          const msg = String(deleteRelationsError?.message || deleteRelationsError);
          if (/permission|row-level security|unauthorized/i.test(msg)) {
            console.warn('RLS/permission prevented deleting event_djs relations:', deleteRelationsError);
            return { error: 'unauthorized' };
          }
          console.warn('Error deleting event_djs relations:', deleteRelationsError);
        }
      } catch (err) {
        console.warn('Caught error deleting event_djs relations:', formatError(err));
      }

      // Delete the event itself
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        const msg = String(error?.message || error);
        if (/permission|row-level security|unauthorized/i.test(msg)) {
          return { error: 'unauthorized' };
        }
        throw error;
      }

      return { error: null, success: true };
    } catch (error) {
      console.error('Error deleting event:', formatError(error));
      return { error: (error as any)?.message ?? String(error) };
    }
  }
};

export const djProducerRelationService = {
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ-producer relation service skipped - Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .from('dj_producer_relations')
        .select(`
          *,
          dj:djs (*),
          producer:producers (*)
        `);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching DJ/producer relations:', formatError(error));
      return [];
    }
  }
};

// Contract Service
export const contractService = {
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Contract service skipped - Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          dj:djs!contracts_dj_id_fkey (*),
          producer:producers!contracts_producer_id_fkey (
            *,
            profile:profiles!producers_id_fkey (*)
          ),
          event:events (
            *,
            dj:djs!events_dj_id_fkey (*),
            producer:producers!events_producer_id_fkey (
              *,
              profile:profiles!producers_id_fkey (*)
            ),
            event_djs (
              *,
              dj:djs (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback path: assemble records manually without relying on DB relationship metadata
        const { data: contracts, error: e2 } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
        if (e2) throw e2;
        if (!contracts) return [];

        const eventIds = Array.from(new Set(contracts.map(c => c.event_id).filter(Boolean)));
        const contractDjIds = Array.from(new Set(contracts.map(c => c.dj_id).filter(Boolean)));
        const producerIds = Array.from(new Set(contracts.map(c => c.producer_id).filter(Boolean)));

        const { data: events } = eventIds.length ? await supabase.from('events').select('*').in('id', eventIds) : { data: [] };
        const djIds = Array.from(new Set([...(events || []).map(ev => ev.dj_id).filter(Boolean), ...contractDjIds]));

        const { data: djs } = djIds.length ? await supabase.from('djs').select('*').in('id', djIds) : { data: [] };
        const { data: producers } = producerIds.length ? await supabase.from('producers').select('*').in('id', producerIds) : { data: [] };
        const producerProfileIds = (producers || []).map(p => p.profile_id).filter(Boolean);
        const { data: profiles } = producerProfileIds.length ? await supabase.from('profiles').select('*').in('id', producerProfileIds) : { data: [] };

        const { data: eventDjs } = eventIds.length ? await supabase.from('event_djs').select('*').in('event_id', eventIds) : { data: [] };
        const extraDjIds = Array.from(new Set((eventDjs || []).map(ed => ed.dj_id).filter(Boolean)));
        const { data: extraDjs } = extraDjIds.length ? await supabase.from('djs').select('*').in('id', extraDjIds) : { data: [] };

        // Map events with their relations
        const eventsMap = (events || []).reduce((acc, ev) => {
          const dj = (djs || []).find(d => d.id === ev.dj_id) || null;
          const producerRaw = (producers || []).find(p => p.id === ev.producer_id) || null;
          const producer = producerRaw ? { ...producerRaw, profile: (profiles || []).find(pr => pr.id === producerRaw.profile_id) || null } : null;
          const eds = (eventDjs || []).filter(ed => ed.event_id === ev.id).map(ed => ({ ...ed, dj: (extraDjs || []).find(d => d.id === ed.dj_id) || null }));
          acc[ev.id] = { ...ev, dj, producer, event_djs: eds };
          return acc;
        }, {} as Record<string, any>);

        // Map djs
        const djsMap = (djs || []).reduce((acc, dj) => { acc[dj.id] = dj; return acc; }, {} as Record<string, any>);

        // Assemble contracts with enriched event/dj/producer
        const enriched = (contracts || []).map(c => {
          const event = c.event_id ? eventsMap[c.event_id] || null : null;
          const dj = c.dj_id ? djsMap[c.dj_id] || null : (event ? event.dj : null);
          const producer = c.producer_id ? (producers || []).find(p => p.id === c.producer_id) || null : (event ? event.producer : null);
          return { ...c, event, dj, producer };
        });

        return enriched;
      }

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contracts:', formatError(error));
      return [];
    }
  }
};

// DJ Service
export const djService = {
  __serviceName: 'djService',
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ service skipped - Supabase not configured');
        return { data: [], error: 'supabase_not_configured' };
      }

      const baseQuery = () => supabase.from('djs').select('*');

      let response = await baseQuery().order('artist_name', { ascending: true });

      if (response.error) {
        console.warn('[djService] ordering by artist_name failed, retrying with name:', formatError(response.error));
        response = await baseQuery().order('name', { ascending: true });
      }

      if (response.error) {
        console.warn('[djService] ordering by name failed, retrying without explicit order:', formatError(response.error));
        response = await baseQuery();
      }

      if (response.error) {
        throw response.error;
      }

      return { data: response.data || [], error: null };
    } catch (error) {
      console.error('Error fetching DJs:', formatError(error));
      return { data: [], error: formatError(error) };
    }
  },

  async getById(id: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ service getById skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const { data, error } = await supabase
        .from('djs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching DJ:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async create(djData: any) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ service create skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const { data, error } = await supabase
        .from('djs')
        .insert(djData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating DJ:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async update(id: string, updates: any) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ service update skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      // Defensive: fetch a sample row to determine available columns and strip unknown keys
      let allowedKeys: string[] = [];
      try {
        const sampleRes = await supabase.from('djs').select('*').limit(1).maybeSingle();
        if (sampleRes && sampleRes.data && typeof sampleRes.data === 'object') {
          allowedKeys = Object.keys(sampleRes.data as Record<string, any>);
        }
      } catch (e) {
        // ignore - we'll fall back to using the provided updates
      }

      const filteredUpdates = allowedKeys.length
        ? Object.fromEntries(Object.entries(updates || {}).filter(([k]) => allowedKeys.includes(k)))
        : updates;

      const { data, error } = await supabase
        .from('djs')
        .update(filteredUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating DJ:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async uploadAvatar(djId: string, file: File) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('DJ service uploadAvatar skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const fileName = `dj_avatar_${djId}_${Date.now()}.${file.name.split('.').pop()}`;
      const path = `dj-avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dj-avatars')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dj-avatars')
        .getPublicUrl(path);

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  }
};

// Producer Service
export const producerService = {
  __serviceName: 'producerService',
  async getAll() {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Producer service skipped - Supabase not configured');
        return { data: [], error: 'supabase_not_configured' };
      }

      const { data: producersData, error: producersError } = await supabase
        .from('producers')
        .select(`
          *,
          profile:profiles!producers_id_fkey (*)
        `);

      if (!producersError && Array.isArray(producersData) && producersData.length > 0) {
        return { data: normalizeProducers(producersData as ProducerRecord[]), error: null };
      }

      if (producersError) {
        console.warn('[producerService] producers query failed, falling back to profiles:', formatError(producersError));
      } else {
        console.warn('[producerService] producers query returned no records, falling back to profiles table for legacy data.');
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'producer');

      if (profilesError) throw profilesError;

      const fallbackRecords = (profilesData || []).map((profile) => ({
        ...profile,
        id: profile?.id,
        profile,
      }));

      return { data: normalizeProducers(fallbackRecords as ProducerRecord[]), error: null };
    } catch (error) {
      console.error('Error fetching producers:', formatError(error));
      return { data: [], error: formatError(error) };
    }
  },

  async uploadAvatar(producerId: string, file: File) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Producer service uploadAvatar skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const fileName = `producer_avatar_${producerId}_${Date.now()}.${file.name.split('.').pop()}`;
      const path = `producer-avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('producer-avatars')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('producer-avatars')
        .getPublicUrl(path);

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  async deleteProducer({ profileId, userId }: { profileId: string; userId?: string | null }) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Producer service deleteProducer skipped - Supabase not configured');
        return { error: 'supabase_not_configured' };
      }

      if (!profileId) {
        return { error: 'profile_id_required' };
      }

      // Delete producer record (uses same id as profile)
      const { error: producerDeleteError } = await supabase
        .from('producers')
        .delete()
        .eq('id', profileId);

      if (producerDeleteError && producerDeleteError.code !== 'PGRST116') {
        console.warn('Producer delete error:', producerDeleteError);
      }

      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileDeleteError) {
        throw profileDeleteError;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting producer:', formatError(error));
      return { error: formatError(error) };
    }
  },

  async changePassword(email: string, newPassword: string) {
    // This would typically be handled by an edge function with service_role access
    return { error: 'Password change must be handled by admin edge function' };
  },

  async setDashboardDJ(producerId: string, djId: string) {
    // This would store a preference or relationship
    return { error: 'Not implemented' };
  }
};

// Storage Service
export const storageService = {
  async uploadFile(bucket: string, path: string, file: File) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Storage upload skipped - Supabase not configured');
        return { data: null, error: 'supabase_not_configured' };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return { data: { publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading file:', formatError(error));
      return { data: null, error: (error && (error as any).message) || String(error) };
    }
  },

  getPublicUrl(bucket: string, path: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Storage getPublicUrl skipped - Supabase not configured');
        return null;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', formatError(error));
      return null;
    }
  }
};

export default {
  analyticsService,
  eventService,
  djProducerRelationService,
  contractService,
  djService,
  producerService,
  storageService,
  paymentService
};

export { paymentService };
