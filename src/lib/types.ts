// MarraUp — canonical data model.
// Ported directly from the Developer Build Specification, Section 1.
// Methodology version this schema implements: "1.0" (Methodology v1.0 Freeze).

// ---------- Primitives ----------

export type Level = "A" | "B" | "C" | "D" | "E";
export type OwnerExposureLevel = 1 | 2 | 3 | 4 | 5;
export type EpistemicStatus = "PRESENT" | "STRUCTURAL" | "PLAUSIBLE" | "n/a";
export type SourceLayer = 1 | 2 | 3 | 4;
export type Tier = "0a" | "0b" | "1" | "2";
export type PriorityLevel = "Very High" | "High" | "Medium";
export type ItemState = "open" | "in_progress" | "resolved";
export type Language = "en" | "uz" | "ru" | "zh" | "fr";
export type Currency = "UZS" | "USD";

// The 16 fixed round-robin buckets, in this exact order (Action Plan Engine, Part D).
// Order is arbitrary by design and MUST stay stable — it is part of why identical
// inputs always produce identical output, not a ranking claim.
export const DIMENSION_ORDER: string[] = [
  // 9 Health dimensions — Complete Questionnaire Specification's own order
  "Market",
  "Product/Service",
  "Business Model",
  "Financial Health",
  "Traction",
  "Management & Team",
  "Operations",
  "Governance",
  "Resilience & Growth Capacity",
  // 6 Risk categories — Risk Exposure Methodology Part F's own order
  "Concentration Exposure",
  "Financial Exposure",
  "Dependency Exposure",
  "Legal & Regulatory Exposure",
  "Market Exposure",
  "Product & Delivery Exposure",
  // Owner Exposure — always last, by design (this is what the round-0 overflow fix protects)
  "Owner Exposure",
];

export const LEVEL_RANK: Record<Level, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

export function levelRank(level: Level | OwnerExposureLevel | undefined | null): number {
  if (level === undefined || level === null) return -1;
  if (typeof level === "number") return level;
  return LEVEL_RANK[level];
}

// ---------- Intake ----------

export interface Intake {
  time_in_operation: "<6mo" | "6-12mo" | "1-3y" | "3-10y" | ">10y"; // INTAKE-01
  customer_payment_status: Level; // INTAKE-02, the classifying question
  revenue_band: string; // INTAKE-03 — band id, "none", or "prefer_not_to_say"
  revenue_currency: Currency; // respondent's choice, not fixed
  people_band: string; // INTAKE-04
  customer_base_band: string; // INTAKE-05
  currently_in_place: string[]; // INTAKE-06 checklist — drives prospective/unproven routing
  funding_basis: string[]; // INTAKE-07
  sector: string; // free text, never a dropdown, never translated
  language: Language; // UI setting only — zero effect on scoring or logic
}

export interface Stage {
  revenue_status: "PRE_REVENUE" | "REVENUE_GENERATING"; // Switch 1
  evidence_maturity: "EMERGING" | "ESTABLISHED"; // Switch 2
  stage_label: "PRE_REVENUE" | "EARLY_STAGE" | "GROWTH_STAGE" | "ESTABLISHED"; // presentation only
}

// INTAKE-06 checklist item ids -> what they drive
export const INTAKE_06_ITEMS = [
  "paying_customers",
  "active_reach",
  "product_delivered",
  "suppliers",
  "premises",
  "systems",
  "none_yet",
] as const;
export type Intake06Item = (typeof INTAKE_06_ITEMS)[number];

// ---------- Assessment ----------

export interface Assessment {
  id: string;
  business_id: string;
  created_at: string;
  intake: Intake;
  stage: Stage;
  health_answers: Record<string, Level>; // 45 fields, all scored
  risk_answers: Record<string, Level | "UNPROVEN">; // 20 fields; CON-01..04 may resolve UNPROVEN
  owner_exposure_level: OwnerExposureLevel; // unscored, displayed on its own line
  business_health_score: number; // 0-100, direct addition
  risk_exposure_score: number; // 0-100, direct addition
  critical_exposures: string[]; // Risk field ids at E
  category_saturation: Record<string, boolean>; // 6 categories, >=75% of category max
  category_totals: Record<string, number>;
  undemonstrated_constructs: string[]; // subset of CON-01..04
}

