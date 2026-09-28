import { questionFlow, type RawAnswers } from "./answers";

/** First unanswered step in the dynamic flow (+ constraints as the last step). */
export function discoverResumeStepIndex(answers: RawAnswers): number {
  const flow = questionFlow(answers);
  for (let i = 0; i < flow.length; i++) {
    if (!(answers[flow[i].id]?.length > 0)) return i;
  }
  return flow.length;
}

export function hasDiscoverProgress(answers: RawAnswers): boolean {
  return Object.keys(answers).some((key) => (answers[key]?.length ?? 0) > 0);
}
