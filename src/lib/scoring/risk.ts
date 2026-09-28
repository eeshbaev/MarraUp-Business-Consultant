// Risk Exposure scoring — Risk Exposure Methodology v1.3.
//
// Known simplification (Category A, documented — not implemented in this pass):
// the "same-exposure resolution" step (Part D of the Risk Exposure Methodology,
// deduplicating two fields that describe one underlying exposure so it isn't
// double-counted) is not implemented here. The methodology doc names the rule
// but the specific field pairs it applies to weren't part of the canonical
// content extraction. Flagging this rather than silently guessing at pairs —
// it needs a source lookup before it's implemented, not an invented list.

import type { Level } from "../types";
import { RISK_FIELDS, RISK_CATEGORIES } from "../content";
import { CATEGORY_SATURATION_THRESHOLD, RISK_CATEGORY_BY_FIELD } from "../fields";
import { round2 } from "./health";

export type RiskAnswer = Level | "UNPROVEN";

export interface RiskCategoryScore {
  category: string;
  points: number;
  max: number;
  measuredMax: number; // max minus any UNPROVEN fields' weight, for display only — never used as the saturation denominator
  saturated: boolean;
}

export function scoreRisk(answers: Record<string, RiskAnswer>): {
  total: number;
  byCategory: RiskCategoryScore[];
  categoryTotals: Record<string, number>;
  criticalExposures: string[];
  undemonstratedConstructs: string[];
} {
  const totals = new Map<string, { points: number; max: number; unprovenWeight: number }>();
  const criticalExposures: string[] = [];
  const undemonstratedConstructs: string[] = [];

  for (const f of RISK_FIELDS) {
    const entry = totals.get(f.category) ?? { points: 0, max: 0, unprovenWeight: 0 };
    entry.max += f.weight;

    const answer = answers[f.field_id];
    if (answer === "UNPROVEN") {
      entry.unprovenWeight += f.weight;
      undemonstratedConstructs.push(f.field_id);
    } else if (answer) {
      const points = f.levels[answer]?.points ?? 0;
      entry.points += points;
      if (answer === "E") criticalExposures.push(f.field_id);
    }
    totals.set(f.category, entry);
  }

  const byCategory: RiskCategoryScore[] = RISK_CATEGORIES.map((c) => {
    const t = totals.get(c.category) ?? { points: 0, max: c.weight, unprovenWeight: 0 };
    const threshold = CATEGORY_SATURATION_THRESHOLD[c.category] ?? c.weight * 0.75;
    return {
      category: c.category,
      points: round2(t.points),
      max: c.weight, // fixed — never shrunk for UNPROVEN fields (Risk Exposure Methodology, Part M)
      measuredMax: c.weight - t.unprovenWeight,
      saturated: t.points >= threshold,
    };
  });

  const categoryTotals: Record<string, number> = {};
  for (const c of byCategory) categoryTotals[c.category] = c.points;

  const total = round2(byCategory.reduce((sum, c) => sum + c.points, 0));

  return { total, byCategory, categoryTotals, criticalExposures, undemonstratedConstructs };
}

export function pointsEarnedForRiskField(fieldId: string, level: RiskAnswer): number {
  if (level === "UNPROVEN") return 0;
  const f = RISK_FIELDS.find((x) => x.field_id === fieldId);
  return f?.levels[level]?.points ?? 0;
}

export function riskFieldWeight(fieldId: string): number {
  return RISK_FIELDS.find((f) => f.field_id === fieldId)?.weight ?? 0;
}

export function saturatedCategories(byCategory: RiskCategoryScore[]): string[] {
  return byCategory.filter((c) => c.saturated).map((c) => c.category);
}

export { RISK_CATEGORY_BY_FIELD };
