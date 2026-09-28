import type { TestEntry, TestQuestion } from "@/lib/db";
import { TEST_QUESTIONS } from "@/lib/db";

// Redesign spec §4.4/§5.1 — the evidence gate: entering Experiment from
// Test requires at least one positive observation against any of the 5
// questions. A pure existence check, same pattern as hasCustomerEvent.
export function hasPositiveSignal(entries: TestEntry[]): boolean {
  return entries.some((e) => e.is_positive);
}

export interface TestSummary {
  totalEntries: number;
  positiveByQuestion: Record<TestQuestion, number>;
  totalByQuestion: Record<TestQuestion, number>;
  hasAnyPositive: boolean;
}

// §4.5 — a plain, auditable reflection: counts and presence/absence over
// the user's own entries only. Never a computed verdict.
export function summarizeTestEntries(entries: TestEntry[]): TestSummary {
  const positiveByQuestion = {} as Record<TestQuestion, number>;
  const totalByQuestion = {} as Record<TestQuestion, number>;
  for (const q of TEST_QUESTIONS) {
    positiveByQuestion[q] = 0;
    totalByQuestion[q] = 0;
  }
  for (const e of entries) {
    totalByQuestion[e.question]++;
    if (e.is_positive) positiveByQuestion[e.question]++;
  }
  return {
    totalEntries: entries.length,
    positiveByQuestion,
    totalByQuestion,
    hasAnyPositive: hasPositiveSignal(entries),
  };
}
