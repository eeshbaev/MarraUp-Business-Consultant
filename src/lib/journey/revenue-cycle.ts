import type { RevenueCycle } from "@/lib/db";

const CYCLE_LENGTH_DAYS = 30;

export function daysIntoCycle(cycle: RevenueCycle, now: Date = new Date()): number {
  const days = (now.getTime() - new Date(cycle.started_at).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(CYCLE_LENGTH_DAYS, days));
}

export function isCycleDue(cycle: RevenueCycle, now: Date = new Date()): boolean {
  const days = (now.getTime() - new Date(cycle.started_at).getTime()) / (1000 * 60 * 60 * 24);
  return days >= CYCLE_LENGTH_DAYS;
}

export interface CycleComparison {
  revenueDeltaPct: number | null;
  netCashDelta: number | null;
  newCustomersDelta: number | null;
  avgSaleValueDeltaPct: number | null;
  topCustomerConcentrationPct: number | null; // deferred — needs line-item data, always null for now
}

// Pure diffs only — no language, no verdicts. revenue-interpretation.ts
// turns these into sentences.
export function compareCycles(current: RevenueCycle, previous: RevenueCycle | null): CycleComparison {
  if (!previous) {
    return { revenueDeltaPct: null, netCashDelta: null, newCustomersDelta: null, avgSaleValueDeltaPct: null, topCustomerConcentrationPct: null };
  }
  const revenueDeltaPct =
    current.revenue != null && previous.revenue != null && previous.revenue !== 0
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100
      : null;
  const netCashDelta = current.net_cash != null && previous.net_cash != null ? current.net_cash - previous.net_cash : null;
  const newCustomersDelta = current.new_customers != null && previous.new_customers != null ? current.new_customers - previous.new_customers : null;
  const avgSaleValueDeltaPct =
    current.avg_sale_value != null && previous.avg_sale_value != null && previous.avg_sale_value !== 0
      ? ((current.avg_sale_value - previous.avg_sale_value) / previous.avg_sale_value) * 100
      : null;
  return { revenueDeltaPct, netCashDelta, newCustomersDelta, avgSaleValueDeltaPct, topCustomerConcentrationPct: null };
}
