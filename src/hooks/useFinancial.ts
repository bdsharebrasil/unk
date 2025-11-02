import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { useSupabaseData } from "./useSupabaseData";
import { eventService, paymentService } from "@/services/supabaseService";

export type EventRecord = Tables<"events"> & {
  commission_rate?: number | string | null;
  commission_amount?: number | string | null;
  dj?: any;
  producer?: any;
};

export type FinancialStats = {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  pendingCount: number;
  totalCommission: number;
  netRevenue: number;
};

type NumberLike = number | string | null | undefined;

type QueryResult<TData> = {
  data: TData;
  isLoading: boolean;
  error: unknown;
  refetch: UseQueryResult<TData>['refetch'];
};

function parseNumber(value: NumberLike): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveCommissionAmount(event: EventRecord, amount: number): number {
  const explicitCommission = parseNumber(event.commission_amount);

  if (explicitCommission != null) {
    return roundCurrency(Math.max(explicitCommission, 0));
  }

  const rateCandidate = parseNumber(event.commission_rate);

  if (rateCandidate != null) {
    const rate = Math.max(rateCandidate, 0);
    return roundCurrency(amount * (rate / 100));
  }

  return 0;
}

export function usePayments(): QueryResult<EventRecord[]> {
  const { data, loading, error, refetch } = useSupabaseData<EventRecord[]>(paymentService, "getAll", [], []);

  return {
    data: Array.isArray(data) ? data : [],
    isLoading: loading,
    error,
    refetch,
  };
}

export function useEvents(): QueryResult<EventRecord[]> {
  const { data, loading, error, refetch } = useSupabaseData<EventRecord[]>(eventService, "getAll", [], []);

  return {
    data: Array.isArray(data) ? data : [],
    isLoading: loading,
    error,
    refetch,
  };
}

export function useFinancialStats(events: readonly EventRecord[] | null | undefined): FinancialStats {
  return useMemo(() => {
    const aggregate = (events ?? []).reduce(
      (
        acc: {
          totalRevenue: number;
          paidRevenue: number;
          pendingRevenue: number;
          pendingCount: number;
          totalCommission: number;
        },
        event,
      ) => {
        const amount = parseNumber(event.cache) ?? 0;
        const status = String(event.payment_status ?? "").toLowerCase();

        acc.totalRevenue += amount;

        if (status === "paid" || status === "pago") {
          acc.paidRevenue += amount;
        } else if (status === "pending" || status === "pendente" || status === "pagamento_enviado") {
          acc.pendingRevenue += amount;
          acc.pendingCount += 1;
        }

        acc.totalCommission += resolveCommissionAmount(event, amount);
        return acc;
      },
      {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        pendingCount: 0,
        totalCommission: 0,
      },
    );

    const netRevenue = aggregate.totalRevenue - aggregate.totalCommission;

    return {
      totalRevenue: roundCurrency(aggregate.totalRevenue),
      paidRevenue: roundCurrency(aggregate.paidRevenue),
      pendingRevenue: roundCurrency(aggregate.pendingRevenue),
      pendingCount: aggregate.pendingCount,
      totalCommission: roundCurrency(aggregate.totalCommission),
      netRevenue: roundCurrency(netRevenue < 0 ? 0 : netRevenue),
    };
  }, [events]);
}

// Compute financial stats from payments array (payments enriched with event relationship)
export function usePaymentStats(payments: readonly any[] | null | undefined): FinancialStats {
  return useMemo(() => {
    const aggregate = (payments ?? []).reduce(
      (
        acc: {
          totalRevenue: number;
          paidRevenue: number;
          pendingRevenue: number;
          pendingCount: number;
          totalCommission: number;
        },
        p,
      ) => {
        const ev = p.event || {};
        const amount = parseNumber(p.amount ?? p.value ?? p.fee ?? ev.fee ?? 0) ?? 0;
        const status = String(p.status ?? p.payment_status ?? '').toLowerCase();

        acc.totalRevenue += amount;

        if (status === 'paid' || status === 'pago') {
          acc.paidRevenue += amount;
        } else if (status === 'pending' || status === 'pendente' || status === 'pagamento_enviado') {
          acc.pendingRevenue += amount;
          acc.pendingCount += 1;
        }

        // Commission: prefer pre-calculated p.unk_commission (if present), then event commission_rate (%), then event.commission_amount
        let unkCommission = 0;
        if (p != null && p.unk_commission != null) {
          unkCommission = parseNumber(p.unk_commission) ?? 0;
        } else {
          const rate = parseNumber(ev?.commission_rate ?? null);
          if (rate != null) {
            unkCommission = roundCurrency(amount * (Math.max(rate, 0) / 100));
          } else if (ev && ev.commission_amount != null) {
            const explicit = parseNumber(ev.commission_amount) ?? 0;
            unkCommission = Math.max(0, explicit);
          }
        }

        acc.totalCommission += unkCommission;
        return acc;
      },
      {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        pendingCount: 0,
        totalCommission: 0,
      },
    );

    const netRevenue = aggregate.totalRevenue - aggregate.totalCommission;

    return {
      totalRevenue: roundCurrency(aggregate.totalRevenue),
      paidRevenue: roundCurrency(aggregate.paidRevenue),
      pendingRevenue: roundCurrency(aggregate.pendingRevenue),
      pendingCount: aggregate.pendingCount,
      totalCommission: roundCurrency(aggregate.totalCommission),
      netRevenue: roundCurrency(netRevenue < 0 ? 0 : netRevenue),
    };
  }, [payments]);
}
