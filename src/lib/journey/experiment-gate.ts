import type { ProjectExperiment } from "@/lib/db";

// Redesign spec §5.3 — the one deliberate exception to "MarraUp never
// gates": every Experiment the user chose to start must reach a Decision
// before the Project can move on. Read-only check, surfaced as a
// persistent reminder — not a hard navigation block.
export function computeIncompleteExperiments(experiments: ProjectExperiment[]): ProjectExperiment[] {
  return experiments.filter((e) => !e.decision);
}
