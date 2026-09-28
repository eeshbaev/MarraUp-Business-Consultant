import type { FindTask, DevelopTask } from "@/lib/db";
import { computeResourceGaps } from "./resource-gap";

// Redesign spec §2.2 task 7 ("Decide") closes the Find task list.
export function isFindTaskListComplete(tasks: FindTask[]): boolean {
  const decide = tasks.find((t) => t.task_key === "decide");
  return decide?.status === "done";
}

export interface DevelopCompletion {
  hasAtLeastOneTask: boolean;
  allDone: boolean;
  resourceGaps: string[];
  isReadyForTest: boolean;
}

// Redesign spec §3.3 — Develop's "Ready for Test?" prompt triggers once
// every Develop task is Done. "Every task done" is vacuously true with zero
// tasks, so hasAtLeastOneTask distinguishes real completion from an empty
// list that hasn't been started.
export function computeDevelopCompletion(bpRequiredResources: string | null, tasks: DevelopTask[]): DevelopCompletion {
  const hasAtLeastOneTask = tasks.length > 0;
  const allDone = hasAtLeastOneTask && tasks.every((t) => t.status === "done");
  const resourceGaps = computeResourceGaps(
    bpRequiredResources,
    tasks.map((t) => t.label)
  );
  return {
    hasAtLeastOneTask,
    allDone,
    resourceGaps,
    // Resource gaps are a suggestion, never a blocker (spec §3.1) — the
    // "Ready for Test?" prompt is driven by task completion alone; the gap
    // list is still surfaced in the UI alongside it as a flag, not a gate.
    isReadyForTest: allDone,
  };
}
