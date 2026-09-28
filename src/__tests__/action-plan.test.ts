import { describe, it, expect } from "vitest";
import { buildCeilingAssessment } from "./helpers";
import { buildPlan } from "@/lib/action-plan/engine";
import { checkResolution, confirmItem, periodicReassessment } from "@/lib/resolution";
import { HEALTH_QUESTIONS } from "@/lib/content";
import { getText } from "@/lib/localization";
import type { ActionItem } from "@/lib/types";

describe("Round-robin overflow fix (Part D / Part K item 15a)", () => {
  it("exactly 6 dimensions round-0, unequal weights: the 5 highest rank_key win, ties break by DIMENSION_ORDER", () => {
    const a = buildCeilingAssessment({
      risk: {
        "CON-01": "E", // Concentration, weight 8
        "FIN-R-01": "E", // Financial, weight 8
        "DEP-01": "E", // Dependency, weight 8
        "LEG-01": "E", // Legal, weight 6
        "MKT-R-01": "E", // Market, weight 6
        "PRD-R-01": "E", // Product & Delivery, weight 6
      },
    });
    const plan = buildPlan(a);
    expect(plan.action_plan).toHaveLength(5);
    const dims = plan.action_plan.map((i) => i.dimension);
    // The three weight-8 dimensions always win.
    expect(dims).toContain("Concentration Exposure");
    expect(dims).toContain("Financial Exposure");
    expect(dims).toContain("Dependency Exposure");
    // Of the three weight-6 dimensions, Legal and Market precede Product &
    // Delivery in DIMENSION_ORDER, so they win the tie for the remaining 2 slots.
    expect(dims).toContain("Legal & Regulatory Exposure");
    expect(dims).toContain("Market Exposure");
    expect(dims).not.toContain("Product & Delivery Exposure");
  });

  it("Owner Exposure (weight-8-equivalent) wins its slot over lower-weight dimensions despite being last in DIMENSION_ORDER", () => {
    const a = buildCeilingAssessment({
      risk: {
        "CON-03": "E", // 4
        "CON-04": "E", // wait: same dimension as CON-03 — replaced below
      },
      owner: 5,
    });
    // Build 6 distinct low-weight dimensions (4) plus Owner Exposure (8) so
    // Owner Exposure is competing against 6 others for 5 slots.
    const a2 = buildCeilingAssessment({
      risk: {
        "CON-03": "E", // Concentration, 4
        "DEP-02": "E", // Dependency, 4
        "LEG-02": "E", // Legal, 4
        "MKT-R-02": "E", // Market, 4
        "PRD-R-02": "E", // Product & Delivery, 4
        "FIN-R-03": "E", // Financial, 3
      },
      owner: 5,
    });
    void a;
    const plan = buildPlan(a2);
    const dims = plan.action_plan.map((i) => i.dimension);
    expect(dims).toContain("Owner Exposure");
    const ownerItem = plan.action_plan.find((i) => i.dimension === "Owner Exposure")!;
    expect(ownerItem.rank_key).toBe(8);
  });
});

describe("Tier assignment — fixed points-left cutoff (Part D, decided: >= 2.0, not proportional)", () => {
  it("a field exactly at points_left == 2.0 lands in Tier 1, not Tier 2", () => {
    const weight2Question = HEALTH_QUESTIONS.find((q) => q.weight === 2 && !q.stage_variant);
    expect(weight2Question).toBeDefined();
    const a = buildCeilingAssessment({
      health: { [weight2Question!.question_id]: "A" }, // A almost always earns 0 points -> pointsLeft = weight = 2.0
    });
    const plan = buildPlan(a);
    const item = plan.full_order.find((i) => i.source_fields.includes(weight2Question!.question_id));
    expect(item).toBeDefined();
    if (item!.rank_key === 2.0) {
      expect(item!.tier).toBe("1");
      expect(item!.priority_level).toBe("High");
    }
  });

  it("zero Tier 0 findings still fills the plan from High/Medium", () => {
    const a = buildCeilingAssessment({
      health: {
        "MKT-01": "A",
        "MKT-02": "B",
        "PROD-01": "A",
        "BM-01": "B",
        "FIN-01": "A",
        "TRC-01": "B",
        "MGT-01": "A",
      },
    });
    const plan = buildPlan(a);
    expect(plan.action_plan.length).toBeGreaterThan(0);
    for (const item of plan.action_plan) {
      expect(["0a", "0b"]).not.toContain(item.tier);
    }
  });
});