// ---------- Findings & action items ----------

export interface ClusterConditionField {
  kind: "field";
  field: string;
  minimum_level: Level | OwnerExposureLevel;
}
export interface ClusterConditionConstruct {
  kind: "construct";
  construct: string; // CON-01..04
}
export type ClusterCondition = ClusterConditionField | ClusterConditionConstruct;

export type ResolutionRuleType =
  | "FIELD_MOVEMENT"
  | "CONSTRUCT_DEMONSTRATED"
  | "CLUSTER_CLEARED"
  | "CATEGORY_THRESHOLD"
  | "COUNT_THRESHOLD";

export interface ResolutionRule {
  type: ResolutionRuleType;
  field?: string; // FIELD_MOVEMENT
  minimum_level?: Level | OwnerExposureLevel; // FIELD_MOVEMENT
  construct?: string; // CONSTRUCT_DEMONSTRATED
  required_fields?: ClusterCondition[]; // CLUSTER_CLEARED — mixed field/construct entries allowed
  contributing_fields?: string[]; // CLUSTER_CLEARED — narrative only, never gates
  category?: string; // CATEGORY_THRESHOLD
  threshold?: number; // CATEGORY_THRESHOLD
  counted_fields?: string[]; // COUNT_THRESHOLD — dynamic per-business set
  count_threshold?: number; // COUNT_THRESHOLD — resolves when fewer than this many still trigger
}

export interface RuleContent {
  title: string;
  finding: string;
  consequence: string;
  action: string;
  avoid?: string;
  action_evidence: string;
  assessment_evidence: string;
}

export interface ActionItem {
  id: string;
  finding_ids: string[];
  source_layer: SourceLayer;
  source_fields: string[];
  tier: Tier;
  priority_level: PriorityLevel; // derived: 0a/0b -> "Very High", 1 -> "High", 2 -> "Medium"
  dimension: string; // one of DIMENSION_ORDER
  weight: number; // for Very High tiering; also tiebreak for High/Medium
  points_earned: number; // for High/Medium points-left calc
  rank_key: number; // weight (Very High); points_left (High/Medium); MAX not SUM for clusters
  epistemic_status: EpistemicStatus;
  fallback_order: number; // fixed field-listing position; last-resort tiebreak
  selection_round: number | null; // which round-robin pass produced it, within its own tier
  content_id: string; // -> translation lookup; content stored inline for v1 (content_id === rule_id)
  content: RuleContent;
  state: ItemState;
  owner_marked_delivered: boolean;
  resolution_rule: ResolutionRule;
}

// ---------- Rule Library (authored content, not runtime state) ----------

export interface RuleLibraryEntry {
  id: string; // e.g. "CE-DEP-01", "L3-FIN-05-BC", "CLU-03"
  layer: SourceLayer;
  dimension: string; // one of DIMENSION_ORDER
  weight: number;
  fallback_order: number;
  epistemic_status: EpistemicStatus;
  source_field?: string; // Layer 3 mainly
  stage_variant?: string | null; // Layer 3 — null unless the entry is stage-specific
  claimed_fields?: string[]; // Layer 4 clusters only — fields this entry suppresses at Layer 1/3
  content_id: string; // stable id for translation lookup
  content: RuleContent;
  resolution_rule: ResolutionRule;
}

// ---------- Plan ----------

export interface Plan {
  id: string;
  business_id: string;
  assessment_id: string;
  cycle_started_at: string;
  cycle_length_days: 120;
  action_plan: ActionItem[]; // up to 5, full detail shown
  other_actions_counts: Record<PriorityLevel, number>; // count only, v1 never details these
  full_order: ActionItem[]; // internal — every eligible item, in selection order
}

// ---------- Business ----------

export interface Business {
  id: string;
  name: string;
  owner_name: string;
  sector: string; // free text, never translated
}
