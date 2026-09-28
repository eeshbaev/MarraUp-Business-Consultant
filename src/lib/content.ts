// Canonical content loader. Reads the extracted /content JSON (45 Health questions,
// 20 Risk fields + Owner Exposure, 224 Rule Library entries incl. 12 Layer 4
// clusters) and normalizes it into the typed shapes lib/types.ts declares.
//
// Implementation note (Category A): the extraction stored each rule/cluster's
// content bundle inline rather than as a separately-keyed RuleLibraryContent
// record. This loader treats content_id === rule_id/cluster_id, which is
// equivalent for lookup purposes and simpler to keep in sync — translations
// (Section 5) key off the same id either way.

import type { Level, RuleLibraryEntry, RuleContent } from "./types";
import { RISK_CATEGORY_WEIGHTS } from "./fields";

// ---------- Health questions ----------

import market from "@/content/questions/market.json";
import productService from "@/content/questions/product-service.json";
import businessModel from "@/content/questions/business-model.json";
import financialHealth from "@/content/questions/financial-health.json";
import traction from "@/content/questions/traction.json";
import managementTeam from "@/content/questions/management-team.json";
import operations from "@/content/questions/operations.json";
import governance from "@/content/questions/governance.json";
import resilienceGrowth from "@/content/questions/resilience-growth.json";

export interface HealthQuestionLevel {
  text: string;
  points: number;
}
export interface HealthQuestion {
  question_id: string;
  dimension: string;
  weight: number;
  fallback_order: number;
  text: string;
  levels?: Record<Level, HealthQuestionLevel>;
  stage_variant: boolean;
  stage_variants?: Record<string, { levels: Record<Level, HealthQuestionLevel> }>;
}
interface HealthDimensionFile {
  dimension: string;
  dimension_weight: number;
  questions: HealthQuestion[];
}

const HEALTH_DIMENSION_FILES = [
  market, productService, businessModel, financialHealth, traction,
  managementTeam, operations, governance, resilienceGrowth,
] as unknown as HealthDimensionFile[];

export const HEALTH_QUESTIONS: HealthQuestion[] = HEALTH_DIMENSION_FILES.flatMap((d) => d.questions);
export const HEALTH_DIMENSIONS: { dimension: string; weight: number }[] = HEALTH_DIMENSION_FILES.map((d) => ({
  dimension: d.dimension,
  weight: d.dimension_weight,
}));

// Stage variants are keyed by whichever switch actually governs that field:
// MKT-03/PROD-02/PROD-03 vary by evidence_maturity (Switch 2, EMERGING/
// ESTABLISHED); MKT-05/MKT-06/BM-04/PROD-05 vary by revenue_status (Switch 1,
// PRE_REVENUE/REVENUE_GENERATING) — Intake & Stage Determination, Part B. A
// question only ever has variants for one switch, so trying both keys and
// taking whichever exists is correct, not ambiguous.
export function levelsForQuestion(
  q: HealthQuestion,
  stage: { revenue_status: "PRE_REVENUE" | "REVENUE_GENERATING"; evidence_maturity: "EMERGING" | "ESTABLISHED" }
): Record<Level, HealthQuestionLevel> {
  if (q.stage_variant && q.stage_variants) {
    const variant = q.stage_variants[stage.evidence_maturity] ?? q.stage_variants[stage.revenue_status];
    return variant.levels;
  }
  return q.levels!;
}

// ---------- Risk fields ----------

import riskFieldsRaw from "@/content/risk-fields/risk-fields.json";
import ownerExposureRaw from "@/content/risk-fields/owner-exposure.json";

export interface RiskFieldLevel {
  text: string;
  points: number;
}
export interface RiskField {
  field_id: string;
  category: string;
  weight: number;
  fallback_order: number;
  epistemic_status: string;
  text: string;
  levels: Record<Level, RiskFieldLevel>;
  actual_prospective_routing?: string;
  can_be_unproven?: boolean;
  scores_A_if_not_checked?: boolean;
}
interface RiskCategoryFile {
  category: string;
  weight: number;
  fields: RiskField[];
}

export const RISK_FIELDS: RiskField[] = (riskFieldsRaw as { categories: RiskCategoryFile[] }).categories.flatMap(
  (c) => c.fields
);
export const RISK_CATEGORIES: { category: string; weight: number }[] = (
  riskFieldsRaw as { categories: RiskCategoryFile[] }
).categories.map((c) => ({ category: c.category, weight: c.weight }));

export interface OwnerExposureLevelText {
  text: string;
}
export const OWNER_EXPOSURE = ownerExposureRaw as {
  field_id: string;
  scored: boolean;
  text: string;
  levels: Record<string, OwnerExposureLevelText>;
  weight_equivalence: Record<string, number>;
};

// ---------- Rule library ----------

import layer1Existential from "@/content/rules/layer1-existential.json";
import layer1Subcritical from "@/content/rules/layer1-subcritical.json";
import layer2Constructs from "@/content/rules/layer2-constructs.json";
import layer3Market from "@/content/rules/layer3-market.json";
import layer3ProductService from "@/content/rules/layer3-product-service.json";
import layer3BusinessModel from "@/content/rules/layer3-business-model.json";
import layer3FinancialHealth from "@/content/rules/layer3-financial-health.json";
import layer3Traction from "@/content/rules/layer3-traction.json";
import layer3ManagementTeam from "@/content/rules/layer3-management-team.json";
import layer3Operations from "@/content/rules/layer3-operations.json";
import layer3Governance from "@/content/rules/layer3-governance.json";
import layer3ResilienceGrowth from "@/content/rules/layer3-resilience-growth.json";
import layer4Clusters from "@/content/clusters/layer4-clusters.json";

