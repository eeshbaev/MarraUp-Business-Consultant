// My Path / Discover — evidence-class enum and tag vocabulary.
// Implements "MarraUp Entrepreneur Journey - Discovery Methodology v1.0",
// Part 17.2. This is deliberately a plain enum + string tags, never a
// numeric weight — see Part 8's "lexicographic hierarchy, not tiers".

export type EvidenceClass =
  | "COMMERCIAL_EXPERIENCE"
  | "PRACTICAL_EXPERIENCE"
  | "SPECIFIC_ACCESS"
  | "FORMAL_KNOWLEDGE"
  | "SELF_ASSESSED_ABILITY"
  | "GENERAL_COMPATIBILITY"
  | "ASPIRATION"
  | "HARD_CONSTRAINT"
  | "NONE";

// Order matters and is frozen: index = strength, lower index = stronger.
// This IS Part 8 Step 2 — never converted into arithmetic weights.
export const EVIDENCE_CLASS_ORDER: EvidenceClass[] = [
  "COMMERCIAL_EXPERIENCE",
  "PRACTICAL_EXPERIENCE",
  "SPECIFIC_ACCESS",
  "FORMAL_KNOWLEDGE",
  "SELF_ASSESSED_ABILITY",
  "GENERAL_COMPATIBILITY",
  "ASPIRATION",
];

export function evidenceClassRank(cls: EvidenceClass): number {
  const i = EVIDENCE_CLASS_ORDER.indexOf(cls);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

// The 9 Chapter C domains (Part 6, Q12-Q20).
export type Domain =
  | "FOOD_AGRICULTURE"
  | "MACHINERY"
  | "CONSTRUCTION"
  | "IT"
  | "PROFESSIONAL"
  | "RETAIL"
  | "EDUCATION"
  | "HEALTH_PERSONAL"
  | "CREATIVE";

export const DOMAINS: Domain[] = [
  "FOOD_AGRICULTURE",
  "MACHINERY",
  "CONSTRUCTION",
  "IT",
  "PROFESSIONAL",
  "RETAIL",
  "EDUCATION",
  "HEALTH_PERSONAL",
  "CREATIVE",
];

// A raw answer tag, as produced directly by the questionnaire UI.
// Shape: "<PREFIX>_<DOMAIN>" for Chapter C, or a fixed literal elsewhere.
export type AnswerTag = string;
