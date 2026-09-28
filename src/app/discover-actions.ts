"use server";

// Server actions for My Path / Discover (Stage 0 — the frozen Discovery
// questionnaire). Everything past Discover (Problems/Opportunities/Idea
// Candidates/Reality Check/Experiment/First Customer/Revenue/Repeatable)
// was superseded by the Entrepreneur Journey Redesign v2.0 — see
// journey-actions.ts and the "MarraUp Entrepreneur Journey - Redesign Spec
// v2.0" doc. Those old pages and their actions were deleted once Find,
// Develop, Test, Experiment, Revenue, and the Stable Business view all
// shipped; the underlying tables are left in the schema, unreferenced,
// rather than dropped, since no real user data was ever at risk.

import { redirect } from "next/navigation";
import { saveDiscoverAnswers, clearDiscoverAnswers, markDirectionExplored } from "@/lib/db";
import { flattenAnswers, type RawAnswers } from "@/lib/discover/answers";

// Called after every screen so progress is saved and resumable at any
// point (Methodology Part 6 / the My Path intro page's "can save and
// continue any time" promise) — not just once at the very end.
export async function saveDiscoverStepAction(rawAnswersJson: string, completed: boolean): Promise<void> {
  const raw: RawAnswers = JSON.parse(rawAnswersJson);
  const hardExclusions = raw.__hard_exclusions__ ?? [];
  const { tags, preferences } = flattenAnswers(raw);
  saveDiscoverAnswers({ answers: raw, tags, hardExclusions, preferences, completed });
  if (completed) {
    redirect("/my-path/results");
  }
}

export async function restartDiscoverAction(): Promise<void> {
  clearDiscoverAnswers();
  redirect("/my-path/start");
}

// Records the "first direction explored" milestone (Part 13) the first time
// the user actually opens a shown direction, then sends them on to Market
// Intelligence for that sector — a form action rather than a plain <Link>
// so the milestone is recorded server-side before navigating away.
export async function exploreDirectionAction(formData: FormData): Promise<void> {
  const sectorId = String(formData.get("sector_id") || "");
  markDirectionExplored();
  redirect(`/market?sector=${encodeURIComponent(sectorId)}`);
}
