import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listTestEntries, listExperimentsForProject } from "@/lib/db";
import { createExperimentAction, completeExperimentAction, moveToRevenueAction } from "@/app/journey-actions";
import { computeWeakPoints } from "@/lib/journey/weak-point-engine";
import { hasPositiveSignal } from "@/lib/journey/test-signal";
import { EXPERIMENT_SUGGESTIONS, WEAK_POINT_LABEL } from "@/lib/journey/experiment-suggestions";
import { computeIncompleteExperiments } from "@/lib/journey/experiment-gate";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language: Language = await getLanguage();

  const testEntries = listTestEntries(id);
  const weakPoints = computeWeakPoints(testEntries);
  const experiments = listExperimentsForProject(id);
  const incomplete = computeIncompleteExperiments(experiments);
  const canMoveOn = incomplete.length === 0 && hasPositiveSignal(testEntries);

  return (
    <div>
      <Link href={`/my-path/projects/${id}/test`} className="mb-3 inline-block text-xs text-neutral-500">
        {t("experiment.backToTest", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{t("experiment.subtitle", language)}</p>

      {incomplete.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
          {incomplete.length} {t(incomplete.length > 1 ? "experiment.openPlural" : "experiment.openSingular", language)}
        </div>
      )}

      {weakPoints.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("experiment.weakPointsFound", language)}</p>
          {weakPoints.map((wp) => (
            <div key={wp} className="rounded-lg border border-neutral-200 bg-white p-3">
              <p className="text-xs font-semibold text-neutral-900">{WEAK_POINT_LABEL[wp][language]}</p>
              <div className="mt-2 space-y-2">
                {EXPERIMENT_SUGGESTIONS[wp].map((s, i) => (
                  <form key={i} action={createExperimentAction} className="rounded-md border border-neutral-100 p-2">
                    <input type="hidden" name="project_id" value={id} />
                    <input type="hidden" name="weak_point" value={wp} />
                    <input type="hidden" name="suggestion_key" value={`${wp}_${i}`} />
                    <input type="hidden" name="hypothesis" value={s[language]} />
                    <p className="text-[11px] text-neutral-700">{s[language]}</p>
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[10px] text-neutral-400">{t("experiment.startThis", language)}</summary>
                      <div className="mt-1.5 space-y-1.5">
                        <input name="intervention" placeholder={t("experiment.whatWillYouDo", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1 text-[10.5px]" />
                        <input name="decision_rule" placeholder={t("experiment.howWillYouKnow", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1 text-[10.5px]" />
                        <input name="decision_rule_reasoning" placeholder={t("experiment.whyThatRule", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1 text-[10.5px]" />
                        <button type="submit" className="rounded-md bg-neutral-900 px-2.5 py-1 text-[10.5px] font-semibold text-white">
                          {t("experiment.start", language)}
                        </button>
                      </div>
                    </details>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {experiments.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("experiment.yourExperiments", language)}</p>
          {experiments.map((e) => (
            <div key={e.id} className="rounded-lg border border-neutral-200 bg-white p-3">
              <p className="text-xs text-neutral-800">{e.hypothesis}</p>
              <p className="mt-0.5 text-[10.5px] text-neutral-400">
                {e.decision ? `${t("experiment.decision", language)} ${e.decision}` : t("experiment.notYetDecided", language)}
              </p>
              {!e.decision && (
                <form action={completeExperimentAction} className="mt-2 space-y-1.5">
                  <input type="hidden" name="project_id" value={id} />
                  <input type="hidden" name="id" value={e.id} />
                  <input name="what_happened" placeholder={t("experiment.whatHappened", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1 text-[10.5px]" />
                  <input name="interpretation" placeholder={t("experiment.interpretation", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1 text-[10.5px]" />
                  <input name="learning" placeholder={t("experiment.whatDidYouLearn", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1 text-[10.5px]" />
                  <div className="flex gap-1.5">
                    <select name="evidence_state" className="rounded-md border border-neutral-200 px-1.5 py-1 text-[10.5px]">
                      <option value="supported">{t("experiment.evidence.supported", language)}</option>
                      <option value="challenged">{t("experiment.evidence.challenged", language)}</option>
                      <option value="unclear">{t("experiment.evidence.unclear", language)}</option>
                    </select>
                    <select name="decision" className="rounded-md border border-neutral-200 px-1.5 py-1 text-[10.5px]">
                      <option value="continue">{t("experiment.decision.continue", language)}</option>
                      <option value="change">{t("experiment.decision.change", language)}</option>
                      <option value="stop">{t("experiment.decision.stop", language)}</option>
                    </select>
                    <button type="submit" className="rounded-md bg-neutral-900 px-2.5 py-1 text-[10.5px] font-semibold text-white">
                      {t("journey.save", language)}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-1.5">
        <Link href={`/my-path/projects/${id}/test`} className="rounded-md border border-neutral-300 py-2 text-center text-[11px] font-semibold text-neutral-700">
          {t("experiment.backToTestButton", language)}
        </Link>
        <form action={moveToRevenueAction}>
          <input type="hidden" name="project_id" value={id} />
          <button
            type="submit"
            disabled={!canMoveOn}
            className={`w-full rounded-md py-2 text-[11px] font-semibold ${canMoveOn ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-300"}`}
          >
            {t("experiment.moveToRevenue", language)}
          </button>
        </form>
      </div>
    </div>
  );
}