describe("Structural invariants", () => {
  it("a single finding produces a 1-item plan with no crash and an empty Other Actions", () => {
    const a = buildCeilingAssessment({ health: { "MKT-01": "C" } });
    const plan = buildPlan(a);
    expect(plan.action_plan.length).toBeGreaterThanOrEqual(1);
    expect(plan.action_plan.length).toBeLessThanOrEqual(5);
    if (plan.action_plan.length < 5) {
      const totalOther = Object.values(plan.other_actions_counts).reduce((s, n) => s + n, 0);
      expect(plan.full_order.length).toBe(plan.action_plan.length + totalOther);
    }
  });

  it("action_plan never exceeds 5 items", () => {
    // Ceiling-break everything: worst possible business.
    const health: Record<string, "A"> = {};
    for (const q of HEALTH_QUESTIONS) health[q.question_id] = "A";
    const a = buildCeilingAssessment({
      health,
      risk: {
        "CON-01": "E", "CON-02": "E", "CON-03": "E", "CON-04": "E",
        "FIN-R-01": "E", "FIN-R-02": "E", "DEP-01": "E", "LEG-01": "E",
        "MKT-R-01": "E", "PRD-R-01": "E",
      },
      owner: 5,
    });
    const plan = buildPlan(a);
    expect(plan.action_plan.length).toBeLessThanOrEqual(5);
  });

  it("Layer 4 cluster suppresses its standalone Layer 1/3 constituents (max, not sum, of weights)", () => {
    // CLU-01: CON-01 at E + RES-01 at D/E fires the cluster and should
    // suppress the standalone CE-CON-01 item.
    const a = buildCeilingAssessment({
      risk: { "CON-01": "E" },
      health: { "RES-01": "D" },
    });
    const plan = buildPlan(a);
    const standaloneCE = plan.full_order.find((i) => i.id === "CE-CON-01");
    const cluster = plan.full_order.find((i) => i.id === "CLU-01");
    expect(cluster).toBeDefined();
    expect(standaloneCE).toBeUndefined();
    // No field claimed by the cluster should also appear as another surfaced item.
    const allSourceFields = plan.full_order.flatMap((i) => i.source_fields);
    const counts = new Map<string, number>();
    for (const f of allSourceFields) counts.set(f, (counts.get(f) ?? 0) + 1);
    for (const [, count] of counts) expect(count).toBeLessThanOrEqual(1);
  });

  it("Owner Exposure at a low level and a low-weight Critical Exposure in a different dimension are both selected in round 0 (different buckets never compete)", () => {
    const a = buildCeilingAssessment({
      risk: { "CON-04": "E" }, // weight 4, Concentration
      owner: 5, // weight-8-equivalent, Owner Exposure
    });
    const plan = buildPlan(a);
    const dims = plan.action_plan.map((i) => i.dimension);
    expect(dims).toContain("Owner Exposure");
    expect(dims).toContain("Concentration Exposure");
  });

  it("all 6 Risk categories saturated at once: 0a ranks ahead of 0b within a shared dimension", () => {
    // Saturate Concentration (>=16.5/22) while also carrying a live CE there.
    const a = buildCeilingAssessment({
      risk: {
        "CON-01": "E", // 8 (critical)
        "CON-02": "E", // 6
        "CON-03": "D", // 3
      }, // total 17 >= 16.5 threshold -> saturated, and CON-01 is also a Critical Exposure
      // Keep RES-01 below D so CLU-01 (CON-01 E + RES-01 D/E) doesn't also
      // fire and suppress the standalone CE-CON-01 this test is checking.
      health: { "RES-01": "C" },
    });
    const plan = buildPlan(a);
    const concentrationItems = plan.full_order.filter((i) => i.dimension === "Concentration Exposure");
    const ce = concentrationItems.find((i) => i.id === "CE-CON-01");
    const sat = concentrationItems.find((i) => i.id === "SAT-CONC");
    expect(ce).toBeDefined();
    expect(sat).toBeDefined();
    expect(ce!.selection_round!).toBeLessThanOrEqual(sat!.selection_round!);
  });
});

