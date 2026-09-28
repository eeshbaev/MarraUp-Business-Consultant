import type { Assessment, Intake, Level, OwnerExposureLevel } from "@/lib/types";
import { HEALTH_QUESTIONS, RISK_FIELDS } from "@/lib/content";
import { buildAssessment } from "@/lib/scoring/assessment";

const BASE_INTAKE: Intake = {
  time_in_operation: "3-10y",
  customer_payment_status: "E",
  revenue_band: "some_band",
  revenue_currency: "USD",
  people_band: "6-20",
  customer_base_band: "26-100",
  currently_in_place: [
    "paying_customers",
    "active_reach",
    "product_delivered",
    "suppliers",
    "premises",
    "systems",
  ],
  funding_basis: ["own_revenue"],
  sector: "Test sector",
  language: "en",
};

// Builds an assessment where every Health field is at ceiling (E) and every
// Risk field is at the safest level (A), owner exposure at 1 — i.e. a
// business with no findings at all. Tests override specific fields from here.
export function buildCeilingAssessment(overrides?: {
  intake?: Partial<Intake>;
  health?: Record<string, Level>;
  risk?: Record<string, Level>;
  owner?: OwnerExposureLevel;
}): Assessment {
  const intake: Intake = { ...BASE_INTAKE, ...overrides?.intake };

  const health: Record<string, Level> = {};
  for (const q of HEALTH_QUESTIONS) health[q.question_id] = "E";
  Object.assign(health, overrides?.health);

  const risk: Record<string, Level> = {};
  for (const f of RISK_FIELDS) risk[f.field_id] = "A";
  Object.assign(risk, overrides?.risk);

  return buildAssessment({
    id: "test-assessment",
    business_id: "test-business",
    intake,
    raw_health_answers: health,
    raw_risk_answers: risk,
    owner_exposure_level: overrides?.owner ?? 1,
  });
}
