// Layer 1/2/3 finding triggers, and the 12 Layer 4 cluster triggers.
//
// The canonical content extraction stored each rule's *resolution* condition
// (the FIELD_MOVEMENT/CLUSTER_CLEARED/etc. threshold) but not a separate
// "trigger" field — the level a field must be AT for the rule to fire in the
// first place. This is derivable for the regular (non-cluster) entries: every
// Layer 1/3 FIELD_MOVEMENT gap is a single-step band, so the trigger level is
// always the adjacent, more-severe level next to minimum_level. Clusters
// (Layer 4) are the exception — their trigger conditions came from the
// authored cluster_header text ("RES-01 D/E + CON-01 E") rather than
// structured data, so CLU-01..09 and CLU-12's trigger thresholds below are
// transcribed directly from those headers (Category B content, not invented).

import type { Assessment, Level } from "../types";
import { levelRank } from "../types";
import { isRiskField, isOwnerExposureField } from "../fields";
import type { RuleLibraryEntry } from "../types";

function healthLevel(a: Assessment, field: string): Level | undefined {
  return a.health_answers[field];
}
function riskLevel(a: Assessment, field: string): Level | "UNPROVEN" | undefined {
  return a.risk_answers[field];
}

// ---------- Layer 1 triggers ----------

export function criticalExposureFires(a: Assessment, fieldId: string): boolean {
  return riskLevel(a, fieldId) === "E";
}

export function subCriticalGapFires(a: Assessment, entry: RuleLibraryEntry): boolean {
  // rule_id suffix ("-C" or "-D") names the exact trigger level directly.
  const suffix = entry.id.slice(-1) as Level;
  return riskLevel(a, entry.resolution_rule.field!) === suffix;
}

export function ownerExposureFires(a: Assessment, entry: RuleLibraryEntry): boolean {
  if (entry.id === "OE-OWN-01-L5") return a.owner_exposure_level === 5;
  if (entry.id === "OE-OWN-01-L4") return a.owner_exposure_level === 4;
  return false;
}

export function categorySaturationFires(a: Assessment, entry: RuleLibraryEntry): boolean {
  const category = entry.resolution_rule.category!;
  return a.category_saturation[category] === true;
}

// ---------- Layer 2 trigger ----------

export function undemonstratedConstructFires(a: Assessment, entry: RuleLibraryEntry): boolean {
  return riskLevel(a, entry.resolution_rule.construct!) === "UNPROVEN";
}

// ---------- Layer 3 trigger ----------

const LEVELS: Level[] = ["A", "B", "C", "D", "E"];

export function healthGapFires(a: Assessment, entry: RuleLibraryEntry): boolean {
  const field = entry.source_field!;
  const minLevel = entry.resolution_rule.minimum_level as Level;
  const triggerLevel = LEVELS[levelRank(minLevel) - 1]; // one step below minimum_level
  return healthLevel(a, field) === triggerLevel;
}

// ---------- Layer 4 cluster triggers ----------
// Explicit per-cluster condition table, transcribed from each cluster_header.

type ClusterTrigger = (a: Assessment) => boolean;

function healthIn(a: Assessment, field: string, levels: Level[]): boolean {
  const v = healthLevel(a, field);
  return v !== undefined && levels.includes(v);
}
function riskIs(a: Assessment, field: string, levels: Level[]): boolean {
  const v = riskLevel(a, field);
  return v !== undefined && v !== "UNPROVEN" && levels.includes(v);
}

export const CLUSTER_TRIGGERS: Record<string, ClusterTrigger> = {
  "CLU-01": (a) => riskIs(a, "CON-01", ["E"]) && healthIn(a, "RES-01", ["D", "E"]),
  "CLU-02": (a) => riskIs(a, "DEP-01", ["E"]) && healthIn(a, "MGT-03", ["D", "E"]),
  "CLU-03": (a) => riskIs(a, "FIN-R-01", ["E"]) && healthIn(a, "FIN-01", ["D", "E"]),
  "CLU-04": (a) => riskIs(a, "LEG-02", ["E"]) && healthIn(a, "GOV-01", ["D", "E"]),
  "CLU-05": (a) => riskIs(a, "MKT-R-01", ["D", "E"]) && healthIn(a, "MKT-04", ["D", "E"]),
  "CLU-06": (a) => riskIs(a, "DEP-03", ["E"]) && healthIn(a, "OPS-03", ["A", "B"]),
  "CLU-07": (a) => riskIs(a, "PRD-R-01", ["D", "E"]) && healthIn(a, "PROD-02", ["A", "B"]),
  // CLU-08/09 (COUNT_THRESHOLD): thresholds below are a documented Category A
  // assumption — the source states the combination in qualitative terms
  // ("Health high", "Risk moderate") without a numeric band, so a concrete
  // number was picked to make the rule runnable. Worth a real decision later.
  "CLU-08": (a) => a.business_health_score >= 70 && a.critical_exposures.length >= 3,
  "CLU-09": (a) =>
    a.risk_exposure_score < 60 &&
    Object.values(a.category_saturation).filter(Boolean).length >= 2,
  // CLU-10: deliberately not authored (duplicate of OE-OWN-01-L4/L5) — never fires.
  // CLU-11: depends on the same-exposure-pair confirmation mechanic, which
  // isn't implemented in this build (see scoring/risk.ts) — never fires here.
  "CLU-12": (a) =>
    riskLevel(a, "CON-01") === "UNPROVEN" &&
    riskLevel(a, "CON-02") === "UNPROVEN" &&
    riskLevel(a, "CON-03") === "UNPROVEN" &&
    riskLevel(a, "CON-04") === "UNPROVEN",
};

export function clusterFires(a: Assessment, clusterId: string): boolean {
  return CLUSTER_TRIGGERS[clusterId]?.(a) ?? false;
}

export { isRiskField, isOwnerExposureField };
