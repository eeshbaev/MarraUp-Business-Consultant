// Business Health scoring — direct addition, 45 questions, 100 points, 9 dimensions.

import type { Level, Stage } from "../types";
import { HEALTH_QUESTIONS, levelsForQuestion } from "../content";

export interface HealthDimensionScore {
  dimension: string;
  points: number;
  max: number;
}

type StageSwitches = Pick<Stage, "revenue_status" | "evidence_maturity">;

export function scoreHealth(
  answers: Record<string, Level>,
  stage: StageSwitches
): { total: number; byDimension: HealthDimensionScore[] } {
  const totals = new Map<string, { points: number; max: number }>();

  for (const q of HEALTH_QUESTIONS) {
    const levels = levelsForQuestion(q, stage);
    const answer = answers[q.question_id];
    const points = answer ? levels[answer].points : 0;
    const entry = totals.get(q.dimension) ?? { points: 0, max: 0 };
    entry.points += points;
    entry.max += q.weight;
    totals.set(q.dimension, entry);
  }

  const byDimension = Array.from(totals.entries()).map(([dimension, v]) => ({
    dimension,
    points: round2(v.points),
    max: v.max,
  }));
  const total = round2(byDimension.reduce((sum, d) => sum + d.points, 0));
  return { total, byDimension };
}

export function pointsEarnedForHealthField(fieldId: string, level: Level, stage: StageSwitches): number {
  const q = HEALTH_QUESTIONS.find((x) => x.question_id === fieldId);
  if (!q) return 0;
  const levels = levelsForQuestion(q, stage);
  return levels[level]?.points ?? 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
