// Assembles a full Assessment from raw answers — applies intake routing
// (UNPROVEN / prospective-A), then both scoring engines.

import type { Assessment, Intake, Level, OwnerExposureLevel } from "../types";
import { deriveStage } from "../intake";
import { isUnproven, isProspectiveA } from "../intake";
import { scoreHealth } from "./health";
import { scoreRisk, saturatedCategories, type RiskAnswer } from "./risk";
import { CONCENTRATION_CONSTRUCT_IDS } from "../fields";

export function buildAssessment(params: {
  id: string;
  business_id: string;
  intake: Intake;
  raw_health_answers: Record<string, Level>;
  raw_risk_answers: Record<string, Level>; // pre-routing answers for fields the respondent actually saw
  owner_exposure_level: OwnerExposureLevel;
}): Assessment {
  const stage = deriveStage(params.intake.customer_payment_status);

  // Apply INTAKE-06 routing: withdraw CON-01..04 to UNPROVEN, force certain
  // fields to A, before scoring — Risk Exposure Methodology v1.3, Part D.
  const routedRiskAnswers: Record<string, RiskAnswer> = {};
  for (const [fieldId, level] of Object.entries(params.raw_risk_answers)) {
    if ((CONCENTRATION_CONSTRUCT_IDS as readonly string[]).includes(fieldId) && isUnproven(fieldId, params.intake.currently_in_place)) {
      routedRiskAnswers[fieldId] = "UNPROVEN";
    } else if (isProspectiveA(fieldId, params.intake.currently_in_place)) {
      routedRiskAnswers[fieldId] = "A";
    } else {
      routedRiskAnswers[fieldId] = level;
    }
  }
  // Fields never answered because they weren't rendered (prospective / unproven) still need an entry.
  for (const fieldId of ["CON-01", "CON-02", "CON-03", "CON-04", "PRD-R-01", "DEP-03", "DEP-04", "DEP-02"]) {
    if (routedRiskAnswers[fieldId] === undefined) {
      if ((CONCENTRATION_CONSTRUCT_IDS as readonly string[]).includes(fieldId) && isUnproven(fieldId, params.intake.currently_in_place)) {
        routedRiskAnswers[fieldId] = "UNPROVEN";
      } else if (isProspectiveA(fieldId, params.intake.currently_in_place)) {
        routedRiskAnswers[fieldId] = "A";
      }
    }
  }

  const health = scoreHealth(params.raw_health_answers, stage);
  const risk = scoreRisk(routedRiskAnswers);
  const saturation: Record<string, boolean> = {};
  for (const c of risk.byCategory) saturation[c.category] = c.saturated;

  return {
    id: params.id,
    business_id: params.business_id,
    created_at: new Date().toISOString(),
    intake: params.intake,
    stage,
    health_answers: params.raw_health_answers,
    risk_answers: routedRiskAnswers,
    owner_exposure_level: params.owner_exposure_level,
    business_health_score: health.total,
    risk_exposure_score: risk.total,
    critical_exposures: risk.criticalExposures,
    category_saturation: saturation,
    category_totals: risk.categoryTotals,
    undemonstrated_constructs: risk.undemonstratedConstructs,
  };
}

export { saturatedCategories };
