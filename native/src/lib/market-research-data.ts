// Typed loader for the sourced, sector-level market research JSON produced
// via web research (src/lib/market-research/*.json). All 11 countries are
// now wired into the live Market page. Coverage varies a lot by country and
// by sector (e.g. USA/Canada near-full 40/40, others lower) — every
// unsourced sector still renders as an explicit "no data" entry, never
// silently dropped or invented.
//
// Content here (summaries, risks, opportunities, source titles) is
// English-only by design — translating 11 countries x 40 sectors of prose
// into 5 languages is out of scope for now. Only the UI chrome around it
// (labels, "no data" messaging) is translated, via ui-copy.ts.

import type { CountryCode } from "./market-copy";

import uzData from "./market-research/uz.json";
import usData from "./market-research/us.json";
import deData from "./market-research/de.json";
import caData from "./market-research/ca.json";
import gbData from "./market-research/gb.json";
import frData from "./market-research/fr.json";
import ruData from "./market-research/ru.json";
import trData from "./market-research/tr.json";
import inData from "./market-research/in.json";
import cnData from "./market-research/cn.json";
import jpData from "./market-research/jp.json";

export type Outlook = "growing" | "stable" | "declining" | "no_data";

export interface HorizonOutlook {
  outlook: Outlook;
  summary: string;
  evidenceDate: string;
}

export interface MarketSource {
  title: string;
  publisher: string;
  url: string;
  date: string;
  scope: string;
  metric: string;
}

// A specific, sourced, underserved sub-sector within a broader sector —
// deliberately narrower than the macro-level `opportunities[]` bullets
// (which are sector-wide growth drivers, not something a founder could go
// build a specific business to fill). `subSector` names the concrete niche
// (e.g. "Cold storage & cold-chain logistics for horticulture") and
// `description` is a short, plain statement of what's missing or low
// quality there — not a restated growth stat. Never a computed/derived
// signal from the outlook data — only real sourced research, same bar as
// risks/opportunities/sources. Optional and additive: countries/sectors
// without researched gaps simply omit it rather than getting an invented one.
export interface MarketGap {
  subSector: string;
  description: string;
  sources: MarketSource[];
}

// Why a sector has no researched gap entries in a given country — an honest,
// classified explanation rather than silence or an invented gap. Set only
// when `gaps` is absent/empty and real research was actually attempted.
export type NoGapReasonCode =
  | "not_present" // the sector barely exists / negligible activity in this country
  | "underdeveloped" // sector exists but is so nascent overall that no specific, narrower gap has emerged yet
  | "no_demand" // the population/market doesn't need this at meaningful scale
  | "saturated" // mature, competitive market with no visible underserved segment
  | "data_unavailable"; // real research was attempted but no checkable, specific evidence could be found either way

export interface NoGapReason {
  code: NoGapReasonCode;
  note: string; // one sentence explaining the classification
  sources?: MarketSource[]; // optional — a classification can be reasoned without a citation, but cite when possible
}

export interface SectorMarketData {
  sectorId: string;
  shortTerm: HorizonOutlook;
  longTerm: HorizonOutlook;
  risks: string[];
  opportunities: string[];
  sources: MarketSource[];
  gaps?: MarketGap[];
  noGapReason?: NoGapReason;
}

// Only the pilot countries carry real sourced data. Every other CountryCode
// is intentionally absent here — never fabricate rows to fill the map.
export const MARKET_RESEARCH: Partial<Record<CountryCode, SectorMarketData[]>> = {
  uz: uzData as SectorMarketData[],
  us: usData as SectorMarketData[],
  de: deData as SectorMarketData[],
  ca: caData as SectorMarketData[],
  gb: gbData as SectorMarketData[],
  fr: frData as SectorMarketData[],
  ru: ruData as SectorMarketData[],
  tr: trData as SectorMarketData[],
  in: inData as SectorMarketData[],
  cn: cnData as SectorMarketData[],
  jp: jpData as SectorMarketData[],
};

export function getSectorMarketData(country: CountryCode, groupId: string): SectorMarketData | undefined {
  return MARKET_RESEARCH[country]?.find((s) => s.sectorId === groupId);
}

// True when a sector entry actually carries usable outlook content (as
// opposed to an explicit no_data placeholder on both horizons).
export function hasUsableData(entry: SectorMarketData | undefined): boolean {
  if (!entry) return false;
  return entry.shortTerm.outlook !== "no_data" || entry.longTerm.outlook !== "no_data";
}
