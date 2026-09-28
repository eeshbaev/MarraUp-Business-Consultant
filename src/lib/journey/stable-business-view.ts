import type { RevenueCycle, FounderDependence } from "@/lib/db";
import { summarizeCycle } from "./revenue-interpretation";
import type { Language } from "@/lib/types";

// Redesign spec §7 — Stable Business is a computed lens over the Project's
// own Revenue data. Five of six panels are computed here on read; the
// sixth (Founder Dependence) is passed through as-is, it has no computed
// component. Nothing here recomputes numbers Revenue already owns.
export interface StableBusinessPanels {
  hasEnoughData: boolean; // fewer than 1 closed cycle — too early for a view
  latestCycle: RevenueCycle | null;
  previousCycle: RevenueCycle | null;
  summaryLines: string[];
  dependenceScore: number; // 0-5, count of "yes" answers — shown plainly, never as a verdict
  founderDependence: FounderDependence | null;
}

export function computeStableBusinessView(closedCycles: RevenueCycle[], founderDependence: FounderDependence | null, language: Language = "en"): StableBusinessPanels {
  const [latestCycle = null, previousCycle = null] = closedCycles; // listClosedCycles orders newest first
  const hasEnoughData = closedCycles.length > 0;
  const summaryLines = latestCycle ? summarizeCycle(latestCycle, previousCycle, language) : [];
  const dependenceScore = founderDependence
    ? [
        founderDependence.only_i_sell,
        founderDependence.only_i_deliver,
        founderDependence.only_i_know_process,
        founderDependence.process_undocumented,
        founderDependence.no_backup,
      ].filter(Boolean).length
    : 0;

  return { hasEnoughData, latestCycle, previousCycle, summaryLines, dependenceScore, founderDependence };
}
