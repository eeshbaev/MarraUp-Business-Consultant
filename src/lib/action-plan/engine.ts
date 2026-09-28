// Action Plan Engine — Developer Build Specification, Section 3.
// Faithfully implements the pseudocode there, with two documented departures
// where the pseudocode itself was ambiguous or self-contradictory (both
// Category A — implementation detail, not a methodology change; flagged
// inline at the point they matter):
//
// 1. assignTier's literal condition (`source_layer === 1 && isExistential`)
//    would leave Layer 2 (Undemonstrated Constructs) and Layer 4 (clusters)
//    unable to ever reach tier "0a", contradicting the doc's own framing of
//    both as existential-severity findings elsewhere. Implemented per the
//    stated INTENT instead: 0a = Critical Exposure, Owner Exposure 4/5, or
//    Undemonstrated Construct, by finding type rather than by layer number.
// 2. A cluster's tier is computed as "the highest tier any single constituent
//    condition would earn alone" (the doc's own explicit rule for rank_key,
//    extended here to tier too, since the doc doesn't separately state how a
//    cluster's tier is derived when it isn't SAT-like).

import type {
  ActionItem,
  Assessment,
  PriorityLevel,
  RuleLibraryEntry,
  Tier,
} from "../types";
import { DIMENSION_ORDER } from "../types";
import { RULE_LIBRARY } from "../content";
import {
  criticalExposureFires,
  subCriticalGapFires,
  ownerExposureFires,
  categorySaturationFires,
  undemonstratedConstructFires,
  healthGapFires,
  clusterFires,
} from "./triggers";
import { isRiskField, isOwnerExposureField, RISK_CATEGORY_BY_FIELD } from "../fields";
import { pointsEarnedForHealthField } from "../scoring/health";
import { pointsEarnedForRiskField, riskFieldWeight } from "../scoring/risk";
import { HEALTH_QUESTIONS, OWNER_EXPOSURE } from "../content";

interface Finding {
  entry: RuleLibraryEntry;
  sourceFields: string[];
}

// ---------- Step 2: the four source layers ----------

function layer1(assessment: Assessment): Finding[] {
  const findings: Finding[] = [];
  for (const entry of RULE_LIBRARY.filter((e) => e.layer === 1)) {
    let fires = false;
    if (entry.id.startsWith("CE-")) fires = criticalExposureFires(assessment, entry.resolution_rule.field!);
    else if (entry.id.startsWith("SC-")) fires = subCriticalGapFires(assessment, entry);
    else if (entry.id.startsWith("OE-")) fires = ownerExposureFires(assessment, entry);
    else if (entry.id.startsWith("SAT-")) fires = categorySaturationFires(assessment, entry);
    if (fires) {
      const sourceFields = entry.id.startsWith("SAT-")
        ? [] // category-level, no single field
        : entry.id.startsWith("OE-")
        ? ["OWN-01"]
        : [entry.resolution_rule.field!];
      findings.push({ entry, sourceFields });
    }
  }
  return findings;
}

function layer2(assessment: Assessment): Finding[] {
  const findings: Finding[] = [];
  for (const entry of RULE_LIBRARY.filter((e) => e.layer === 2)) {
    if (undemonstratedConstructFires(assessment, entry)) {
      findings.push({ entry, sourceFields: [entry.resolution_rule.construct!] });
    }
  }
  return findings;
}

function layer3(assessment: Assessment): Finding[] {
  const findings: Finding[] = [];
  for (const entry of RULE_LIBRARY.filter((e) => e.layer === 3)) {
    if (entry.stage_variant) {
      const matches =
        entry.stage_variant === assessment.stage.revenue_status ||
        entry.stage_variant === assessment.stage.evidence_maturity;
      if (!matches) continue;
    }
    if (healthGapFires(assessment, entry)) {
      findings.push({ entry, sourceFields: [entry.source_field!] });
    }
  }
  return findings;
}

function layer4(assessment: Assessment): Finding[] {
  const findings: Finding[] = [];
  for (const entry of RULE_LIBRARY.filter((e) => e.layer === 4)) {
    if (clusterFires(assessment, entry.id)) {
      findings.push({ entry, sourceFields: entry.claimed_fields ?? [] });
    }
  }
  return findings;
}

// ---------- Step 3: author + suppress ----------

function healthFieldWeight(fieldId: string): number {
  return HEALTH_QUESTIONS.find((q) => q.question_id === fieldId)?.weight ?? 0;
}

// CLU-08/09 are portfolio-level (cross-category) clusters — their source
// dimension in the Rule Library content is descriptive text ("Cross-category
// (portfolio-level) — Critical Exposures"), not one of the 16 DIMENSION_ORDER
// buckets, since the finding isn't really about one dimension. Round-robin
// selection requires every item to sit in a real bucket, though, so each is
// assigned dynamically to the dimension of its most severe live constituent —
// a documented Category A choice, not a methodology change.
function resolveClusterDimension(entry: RuleLibraryEntry, assessment: Assessment): string {
  if (entry.id === "CLU-08") {
    const dims = assessment.critical_exposures
      .map((f) => ({ field: f, dim: RISK_CATEGORY_BY_FIELD[f], weight: riskFieldWeight(f) }))
      .filter((x) => x.dim);
    dims.sort((a, b) => b.weight - a.weight);
    return dims[0]?.dim ?? entry.dimension;
  }
  if (entry.id === "CLU-09") {
    const saturated = Object.entries(assessment.category_saturation)
      .filter(([, v]) => v)
      .map(([cat]) => cat);
    return saturated[0] ?? entry.dimension;
  }
  return entry.dimension;
}

