import { HEALTH_QUESTIONS, RISK_FIELDS, OWNER_EXPOSURE } from "@/lib/content";
import { CONCENTRATION_CONSTRUCT_IDS } from "@/lib/fields";
import { isProspectiveA, isUnproven } from "@/lib/intake";
import type { Intake } from "@/lib/types";

export type AssessmentStep =
  | { kind: "health"; questionId: string; dimension: string }
  | { kind: "risk"; fieldId: string; category: string }
  | { kind: "owner" };

export function buildAssessmentSteps(intake: Intake): AssessmentStep[] {
  const steps: AssessmentStep[] = HEALTH_QUESTIONS.map((q) => ({
    kind: "health",
    questionId: q.question_id,
    dimension: q.dimension,
  }));

  for (const f of RISK_FIELDS) {
    const isConstruct = (CONCENTRATION_CONSTRUCT_IDS as readonly string[]).includes(f.field_id);
    const skippedUnproven = isConstruct && isUnproven(f.field_id, intake.currently_in_place);
    const skippedProspective = !isConstruct && isProspectiveA(f.field_id, intake.currently_in_place);
    if (skippedUnproven || skippedProspective) continue;
    steps.push({ kind: "risk", fieldId: f.field_id, category: f.category });
  }

  steps.push({ kind: "owner" });
  return steps;
}

export function stepAnswerKey(step: AssessmentStep): string {
  if (step.kind === "health") return step.questionId;
  if (step.kind === "risk") return step.fieldId;
  return OWNER_EXPOSURE.field_id;
}
