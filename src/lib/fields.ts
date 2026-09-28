// Field registries. Used to determine which "improvement direction" a level
// comparison uses — see resolution.ts for why this matters.

export const RISK_FIELD_IDS = [
  "CON-01", "CON-02", "CON-03", "CON-04",
  "FIN-R-01", "FIN-R-02", "FIN-R-03", "FIN-R-04",
  "DEP-01", "DEP-02", "DEP-03", "DEP-04",
  "LEG-01", "LEG-02", "LEG-03", "LEG-04",
  "MKT-R-01", "MKT-R-02",
  "PRD-R-01", "PRD-R-02",
] as const;

export const CONCENTRATION_CONSTRUCT_IDS = ["CON-01", "CON-02", "CON-03", "CON-04"] as const;

export const OWNER_EXPOSURE_FIELD_ID = "OWN-01";

export const RISK_CATEGORY_BY_FIELD: Record<string, string> = {
  "CON-01": "Concentration Exposure", "CON-02": "Concentration Exposure",
  "CON-03": "Concentration Exposure", "CON-04": "Concentration Exposure",
  "FIN-R-01": "Financial Exposure", "FIN-R-02": "Financial Exposure",
  "FIN-R-03": "Financial Exposure", "FIN-R-04": "Financial Exposure",
  "DEP-01": "Dependency Exposure", "DEP-02": "Dependency Exposure",
  "DEP-03": "Dependency Exposure", "DEP-04": "Dependency Exposure",
  "LEG-01": "Legal & Regulatory Exposure", "LEG-02": "Legal & Regulatory Exposure",
  "LEG-03": "Legal & Regulatory Exposure", "LEG-04": "Legal & Regulatory Exposure",
  "MKT-R-01": "Market Exposure", "MKT-R-02": "Market Exposure",
  "PRD-R-01": "Product & Delivery Exposure", "PRD-R-02": "Product & Delivery Exposure",
};

export const RISK_CATEGORY_WEIGHTS: Record<string, number> = {
  "Concentration Exposure": 22,
  "Financial Exposure": 22,
  "Dependency Exposure": 20,
  "Legal & Regulatory Exposure": 16,
  "Market Exposure": 10,
  "Product & Delivery Exposure": 10,
};

// Category Saturation resolution thresholds (Rule Library Batch 1), fixed at
// 75% of each category's max — restated here as data since CATEGORY_THRESHOLD
// resolution rules read this per-category, not per-entry.
export const CATEGORY_SATURATION_THRESHOLD: Record<string, number> = {
  "Concentration Exposure": 16.5,
  "Financial Exposure": 16.5,
  "Dependency Exposure": 15,
  "Legal & Regulatory Exposure": 12,
  "Market Exposure": 7.5,
  "Product & Delivery Exposure": 7.5,
};

export function isRiskField(fieldId: string): boolean {
  return (RISK_FIELD_IDS as readonly string[]).includes(fieldId);
}

export function isOwnerExposureField(fieldId: string): boolean {
  return fieldId === OWNER_EXPOSURE_FIELD_ID;
}
