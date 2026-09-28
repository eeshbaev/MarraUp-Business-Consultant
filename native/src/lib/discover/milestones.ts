import type { Project, ProjectStage } from "../db";

/** Stored on `projects.stage` (Redesign v2.0). Includes `blueprint` as an in-flow screen, not a macro phase. */
export const PROJECT_STAGE_ORDER: readonly ProjectStage[] = [
  "finding",
  "blueprint",
  "developing",
  "testing",
  "revenue",
] as const;

/** Macro journey steps shown on Profile (matches product phases, not every screen). */
export type ProfileJourneyPhaseId = "discover" | "finding" | "developing" | "testing" | "revenue" | "stable";

export const PROFILE_JOURNEY_PHASE_ORDER: readonly ProfileJourneyPhaseId[] = [
  "discover",
  "finding",
  "developing",
  "testing",
  "revenue",
  "stable",
] as const;

const PROFILE_PROJECT_PHASE_ORDER: readonly Exclude<ProfileJourneyPhaseId, "discover" | "stable">[] = [
  "finding",
  "developing",
  "testing",
  "revenue",
] as const;

export const PROFILE_JOURNEY_LABEL_KEY: Record<ProfileJourneyPhaseId, string> = {
  discover: "myPathList.stage.discover",
  finding: "myPathList.stage.finding",
  developing: "myPathList.stage.developing",
  testing: "myPathList.stage.testing",
  revenue: "myPathList.stage.revenue",
  stable: "myPathList.stage.stable",
};

/** Blueprint is the one-page plan after Find; in Profile it rolls into Develop. */
export function projectStageToProfilePhase(stage: ProjectStage): Exclude<ProfileJourneyPhaseId, "discover" | "stable"> {
  if (stage === "blueprint") return "developing";
  return stage;
}

export type LaunchJourneyPhaseRow = {
  id: ProfileJourneyPhaseId;
  labelKey: string;
  achieved: boolean;
  current: boolean;
};

function leadProject(projects: Project[]): Project | null {
  if (projects.length === 0) return null;
  let bestIdx = -1;
  let best = projects[0];
  for (const p of projects) {
    const idx = PROFILE_PROJECT_PHASE_ORDER.indexOf(projectStageToProfilePhase(p.stage));
    if (idx > bestIdx) {
      bestIdx = idx;
      best = p;
    }
  }
  return best;
}

function furthestProfilePhase(
  projects: Project[]
): Exclude<ProfileJourneyPhaseId, "discover" | "stable"> | null {
  const lead = leadProject(projects);
  return lead ? projectStageToProfilePhase(lead.stage) : null;
}

function currentPhaseId(input: { discoverCompleted: boolean; projects: Project[] }): ProfileJourneyPhaseId {
  const lead = leadProject(input.projects);
  if (lead) {
    if (lead.stable_view_intro_shown_at) return "stable";
    return projectStageToProfilePhase(lead.stage);
  }
  if (input.discoverCompleted) return "finding";
  return "discover";
}

export function computeLaunchJourneyPhases(input: {
  discoverCompleted: boolean;
  projects: Project[];
}): { currentPhaseId: ProfileJourneyPhaseId; phases: LaunchJourneyPhaseRow[] } {
  const current = currentPhaseId(input);
  const furthest = furthestProfilePhase(input.projects);
  const furthestIdx = furthest === null ? -1 : PROFILE_PROJECT_PHASE_ORDER.indexOf(furthest);
  const stableReached = input.projects.some((p) => !!p.stable_view_intro_shown_at);

  const phases = PROFILE_JOURNEY_PHASE_ORDER.map((id) => {
    let achieved = false;
    if (id === "discover") {
      achieved = input.discoverCompleted;
    } else if (id === "stable") {
      achieved = stableReached;
    } else {
      const stageIdx = PROFILE_PROJECT_PHASE_ORDER.indexOf(id);
      achieved = furthestIdx > stageIdx;
    }
    return {
      id,
      labelKey: PROFILE_JOURNEY_LABEL_KEY[id],
      achieved,
      current: id === current,
    };
  });

  return { currentPhaseId: current, phases };
}

/** @deprecated Use PROFILE_JOURNEY_LABEL_KEY */
export const LAUNCH_JOURNEY_LABEL_KEY = PROFILE_JOURNEY_LABEL_KEY;
