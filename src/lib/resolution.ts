// Resolution engine — Developer Build Specification, Section 4.
//
// Implementation note found while porting the pseudocode (Category A — flagged,
// not a methodology change): the spec's checkResolution pseudocode compares
// `levelRank(answer) >= levelRank(minimum_level)` uniformly. That's correct for
// Health fields, where A=weakest..E=strongest and "at least B" genuinely means
// rank(answer) >= rank(B). But Risk fields (and Owner Exposure) run the opposite
// direction — A=no exposure (best) .. E=existential (worst) — so a Risk
// FIELD_MOVEMENT rule like SC-CON-01-C ("fires at C, resolves at minimum_level B")
// means "moved to B *or better*, i.e. B or A" — the comparison has to flip to
// `<=` for Risk-domain fields, or the rule would also treat D/E as satisfying it.
// This function branches on field domain so both directions resolve correctly.

import type { ActionItem, ClusterCondition, Level, ResolutionRule } from "./types";
import { levelRank, LEVEL_RANK } from "./types";
import { isRiskField, isOwnerExposureField } from "./fields";
import { CATEGORY_SATURATION_THRESHOLD } from "./fields";

export type AnswerLevel = Level | "UNPROVEN" | number; // number for Owner Exposure (1-5)

export interface ResolutionContext {
  health_answers: Record<string, Level>;
  risk_answers: Record<string, Level | "UNPROVEN">;
  owner_exposure_level: number;
  category_totals: Record<string, number>; // recomputed from current answers
  critical_exposures: string[]; // field ids currently at E
  saturated_categories: string[]; // category names currently saturated
}

function fieldMovementSatisfied(fieldId: string, currentLevel: AnswerLevel, minimum: Level | number): boolean {
  if (currentLevel === "UNPROVEN") return false; // an unproven construct has not "moved" anywhere yet
  if (isOwnerExposureField(fieldId)) {
    // Owner Exposure: 1 = best, 5 = worst. "minimum_level" here is the ceiling
    // to fall to or below (e.g. minimum_level 3 means "at level 3 or better").
    return (currentLevel as number) <= (minimum as number);
  }
  if (isRiskField(fieldId)) {
    // Risk fields: A = best, E = worst. "minimum_level C" means "reached C or better" (C, B, or A).
    return levelRank(currentLevel as Level) <= levelRank(minimum as Level);
  }
  // Health fields: A = weakest, E = strongest. Standard direction.
  return levelRank(currentLevel as Level) >= levelRank(minimum as Level);
}

function conditionSatisfied(condition: ClusterCondition, ctx: ResolutionContext): boolean {
  if (condition.kind === "construct") {
    const status = ctx.risk_answers[condition.construct];
    return status !== "UNPROVEN" && status !== undefined;
  }
  const currentLevel: AnswerLevel = isOwnerExposureField(condition.field)
    ? ctx.owner_exposure_level
    : ctx.health_answers[condition.field] ?? ctx.risk_answers[condition.field];
  return fieldMovementSatisfied(condition.field, currentLevel, condition.minimum_level);
}

export function checkResolution(rule: ResolutionRule, ctx: ResolutionContext): boolean {
  switch (rule.type) {
    case "FIELD_MOVEMENT": {
      const fieldId = rule.field!;
      const currentLevel: AnswerLevel = isOwnerExposureField(fieldId)
        ? ctx.owner_exposure_level
        : ctx.health_answers[fieldId] ?? ctx.risk_answers[fieldId];
      return fieldMovementSatisfied(fieldId, currentLevel, rule.minimum_level!);
    }
    case "CONSTRUCT_DEMONSTRATED": {
      const status = ctx.risk_answers[rule.construct!];
      return status !== "UNPROVEN" && status !== undefined;
    }
    case "CLUSTER_CLEARED":
      return rule.required_fields!.every((c) => conditionSatisfied(c, ctx));
    case "CATEGORY_THRESHOLD":
      return ctx.category_totals[rule.category!] < rule.threshold!;
    case "COUNT_THRESHOLD": {
      // CLU-08/09's counted_fields is a dynamic per-business set (however many
      // Critical Exposures, or saturated categories, are currently live) —
      // content.ts normalizes each to one of these two markers.
      const stillTriggering = rule.counted_fields?.includes("__SATURATED_CATEGORIES__")
        ? ctx.saturated_categories.length
        : ctx.critical_exposures.length;
      return stillTriggering < rule.count_threshold!;
    }
    default:
      return false;
  }
}

// On-demand: owner taps "Mark as delivered". NOT offered at all for
// CATEGORY_THRESHOLD or COUNT_THRESHOLD — neither has a single field to
// re-ask; both resolve only at the next periodic full reassessment.
export function confirmItem(item: ActionItem, ctx: ResolutionContext): ActionItem {
  if (item.resolution_rule.type === "CATEGORY_THRESHOLD" || item.resolution_rule.type === "COUNT_THRESHOLD") {
    throw new Error("confirm_item() is not offered for this resolution_rule.type — UI must not show the control at all");
  }
  if (checkResolution(item.resolution_rule, ctx)) {
    return { ...item, state: "resolved" };
  }
  return { ...item, state: "in_progress", owner_marked_delivered: true };
}

// Periodic: full reassessment sweeps every open/in_progress item, all types included.
export function periodicReassessment(items: ActionItem[], ctx: ResolutionContext): ActionItem[] {
  return items.map((item) => {
    if (item.state === "resolved") return item;
    if (checkResolution(item.resolution_rule, ctx)) return { ...item, state: "resolved" as const };
    return item;
  });
}

export function categorySaturationThreshold(category: string): number {
  return CATEGORY_SATURATION_THRESHOLD[category];
}

export { LEVEL_RANK };