function author(findings: Finding[], assessment: Assessment): ActionItem[] {
  return findings.map(({ entry, sourceFields }) => ({
    id: entry.id,
    finding_ids: [entry.id],
    source_layer: entry.layer,
    source_fields: sourceFields,
    tier: "2" as Tier, // placeholder, set in assignTier pass
    priority_level: "Medium" as PriorityLevel,
    dimension: resolveClusterDimension(entry, assessment),
    weight: entry.weight,
    points_earned: 0,
    rank_key: 0,
    epistemic_status: entry.epistemic_status,
    fallback_order: entry.fallback_order,
    selection_round: null,
    content_id: entry.content_id,
    content: entry.content,
    state: "open",
    owner_marked_delivered: false,
    resolution_rule: entry.resolution_rule,
  }));
}

function applyLayer4Suppression(items: ActionItem[]): ActionItem[] {
  const claimedFields = new Set<string>();
  for (const item of items) {
    if (item.source_layer === 4) {
      for (const f of item.source_fields) claimedFields.add(f);
    }
  }
  if (claimedFields.size === 0) return items;
  // Suppress standalone Layer 1 Critical Exposure and Layer 3 items for any
  // field a firing cluster claims (Action Plan Engine Part C).
  return items.filter((item) => {
    if (item.source_layer === 4) return true;
    if (item.source_layer === 1 && item.id.startsWith("SAT-")) return true; // category-level, never claimed
    if (item.source_layer === 1 && item.id.startsWith("OE-")) return true; // never claimed by a cluster
    return !item.source_fields.some((f) => claimedFields.has(f));
  });
}

// ---------- Tier assignment ----------

const TIER_RANK: Record<Tier, number> = { "0a": 3, "0b": 2, "1": 1, "2": 0 };
function betterTier(a: Tier, b: Tier): Tier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

function pointsLeftForField(fieldId: string, assessment: Assessment): number {
  if (isRiskField(fieldId)) {
    const level = assessment.risk_answers[fieldId];
    const weight = riskFieldWeight(fieldId);
    const earned = level && level !== "UNPROVEN" ? pointsEarnedForRiskField(fieldId, level) : 0;
    return weight - earned;
  }
  const level = assessment.health_answers[fieldId];
  const weight = healthFieldWeight(fieldId);
  const earned = level ? pointsEarnedForHealthField(fieldId, level, assessment.stage) : 0;
  return weight - earned;
}

// What tier/rank_key would this single field earn as a standalone finding?
// Used both for non-cluster items and to derive a cluster's tier/rank_key as
// the max over its constituents (see file header, departure #2).
function standaloneSeverity(fieldId: string, assessment: Assessment): { tier: Tier; rankKey: number } {
  if (isOwnerExposureField(fieldId)) {
    const level = assessment.owner_exposure_level;
    if (level >= 4) return { tier: "0a", rankKey: OWNER_EXPOSURE.weight_equivalence[String(level)] };
    return { tier: "2", rankKey: 0 };
  }
  if (isRiskField(fieldId)) {
    const level = assessment.risk_answers[fieldId];
    if (level === "E") return { tier: "0a", rankKey: riskFieldWeight(fieldId) };
    if (level === "UNPROVEN") return { tier: "0a", rankKey: 8 }; // Undemonstrated Construct — no field weight; documented rank_key assumption
    const pointsLeft = pointsLeftForField(fieldId, assessment);
    return { tier: pointsLeft >= 2.0 ? "1" : "2", rankKey: pointsLeft };
  }
  const pointsLeft = pointsLeftForField(fieldId, assessment);
  return { tier: pointsLeft >= 2.0 ? "1" : "2", rankKey: pointsLeft };
}

function assignTierAndRankKey(item: ActionItem, assessment: Assessment): { tier: Tier; rankKey: number } {
  if (item.source_layer === 1 && item.id.startsWith("CE-")) return { tier: "0a", rankKey: item.weight };
  if (item.source_layer === 1 && item.id.startsWith("OE-")) return { tier: "0a", rankKey: item.weight };
  if (item.source_layer === 1 && item.id.startsWith("SAT-")) return { tier: "0b", rankKey: item.weight };
  if (item.source_layer === 2) return { tier: "0a", rankKey: 8 }; // Undemonstrated Construct — see file header, departure #1

  if (item.source_layer === 4) {
    if (item.id === "CLU-08") return { tier: "0a", rankKey: 8 };
    if (item.id === "CLU-09") return { tier: "0b", rankKey: 6 };
    const severities = item.source_fields.map((f) => standaloneSeverity(f, assessment));
    if (severities.length === 0) return { tier: "0b", rankKey: item.weight };
    const tier = severities.reduce((best, s) => betterTier(best, s.tier), "2" as Tier);
    const rankKey = Math.max(...severities.map((s) => s.rankKey));
    return { tier, rankKey };
  }

  // Layer 3 and Layer 1 sub-critical (SC-*): fixed points-left cutoff.
  const pointsLeft = pointsLeftForField(item.source_fields[0], assessment);
  return { tier: pointsLeft >= 2.0 ? "1" : "2", rankKey: pointsLeft };
}

