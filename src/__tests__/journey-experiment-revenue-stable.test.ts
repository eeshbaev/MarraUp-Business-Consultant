import { describe, it, expect } from "vitest";
import { computeWeakPoints } from "@/lib/journey/weak-point-engine";
import { computeIncompleteExperiments } from "@/lib/journey/experiment-gate";
import { compareCycles, daysIntoCycle, isCycleDue } from "@/lib/journey/revenue-cycle";
import { summarizeCycle } from "@/lib/journey/revenue-interpretation";
import { computeStableBusinessView } from "@/lib/journey/stable-business-view";
import type { TestEntry, ProjectExperiment, RevenueCycle, FounderDependence } from "@/lib/db";

function testEntry(overrides: Partial<TestEntry> = {}): TestEntry {
  return { id: "e", project_id: "p1", question: "reach", body: "n", is_positive: false, logged_at: "", created_at: "", ...overrides };
}

describe("computeWeakPoints", () => {
  it("flags Interest when Reach has positive signal but Interest has none (spec §5.2 example)", () => {
    const entries = [testEntry({ question: "reach", is_positive: true }), testEntry({ question: "reach", is_positive: true })];
    expect(computeWeakPoints(entries)).toEqual(["interest"]);
  });

  it("returns nothing when every question has positive signal", () => {
    const entries = (["reach", "interest", "usage", "response", "economics"] as const).map((q) => testEntry({ question: q, is_positive: true }));
    expect(computeWeakPoints(entries)).toEqual([]);
  });

  it("stops flagging past the first broken link in the funnel (later questions aren't independently flagged)", () => {
    const entries = [testEntry({ question: "reach", is_positive: true })]; // interest/usage/response/economics all empty
    const weak = computeWeakPoints(entries);
    expect(weak).toContain("interest");
  });
});

describe("computeIncompleteExperiments", () => {
  function exp(overrides: Partial<ProjectExperiment> = {}): ProjectExperiment {
    return {
      id: "x",
      idea_candidate_id: "s",
      project_id: "p1",
      previous_experiment_id: null,
      weak_point: "reach",
      suggestion_key: "reach_0",
      hypothesis: "h",
      intervention: "i",
      decision_rule: "d",
      decision_rule_reasoning: "r",
      what_happened: null,
      important_limitations: null,
      interpretation: null,
      evidence_state: null,
      decision: null,
      learning: null,
      created_at: "",
      updated_at: "",
      ...overrides,
    };
  }

  it("flags experiments with no decision yet", () => {
    expect(computeIncompleteExperiments([exp()])).toHaveLength(1);
    expect(computeIncompleteExperiments([exp({ decision: "continue" })])).toHaveLength(0);
  });
});

function cycle(overrides: Partial<RevenueCycle> = {}): RevenueCycle {
  return {
    id: "c",
    project_id: "p1",
    cycle_number: 1,
    started_at: "2026-01-01T00:00:00.000Z",
    closed_at: null,
    money_invested: null,
    revenue: null,
    expenses: null,
    net_cash: null,
    recurring_commitments: null,
    new_customers: null,
    total_customers: null,
    repeat_customers: null,
    sales_count: null,
    avg_sale_value: null,
    notes: null,
    review_what_happened: null,
    review_what_changed: null,
    review_needs_attention: null,
    review_next_step: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("revenue cycle timing", () => {
  it("is not due before 30 days, is due at/after 30", () => {
    const c = cycle({ started_at: "2026-01-01T00:00:00.000Z" });
    expect(isCycleDue(c, new Date("2026-01-20T00:00:00.000Z"))).toBe(false);
    expect(isCycleDue(c, new Date("2026-01-31T00:00:00.000Z"))).toBe(true);
    expect(daysIntoCycle(c, new Date("2026-01-16T00:00:00.000Z"))).toBeCloseTo(15, 0);
  });
});

describe("compareCycles / summarizeCycle", () => {
  it("has no comparisons for a first cycle (no previous)", () => {
    const cmp = compareCycles(cycle({ revenue: 100 }), null);
    expect(cmp.revenueDeltaPct).toBeNull();
    const lines = summarizeCycle(cycle({ revenue: 100 }), null);
    expect(lines[0]).toMatch(/first cycle/i);
  });

  it("never fabricates a percentage when the prior cycle's number is missing", () => {
    const cur = cycle({ revenue: 100 });
    const prev = cycle({ id: "p", revenue: null });
    const cmp = compareCycles(cur, prev);
    expect(cmp.revenueDeltaPct).toBeNull();
  });

  it("computes a real revenue delta when both cycles have the number", () => {
    const cur = cycle({ revenue: 120 });
    const prev = cycle({ id: "p", revenue: 100 });
    const cmp = compareCycles(cur, prev);
    expect(cmp.revenueDeltaPct).toBe(20);
    const lines = summarizeCycle(cur, prev);
    expect(lines.some((l) => l.includes("increased 20%"))).toBe(true);
  });
});

describe("computeStableBusinessView", () => {
  it("reports insufficient data with zero closed cycles", () => {
    const view = computeStableBusinessView([], null);
    expect(view.hasEnoughData).toBe(false);
  });

  it("reads the same interpretation numbers Revenue computes, never a separate verdict", () => {
    const closed = [cycle({ id: "c2", cycle_number: 2, revenue: 120, closed_at: "x" }), cycle({ id: "c1", cycle_number: 1, revenue: 100, closed_at: "x" })];
    const view = computeStableBusinessView(closed, null);
    expect(view.hasEnoughData).toBe(true);
    expect(view.summaryLines.some((l) => l.includes("increased 20%"))).toBe(true);
  });

  it("scores founder dependence as a plain count, not a judgment", () => {
    const dep: FounderDependence = {
      project_id: "p1",
      only_i_sell: true,
      only_i_deliver: true,
      only_i_know_process: false,
      process_undocumented: false,
      no_backup: false,
      updated_at: "",
    };
    const view = computeStableBusinessView([], dep);
    expect(view.dependenceScore).toBe(2);
  });
});
