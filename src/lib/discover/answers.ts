// My Path / Discover — turns raw questionnaire answers (option ids per
// question) into the flattened tag list + preferences the ranking engine
// (engine.ts) actually consumes. Pure logic, no framework dependency —
// portable to a native build later.

import { DISCOVER_QUESTIONS, type Question } from "./questions";
import type { SectorId } from "./sectors";

export type RawAnswers = Record<string, string[]>; // questionId -> selected option ids

function allQuestions(): Question[] {
  // Flattens top-level questions plus any Q7 follow-ups so option lookups
  // work uniformly regardless of nesting depth.
  const flat: Question[] = [];
  for (const q of DISCOVER_QUESTIONS) {
    flat.push(q);
    for (const opt of q.options) {
      if (opt.followUp) flat.push(opt.followUp);
    }
  }
  return flat;
}

export interface FlattenedAnswers {
  tags: string[];
  preferences: string[]; // Q26 only
}

export function flattenAnswers(raw: RawAnswers): FlattenedAnswers {
  const tags: string[] = [];
  const preferences: string[] = [];
  const questions = allQuestions();

  for (const q of questions) {
    const selectedIds = raw[q.id];
    if (!selectedIds) continue;
    for (const optId of selectedIds) {
      const opt = q.options.find((o) => o.id === optId);
      if (!opt) continue;
      if (q.isPreferenceOnly) {
        preferences.push(...opt.tags);
      } else {
        tags.push(...opt.tags);
      }
    }
  }
  return { tags, preferences };
}

/** Q27 selections (sector ids) are stored/passed separately from `tags` — they never flow through the mapping table, only Part 8 Step 1. */
export function readHardExclusions(selectedSectorIds: string[]): SectorId[] {
  return selectedSectorIds as SectorId[];
}

/** Every question id in display order, expanding Q7's conditional follow-ups and Q8B inline. Used to drive the one-question-per-screen flow. */
export function questionFlow(raw: RawAnswers): Question[] {
  const flow: Question[] = [];
  const q8b = DISCOVER_QUESTIONS.find((qq) => qq.id === "q8b_customer_type");
  for (const q of DISCOVER_QUESTIONS) {
    if (q.id === "q8b_customer_type") continue; // only ever inserted conditionally, below
    flow.push(q);
    const selected = raw[q.id] ?? [];
    for (const optId of selected) {
      const opt = q.options.find((o) => o.id === optId);
      if (opt?.followUp) flow.push(opt.followUp);
    }
    if (q.id === "q8a_networks" && selected.includes("customers") && q8b) {
      flow.push(q8b);
    }
  }
  return flow;
}
