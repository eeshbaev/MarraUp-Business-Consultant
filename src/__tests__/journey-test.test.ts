import { describe, it, expect } from "vitest";
import { hasPositiveSignal, summarizeTestEntries } from "@/lib/journey/test-signal";
import type { TestEntry } from "@/lib/db";

function entry(overrides: Partial<TestEntry> = {}): TestEntry {
  return {
    id: "e1",
    project_id: "p1",
    question: "reach",
    body: "note",
    is_positive: false,
    logged_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("hasPositiveSignal", () => {
  it("is false with no entries", () => {
    expect(hasPositiveSignal([])).toBe(false);
  });

  it("is false when every entry is neutral", () => {
    expect(hasPositiveSignal([entry(), entry({ question: "interest" })])).toBe(false);
  });

  it("is true with one positive entry on any question", () => {
    expect(hasPositiveSignal([entry(), entry({ question: "economics", is_positive: true })])).toBe(true);
  });
});

describe("summarizeTestEntries", () => {
  it("counts totals and positives per question, never a computed verdict", () => {
    const entries = [
      entry({ question: "reach", is_positive: true }),
      entry({ question: "reach", is_positive: false }),
      entry({ question: "interest", is_positive: false }),
    ];
    const summary = summarizeTestEntries(entries);
    expect(summary.totalEntries).toBe(3);
    expect(summary.totalByQuestion.reach).toBe(2);
    expect(summary.positiveByQuestion.reach).toBe(1);
    expect(summary.totalByQuestion.usage).toBe(0);
    expect(summary.hasAnyPositive).toBe(true);
  });
});