interface RawRuleEntry {
  rule_id: string;
  layer: 1 | 2 | 3;
  dimension: string;
  weight: number | string | null;
  fallback_order: number;
  epistemic_status: string;
  source_field?: string;
  transition?: string | null;
  stage_variant?: string | null;
  content: RuleContent;
  resolution_rule: RuleLibraryEntry["resolution_rule"];
}

interface RawClusterEntry {
  cluster_id: string;
  layer: 4;
  dimension: string;
  cluster_header: string;
  required_fields: RuleLibraryEntry["resolution_rule"]["required_fields"];
  contributing_fields: string[];
  claimed_fields: string[];
  content: RuleContent;
  resolution_rule: RuleLibraryEntry["resolution_rule"];
}

const LAYER_1_2_RAW = [...layer1Existential, ...layer1Subcritical, ...layer2Constructs] as unknown as RawRuleEntry[];
const LAYER_3_RAW = [
  layer3Market, layer3ProductService, layer3BusinessModel, layer3FinancialHealth,
  layer3Traction, layer3ManagementTeam, layer3Operations, layer3Governance, layer3ResilienceGrowth,
].flat() as unknown as RawRuleEntry[];
const LAYER_4_RAW = layer4Clusters as unknown as RawClusterEntry[];

// OE-OWN-01-L4/L5 store weight as a descriptive string in source ("level-4/5
// equivalent"); resolve to the numeric weight_equivalence from owner-exposure.json.
function resolveWeight(entry: RawRuleEntry): number | null {
  if (typeof entry.weight === "number") return entry.weight;
  if (entry.rule_id === "OE-OWN-01-L5") return OWNER_EXPOSURE.weight_equivalence["5"];
  if (entry.rule_id === "OE-OWN-01-L4") return OWNER_EXPOSURE.weight_equivalence["4"];
  // SAT-* (Category Saturation): no per-entry weight in source. Using the
  // category's total weight as a rank_key proxy — a Category A implementation
  // choice (documented in the Canonical Content Extraction Status doc), since
  // the source material states no numeric severity value for these six entries.
  if (entry.rule_id?.startsWith("SAT-")) return RISK_CATEGORY_WEIGHTS[entry.dimension] ?? null;
  return null;
}

const layer12: RuleLibraryEntry[] = LAYER_1_2_RAW.map((e) => ({
  id: e.rule_id,
  layer: e.layer,
  dimension: e.dimension,
  weight: resolveWeight(e) ?? 0,
  fallback_order: e.fallback_order,
  epistemic_status: e.epistemic_status as RuleLibraryEntry["epistemic_status"],
  source_field: e.source_field,
  content_id: e.rule_id,
  content: e.content,
  resolution_rule: e.resolution_rule,
}));

const layer3: RuleLibraryEntry[] = LAYER_3_RAW.map((e) => ({
  id: e.rule_id,
  layer: 3,
  dimension: e.dimension,
  weight: typeof e.weight === "number" ? e.weight : 0,
  fallback_order: e.fallback_order,
  epistemic_status: e.epistemic_status as RuleLibraryEntry["epistemic_status"],
  source_field: e.source_field,
  stage_variant: e.stage_variant ?? null,
  content_id: e.rule_id,
  content: e.content,
  resolution_rule: e.resolution_rule,
}));

// CLU-08/09's resolution_rule.counted_fields is a descriptive string in the
// source ("dynamic — all registered Critical Exposures..."), not a list — the
// engine computes the live count directly (critical_exposures.length /
// saturated categories count). These markers tell resolution.ts which.
function normalizeCountedFields(clusterId: string, raw: unknown): string[] | undefined {
  if (clusterId === "CLU-08") return ["__CRITICAL_EXPOSURES__"];
  if (clusterId === "CLU-09") return ["__SATURATED_CATEGORIES__"];
  return Array.isArray(raw) ? (raw as string[]) : undefined;
}

// Two cluster entries use a shortened category name that doesn't match
// DIMENSION_ORDER's canonical spelling ("Legal Exposure" -> "Legal &
// Regulatory Exposure", "Product Exposure" -> "Product & Delivery Exposure")
// — a transcription inconsistency in the source content, not a new decision.
// Normalized here so round-robin bucketing resolves to the real dimension.
const CLUSTER_DIMENSION_FIXUP: Record<string, string> = {
  "Legal Exposure": "Legal & Regulatory Exposure",
  "Product Exposure": "Product & Delivery Exposure",
};

const layer4: RuleLibraryEntry[] = LAYER_4_RAW.filter((c) => c.cluster_id !== "CLU-10-OMITTED").map((c) => ({
  id: c.cluster_id,
  layer: 4,
  dimension: CLUSTER_DIMENSION_FIXUP[c.dimension] ?? c.dimension,
  weight: 0, // clusters derive weight/rank_key from constituent fields at runtime
  fallback_order: 1,
  epistemic_status: "n/a",
  claimed_fields: c.claimed_fields,
  content_id: c.cluster_id,
  content: c.content,
  resolution_rule: {
    ...c.resolution_rule,
    counted_fields: normalizeCountedFields(c.cluster_id, c.resolution_rule.counted_fields),
  },
}));

export const RULE_LIBRARY: RuleLibraryEntry[] = [...layer12, ...layer3, ...layer4];

export function ruleById(id: string): RuleLibraryEntry | undefined {
  return RULE_LIBRARY.find((r) => r.id === id);
}
