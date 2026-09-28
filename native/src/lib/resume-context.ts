import { getDiscoverAnswers, getLatestAssessment, getLatestPlan, listActiveProjects, listBusinesses } from "./db";
import { findAssessmentResumeTarget } from "./assessment/progress";
import { hasDiscoverProgress } from "./discover/resume-step";
import { projectStageHref } from "./journey/stage-href";

export type ResumeSuggestion =
  | { kind: "assessment"; businessId: string; businessName: string; answered: number; total: number }
  | { kind: "plan"; businessId: string; businessName: string; openCount: number }
  | { kind: "myPath"; href: string; projectName: string }
  | { kind: "discover"; href: string; completed: boolean };

/** Active My Path project or saved Discover questionnaire (shown on the Launch new card). */
export function getMyPathResume(): Extract<ResumeSuggestion, { kind: "myPath" | "discover" }> | null {
  const projects = listActiveProjects();
  if (projects.length > 0) {
    const p = projects[0];
    const name = p.name || p.market_gap_text || "";
    return { kind: "myPath", href: projectStageHref(p), projectName: name };
  }

  const discover = getDiscoverAnswers();
  if (discover?.completed_at) {
    return { kind: "discover", href: "/my-path/results", completed: true };
  }
  if (discover && hasDiscoverProgress(discover.answers)) {
    return { kind: "discover", href: "/my-path/start", completed: false };
  }

  return null;
}

function assessmentResumeSuggestion(): Extract<ResumeSuggestion, { kind: "assessment" }> | null {
  const assessmentResume = findAssessmentResumeTarget();
  if (!assessmentResume) return null;
  return {
    kind: "assessment",
    businessId: assessmentResume.businessId,
    businessName: assessmentResume.businessName,
    answered: assessmentResume.answered,
    total: assessmentResume.total,
  };
}

function openPlanResumeSuggestion(): Extract<ResumeSuggestion, { kind: "plan" }> | null {
  for (const b of listBusinesses()) {
    const plan = getLatestPlan(b.id);
    if (!plan) continue;
    const openCount = plan.action_plan.filter((i) => i.state !== "resolved").length;
    if (openCount > 0) {
      return { kind: "plan", businessId: b.id, businessName: b.name, openCount };
    }
  }
  return null;
}

/** Resume for the “Assess / running business” card on Explore (assessment draft or open plan only). */
export function getAssessExploreResume(): Extract<ResumeSuggestion, { kind: "assessment" | "plan" }> | null {
  return assessmentResumeSuggestion() ?? openPlanResumeSuggestion();
}

/** Highest-priority in-progress work to surface on Explore (returning users). */
export function getResumeSuggestion(): ResumeSuggestion | null {
  const assessment = assessmentResumeSuggestion();
  if (assessment) return assessment;

  const path = getMyPathResume();
  if (path?.kind === "myPath" || path?.kind === "discover") return path;

  return openPlanResumeSuggestion();
}
