import type { Project, DevelopTask } from "@/lib/db";
import { computeDevelopCompletion } from "./find-progress";

// Redesign spec §3.2 — the multi-project stalled/ready nudge. Open question
// 2 in the spec doc: an arbitrary constant, changeable in one place.
export const STALL_THRESHOLD_DAYS = 14;

export interface ProjectWithDevelopTasks {
  project: Project;
  developTasks: DevelopTask[];
}

function daysSince(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function lastMovedAt(p: ProjectWithDevelopTasks): string {
  if (p.developTasks.length === 0) return p.project.updated_at;
  return p.developTasks.reduce((latest, t) => (t.updated_at > latest ? t.updated_at : latest), p.developTasks[0].updated_at);
}

export interface ProjectSignals {
  stalledProjectId: string | null;
  readyProjectId: string | null;
}

// Pure function over the user's own Projects and their Develop tasks — same
// "deterministic rule over the user's own records" discipline as the
// existing computeNextAction(). Only considers "developing"-stage projects
// for both signals, matching the spec's Develop-stage-specific nudge.
export function computeProjectSignals(projects: ProjectWithDevelopTasks[], now: Date = new Date()): ProjectSignals {
  const developing = projects.filter((p) => p.project.stage === "developing");

  let stalledProjectId: string | null = null;
  if (projects.length > 1) {
    for (const p of developing) {
      if (daysSince(lastMovedAt(p), now) > STALL_THRESHOLD_DAYS) {
        stalledProjectId = p.project.id;
        break;
      }
    }
  }

  let readyProjectId: string | null = null;
  for (const p of developing) {
    const completion = computeDevelopCompletion(p.project.bp_required_resources, p.developTasks);
    if (completion.isReadyForTest) {
      readyProjectId = p.project.id;
      break;
    }
  }

  return { stalledProjectId, readyProjectId };
}
