import type { TestEntry, WeakPoint } from "@/lib/db";
import { TEST_QUESTIONS } from "@/lib/db";
import { summarizeTestEntries } from "./test-signal";

// Redesign spec §5.2 — deterministic funnel diagnosis over the user's own
// recorded Test numbers (counts and presence/absence only, never a
// generated verdict). Reads the 5 questions in AARRR order and flags every
// point where the evidence is weak or absent relative to the funnel stage
// before it: a question with zero entries once an earlier question has
// positive entries, or a question with entries but no positive signal.
export function computeWeakPoints(entries: TestEntry[]): WeakPoint[] {
  const summary = summarizeTestEntries(entries);
  const weakPoints: WeakPoint[] = [];
  let priorHadPositive = true; // Reach has no "prior" question — always eligible to be checked.

  for (const q of TEST_QUESTIONS) {
    const total = summary.totalByQuestion[q];
    const positive = summary.positiveByQuestion[q];
    if (priorHadPositive) {
      if (total === 0 || positive === 0) {
        weakPoints.push(q);
      }
    }
    priorHadPositive = positive > 0;
  }

  return weakPoints;
}
