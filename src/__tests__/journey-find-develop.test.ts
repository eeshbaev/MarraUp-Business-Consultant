import { describe, it, expect } from "vitest";
import { computeResourceGaps } from "@/lib/journey/resource-gap";
import { computeDevelopCompletion, isFindTaskListComplete } from "@/lib/journey/find-progress";
import { computeProjectSignals, STALL_THRESHOLD_DAYS } from "@/lib/journey/stalled";
import type { Project, DevelopTask, FindTask } from "@/lib/db";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    source: "self",
    market_gap_sector_id: null,
    market_gap_text: null,
    name: "Test project",
    business_model_type: null,
    stage: "developing",
    return_count: 0,
    status: "active",
    archived_at: null,
    bp_problem: null,
    bp_customer: null,
    bp_offering: null,
    bp_revenue_model: null,
    bp_pricing: null,
    bp_advantage: null,
    bp_location_scope: null,
    bp_required_resources: null,
    bp_launch_ready_condition: null,
    blueprint_completed_at: null,
    stable_view_intro_shown_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDevelopTask(overrides: Partial<DevelopTask> = {}): DevelopTask {
  return {
    id: "d1",
    project_id: "p1",
    category: "build",
    label: "Task",
    status: "not_started",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeResourceGaps", () => {
  it("flags a required resource with no covering task", () => {
    const gaps = computeResourceGaps("Kitchen\nDelivery bikes\nPackaging", ["Rent kitchen space", "Buy packaging supplies"]);
    expect(gaps).toEqual(["Delivery bikes"]);
  });

  it("returns nothing when every resource is covered", () => {
    const gaps = computeResourceGaps("Kitchen, Delivery bikes", ["Rent kitchen space", "Buy delivery bikes"]);
    expect(gaps).toEqual([]);
  });

  it("returns nothing when no resources were listed", () => {
    expect(computeResourceGaps(null, ["Anything"])).toEqual([]);
    expect(computeResourceGaps("", ["Anything"])).toEqual([]);
  });
});

describe("isFindTaskListComplete / computeDevelopCompletion", () => {
  it("Find is complete only when task 7 (decide) is done", () => {
    const base: FindTask = { id: "f1", project_id: "p1", task_key: "decide", status: "not_started", summary: null, created_at: "", updated_at: "" };
    expect(isFindTaskListComplete([base])).toBe(false);
    expect(isFindTaskListComplete([{ ...base, status: "done" }])).toBe(true);
  });

  it("Develop is never ready with zero tasks (vacuous-true guard)", () => {
    const completion = computeDevelopCompletion(null, []);
    expect(completion.hasAtLeastOneTask).toBe(false);
    expect(completion.isReadyForTest).toBe(false);
  });

  it("Develop is ready once every task is done, even with an unresolved resource gap (a suggestion, never a blocker)", () => {
    const tasks = [makeDevelopTask({ status: "done", label: "Rent kitchen" })];
    const completion = computeDevelopCompletion("Kitchen\nDelivery bikes", tasks);
    expect(completion.allDone).toBe(true);
    expect(completion.resourceGaps).toEqual(["Delivery bikes"]);
    expect(completion.isReadyForTest).toBe(true);
  });

  it("Develop is not ready while any task is unfinished", () => {
    const tasks = [makeDevelopTask({ status: "done" }), makeDevelopTask({ id: "d2", status: "in_progress" })];
    expect(computeDevelopCompletion(null, tasks).isReadyForTest).toBe(false);
  });
});

describe("computeProjectSignals", () => {
  const now = new Date("2026-02-01T00:00:00.000Z");

  it("does not flag a stalled project when it is the user's only active project", () => {
    const p = makeProject({ updated_at: "2026-01-01T00:00:00.000Z" });
    const signals = computeProjectSignals([{ project: p, developTasks: [] }], now);
    expect(signals.stalledProjectId).toBeNull();
  });

  it(`flags a project stalled at just over ${STALL_THRESHOLD_DAYS} days when another project exists`, () => {
    const stalledUpdatedAt = new Date(now.getTime() - (STALL_THRESHOLD_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    const stalled = makeProject({ id: "p1", updated_at: stalledUpdatedAt });
    const other = makeProject({ id: "p2", stage: "finding" });
    const signals = computeProjectSignals(
      [
        { project: stalled, developTasks: [] },
        { project: other, developTasks: [] },
      ],
      now
    );
    expect(signals.stalledProjectId).toBe("p1");
  });

  it(`does not flag a project at exactly ${STALL_THRESHOLD_DAYS} days (boundary is exclusive)`, () => {
    const boundaryUpdatedAt = new Date(now.getTime() - STALL_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const p1 = makeProject({ id: "p1", updated_at: boundaryUpdatedAt });
    const p2 = makeProject({ id: "p2", stage: "finding" });
    const signals = computeProjectSignals(
      [
        { project: p1, developTasks: [] },
        { project: p2, developTasks: [] },
      ],
      now
    );
    expect(signals.stalledProjectId).toBeNull();
  });

  it("flags a ready project once every develop task is done", () => {
    const ready = makeProject({ id: "p2", updated_at: now.toISOString() });
    const readyTasks = [makeDevelopTask({ project_id: "p2", status: "done" })];
    const signals = computeProjectSignals([{ project: ready, developTasks: readyTasks }], now);
    expect(signals.readyProjectId).toBe("p2");
  });
});
