import type { RevenueCycle } from "@/lib/db";
import { compareCycles } from "./revenue-cycle";
import type { Language } from "@/lib/types";
import { tf, LOCALE_BY_LANGUAGE } from "@/lib/ui-copy";

// Redesign spec §6.2/§7 — deterministic templates only, filled from
// compareCycles()'s numbers. A template whose inputs are missing is
// skipped entirely, never filled with a placeholder or an estimate. No
// forecasting, no benchmarking, no generated language — every sentence is
// a direct, auditable statement about the user's own recorded numbers.
// This same function is what the Stable Business view reads from (spec
// §7.2) — it is not recomputed differently there. Sentences are built from
// ui-copy.ts's tf() templates so they render in the caller's language;
// `language` defaults to "en" to keep existing (English-assuming) callers
// and tests working unchanged.
export function summarizeCycle(current: RevenueCycle, previous: RevenueCycle | null, language: Language = "en"): string[] {
  const cmp = compareCycles(current, previous);
  const lines: string[] = [];
  const locale = LOCALE_BY_LANGUAGE[language];

  if (cmp.revenueDeltaPct != null) {
    const key = cmp.revenueDeltaPct >= 0 ? "cycleSummary.revenueIncreased" : "cycleSummary.revenueDecreased";
    lines.push(tf(key, language, { pct: Math.abs(Math.round(cmp.revenueDeltaPct)) }));
  }

  if (cmp.netCashDelta != null) {
    const key = cmp.netCashDelta >= 0 ? "cycleSummary.netCashImproved" : "cycleSummary.netCashWorsened";
    lines.push(tf(key, language, { amount: Math.abs(Math.round(cmp.netCashDelta)).toLocaleString(locale) }));
  }

  if (cmp.newCustomersDelta != null) {
    if (cmp.newCustomersDelta > 0) lines.push(tf("cycleSummary.moreNewCustomers", language, { n: cmp.newCustomersDelta }));
    else if (cmp.newCustomersDelta < 0) lines.push(tf("cycleSummary.fewerNewCustomers", language, { n: Math.abs(cmp.newCustomersDelta) }));
  }

  if (cmp.avgSaleValueDeltaPct != null) {
    const key = cmp.avgSaleValueDeltaPct >= 0 ? "cycleSummary.avgSaleIncreased" : "cycleSummary.avgSaleDecreased";
    lines.push(tf(key, language, { pct: Math.abs(Math.round(cmp.avgSaleValueDeltaPct)) }));
  }

  if (current.repeat_customers != null && current.total_customers != null && current.total_customers > 0) {
    const pct = Math.round((current.repeat_customers / current.total_customers) * 100);
    lines.push(tf("cycleSummary.repeatCustomers", language, { repeat: current.repeat_customers, total: current.total_customers, pct }));
  }

  if (lines.length === 0) {
    lines.push(tf(previous ? "cycleSummary.notEnoughData" : "cycleSummary.firstCycle", language, {}));
  }

  return lines;
}