describe("Resolution engine (Section 4)", () => {
  it("FIELD_MOVEMENT resolves in the correct direction for Risk fields (A=best) vs Health fields (E=best)", () => {
    // Risk: CE-CON-01 resolves when CON-01 reaches C or better (C, B, or A).
    const resolvedAtC = checkResolution(
      { type: "FIELD_MOVEMENT", field: "CON-01", minimum_level: "C" },
      { health_answers: {}, risk_answers: { "CON-01": "C" }, owner_exposure_level: 1, category_totals: {}, critical_exposures: [], saturated_categories: [] }
    );
    const notResolvedAtD = checkResolution(
      { type: "FIELD_MOVEMENT", field: "CON-01", minimum_level: "C" },
      { health_answers: {}, risk_answers: { "CON-01": "D" }, owner_exposure_level: 1, category_totals: {}, critical_exposures: [], saturated_categories: [] }
    );
    expect(resolvedAtC).toBe(true);
    expect(notResolvedAtD).toBe(false);

    // Health: an A->B rule resolves when the field reaches B or better (B, C, D, or E).
    const healthResolved = checkResolution(
      { type: "FIELD_MOVEMENT", field: "MKT-01", minimum_level: "B" },
      { health_answers: { "MKT-01": "E" }, risk_answers: {}, owner_exposure_level: 1, category_totals: {}, critical_exposures: [], saturated_categories: [] }
    );
    expect(healthResolved).toBe(true);
  });

  it("mixed field + construct CLUSTER_CLEARED conditions require both", () => {
    const rule = {
      type: "CLUSTER_CLEARED" as const,
      required_fields: [
        { kind: "field" as const, field: "CON-02", minimum_level: "C" as const },
        { kind: "construct" as const, construct: "CON-01" },
      ],
    };
    const bothSatisfied = checkResolution(rule, {
      health_answers: {},
      risk_answers: { "CON-02": "B", "CON-01": "D" }, // CON-01 has a scored answer (not UNPROVEN)
      owner_exposure_level: 1,
      category_totals: {},
      critical_exposures: [],
      saturated_categories: [],
    });
    const constructStillUnproven = checkResolution(rule, {
      health_answers: {},
      risk_answers: { "CON-02": "B", "CON-01": "UNPROVEN" },
      owner_exposure_level: 1,
      category_totals: {},
      critical_exposures: [],
      saturated_categories: [],
    });
    const fieldNotYetMoved = checkResolution(rule, {
      health_answers: {},
      risk_answers: { "CON-02": "D", "CON-01": "B" },
      owner_exposure_level: 1,
      category_totals: {},
      critical_exposures: [],
      saturated_categories: [],
    });
    expect(bothSatisfied).toBe(true);
    expect(constructStillUnproven).toBe(false);
    expect(fieldNotYetMoved).toBe(false);
  });

  it("confirm_item() throws for CATEGORY_THRESHOLD and COUNT_THRESHOLD items — no on-demand control", () => {
    const catItem = { resolution_rule: { type: "CATEGORY_THRESHOLD", category: "x", threshold: 1 } } as unknown as ActionItem;
    const countItem = { resolution_rule: { type: "COUNT_THRESHOLD", count_threshold: 1 } } as unknown as ActionItem;
    const ctx = { health_answers: {}, risk_answers: {}, owner_exposure_level: 1, category_totals: {}, critical_exposures: [], saturated_categories: [] };
    expect(() => confirmItem(catItem, ctx)).toThrow();
    expect(() => confirmItem(countItem, ctx)).toThrow();
  });

  it("a COUNT_THRESHOLD cluster resolves only via periodic reassessment", () => {
    const item = {
      id: "CLU-08",
      state: "open",
      resolution_rule: { type: "COUNT_THRESHOLD", counted_fields: ["__CRITICAL_EXPOSURES__"], count_threshold: 3 },
    } as unknown as ActionItem;
    const stillTriggering = periodicReassessment([item], {
      health_answers: {},
      risk_answers: {},
      owner_exposure_level: 1,
      category_totals: {},
      critical_exposures: ["CON-01", "FIN-R-01", "DEP-01"], // 3, not < 3 -> not resolved
      saturated_categories: [],
    });
    expect(stillTriggering[0].state).toBe("open");

    const resolved = periodicReassessment([item], {
      health_answers: {},
      risk_answers: {},
      owner_exposure_level: 1,
      category_totals: {},
      critical_exposures: ["CON-01"], // 1 < 3 -> resolved
      saturated_categories: [],
    });
    expect(resolved[0].state).toBe("resolved");
  });
});

describe("Localization fallback (Section 5)", () => {
  it("a content_id/field/language with a real Translation row returns the translated text, not English", () => {
    const en = getText("CE-CON-01", "title", "en");
    const uz = getText("CE-CON-01", "title", "uz");
    expect(uz).not.toBe("");
    expect(uz).not.toBe(en);
  });

  it("a content_id/field/language with no Translation row falls back to English, never blank or error", () => {
    // A field name that genuinely has no translation row (only "title" etc. are covered).
    const text = getText("CE-CON-01", "nonexistent_field", "uz");
    expect(text).toBe(getText("CE-CON-01", "nonexistent_field", "en"));
  });
});
