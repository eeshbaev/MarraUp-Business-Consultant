"use client";

// My Path / Discover — one-question-per-screen questionnaire.
//
// Mobile-app note: deliberately built as a single full-height "screen" with
// a big tappable option list and a fixed bottom action bar — the same shape
// this flow will need in a native/React Native rebuild, so the interaction
// pattern (not just the styling) is meant to transfer directly. State lives
// entirely in this component; saveDiscoverStepAction persists after every
// screen so progress is never lost (autosave, not just at the end).

import { useMemo, useState, useTransition } from "react";
import type { Question } from "@/lib/discover/questions";
import { HARD_CONSTRAINT_OPTIONS, Q27_PROMPT, Q27_HELPER } from "@/lib/discover/questions-constraints";
import { questionFlow } from "@/lib/discover/answers";
import { saveDiscoverStepAction } from "@/app/discover-actions";
import type { Language } from "@/lib/types";

type RawAnswers = Record<string, string[]>;

export default function DiscoverQuestionnaire({
  language,
  initialAnswers,
}: {
  language: Language;
  initialAnswers: RawAnswers;
}) {
  const [answers, setAnswers] = useState<RawAnswers>(initialAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  // Flow is recomputed on every answer change so Q7/Q8 conditional
  // follow-ups appear/disappear immediately as the user answers.
  const flow = useMemo(() => questionFlow(answers), [answers]);
  const totalSteps = flow.length + 1; // +1 for the hard-constraints screen
  const isConstraintsStep = stepIndex >= flow.length;
  const current: Question | null = isConstraintsStep ? null : flow[stepIndex];

  const selected: string[] = current ? answers[current.id] ?? [] : answers.__hard_exclusions__ ?? [];

  function toggle(optionId: string) {
    if (!current) return;
    const max = current.maxSelect;
    setAnswers((prev) => {
      const prevSelected = prev[current.id] ?? [];
      let next: string[];
      if (current.type === "single") {
        next = [optionId];
      } else if (prevSelected.includes(optionId)) {
        next = prevSelected.filter((id) => id !== optionId);
      } else if (max && prevSelected.length >= max) {
        return prev; // at cap, ignore further taps until one is deselected
      } else {
        next = [...prevSelected, optionId];
      }
      return { ...prev, [current.id]: next };
    });
  }

  function toggleConstraint(sectorId: string) {
    setAnswers((prev) => {
      const prevList = prev.__hard_exclusions__ ?? [];
      const next = prevList.includes(sectorId) ? prevList.filter((s) => s !== sectorId) : [...prevList, sectorId];
      return { ...prev, __hard_exclusions__: next };
    });
  }

  function persist(completed: boolean) {
    startTransition(() => {
      saveDiscoverStepAction(JSON.stringify(answers), completed);
    });
  }

  function goNext() {
    persist(false);
    if (stepIndex + 1 >= totalSteps) {
      persist(true);
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  const canContinue = isConstraintsStep || selected.length > 0 || current?.type === "multi";
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <div className="mb-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-neutral-900 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          {stepIndex + 1} of {totalSteps}
        </p>
      </div>

      <div className="flex-1">
        {isConstraintsStep ? (
          <>
            <h1 className="text-lg font-semibold text-neutral-900">{Q27_PROMPT[language]}</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{Q27_HELPER[language]}</p>
            <div className="mt-5 max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
              {HARD_CONSTRAINT_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.sectorId}
                  label={opt.label[language]}
                  active={selected.includes(opt.sectorId)}
                  onClick={() => toggleConstraint(opt.sectorId)}
                />
              ))}
            </div>
          </>
        ) : current ? (
          <>
            <h1 className="text-lg font-semibold text-neutral-900">{current.prompt}</h1>
            {current.helper && <p className="mt-2 text-sm leading-relaxed text-neutral-600">{current.helper}</p>}
            <div className="mt-5 space-y-2">
              {current.options.map((opt) => (
                <OptionButton key={opt.id} label={opt.label} active={selected.includes(opt.id)} onClick={() => toggle(opt.id)} />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-neutral-200 bg-white pt-4">
        {stepIndex > 0 && (
          <button
            onClick={goBack}
            className="flex-none rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Back
          </button>
        )}
        <button
          onClick={goNext}
          disabled={pending}
          className="flex-1 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {stepIndex + 1 >= totalSteps ? "See my directions" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function OptionButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
      }`}
    >
      {label}
    </button>
  );
}
