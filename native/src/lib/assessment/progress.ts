import { getDraftAssessment, getDraftIntake, getLatestAssessment, getLatestPlan, listBusinesses } from "@/lib/db";
import type { Intake } from "@/lib/types";
import { buildAssessmentSteps } from "./flow";

export function draftAnsweredCount(intake: Intake, businessId: string): { answered: number; total: number } {
  const steps = buildAssessmentSteps(intake);
  const draft = getDraftAssessment(businessId);
  const health = draft?.health_answers ?? {};
  const risk = draft?.risk_answers ?? {};
  const owner = draft?.owner_exposure_level ?? null;
  let answered = 0;
  for (const step of steps) {
    if (step.kind === "health" && health[step.questionId]) answered++;
    else if (step.kind === "risk" && risk[step.fieldId]) answered++;
    else if (step.kind === "owner" && owner != null) answered++;
  }
  return { answered, total: steps.length };
}

export type AssessmentResumeTarget = {
  businessId: string;
  businessName: string;
  sector: string;
  answered: number;
  total: number;
};

/** Business with intake on file but no finished assessment yet (saved draft optional). */
export function findAssessmentResumeTarget(): AssessmentResumeTarget | null {
  let best: AssessmentResumeTarget | null = null;
  for (const b of listBusinesses()) {
    if (getLatestAssessment(b.id)) continue;
    const intake = getDraftIntake(b.id);
    if (!intake) continue;
    const { answered, total } = draftAnsweredCount(intake, b.id);
    const candidate: AssessmentResumeTarget = {
      businessId: b.id,
      businessName: b.name,
      sector: b.sector,
      answered,
      total,
    };
    if (!best || candidate.answered > best.answered) best = candidate;
  }
  return best;
}

export function planProgressLabel(businessId: string): { resolved: number; total: number } | null {
  const plan = getLatestPlan(businessId);
  if (!plan) return null;
  const resolved = plan.action_plan.filter((i) => i.state === "resolved").length;
  return { resolved, total: plan.action_plan.length };
}