function tierToPriority(tier: Tier): PriorityLevel {
  if (tier === "0a" || tier === "0b") return "Very High";
  if (tier === "1") return "High";
  return "Medium";
}

// ---------- Round-robin selection ----------

function byWithinDimensionTuple(a: ActionItem, b: ActionItem): number {
  // Tier first — this is what makes "0a always ranks ahead of 0b within a
  // shared dimension" (Action Plan Engine, Profile F) hold: 0a and 0b share
  // one round-robin pass (buildPlan pools tier0a+tier0b together), so a
  // Category Saturation flag's rank_key (a category-weight proxy, often
  // large) must not be allowed to outrank a Critical Exposure's rank_key
  // just because the number happens to be bigger. Only within the same tier
  // does rank_key decide order.
  const tierDiff = TIER_RANK[b.tier] - TIER_RANK[a.tier];
  if (tierDiff !== 0) return tierDiff;
  if (b.rank_key !== a.rank_key) return b.rank_key - a.rank_key;
  return a.fallback_order - b.fallback_order;
}

function roundRobinOrder(findings: ActionItem[]): ActionItem[] {
  const buckets = new Map<string, ActionItem[]>();
  for (const item of findings) {
    const list = buckets.get(item.dimension) ?? [];
    list.push(item);
    buckets.set(item.dimension, list);
  }
  for (const list of buckets.values()) list.sort(byWithinDimensionTuple);

  // Safety guard: every item's dimension must be one of the 16 DIMENSION_ORDER
  // buckets or it can never be picked up below, which would otherwise spin
  // forever. Fail loudly instead — this should never happen once every item
  // has a resolved dimension (see resolveClusterDimension for the one case
  // that needed dynamic resolution).
  const known = new Set(DIMENSION_ORDER);
  for (const dim of buckets.keys()) {
    if (!known.has(dim)) throw new Error(`roundRobinOrder: unrecognized dimension "${dim}" is not in DIMENSION_ORDER`);
  }

  const ordered: ActionItem[] = [];
  let round = 0;
  while (ordered.length < findings.length) {
    let roundItems = DIMENSION_ORDER.filter((dim) => buckets.get(dim)?.[round]).map((dim) => buckets.get(dim)![round]);

    // Round-0 overflow fix (Action Plan Engine Part D / Part K item 15a):
    // only round 0 of the tier0a+0b pass can have more than 5 dimensions
    // eligible at once. For that case only, order by rank_key desc first.
    if (round === 0 && roundItems.length > 5) {
      roundItems = [...roundItems].sort((a, b) => b.rank_key - a.rank_key);
    }

    for (const item of roundItems) {
      item.selection_round = round;
      ordered.push(item);
    }
    round++;
  }
  return ordered;
}

// ---------- Build plan ----------

export interface BuildPlanResult {
  action_plan: ActionItem[];
  other_actions_counts: Record<PriorityLevel, number>;
  full_order: ActionItem[];
}

export function buildPlan(assessment: Assessment): BuildPlanResult {
  const findings = [...layer1(assessment), ...layer2(assessment), ...layer3(assessment), ...layer4(assessment)];
  const items = applyLayer4Suppression(author(findings, assessment));

  for (const item of items) {
    const { tier, rankKey } = assignTierAndRankKey(item, assessment);
    item.tier = tier;
    item.rank_key = rankKey;
    item.priority_level = tierToPriority(tier);
    if (item.source_fields.length === 1 && !isRiskField(item.source_fields[0]) && !isOwnerExposureField(item.source_fields[0])) {
      item.points_earned = pointsEarnedForHealthField(
        item.source_fields[0],
        assessment.health_answers[item.source_fields[0]],
        assessment.stage
      );
    }
  }

  const tier0 = items.filter((i) => i.tier === "0a" || i.tier === "0b");
  const tier1 = items.filter((i) => i.tier === "1");
  const tier2 = items.filter((i) => i.tier === "2");

  const fullOrder = [...roundRobinOrder(tier0), ...roundRobinOrder(tier1), ...roundRobinOrder(tier2)];
  const actionPlan = fullOrder.slice(0, 5);
  const otherActions = fullOrder.slice(5);

  const counts: Record<PriorityLevel, number> = { "Very High": 0, High: 0, Medium: 0 };
  for (const item of otherActions) counts[item.priority_level]++;

  return { action_plan: actionPlan, other_actions_counts: counts, full_order: fullOrder };
}
