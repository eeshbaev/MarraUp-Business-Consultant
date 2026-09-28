import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listTestEntries, listCustomerMilestoneEvents, TEST_QUESTIONS, type TestQuestion } from "@/lib/db";
import { setTestSetupAction, addTestEntryAction, addCustomerMilestoneAction, returnToFindAction, archiveProjectAction } from "@/app/journey-actions";
import { BUSINESS_MODEL_TYPES, INDICATOR_EXAMPLES, type BusinessModelType } from "@/lib/journey/business-model-profiles";
import { summarizeTestEntries, hasPositiveSignal } from "@/lib/journey/test-signal";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const QUESTION_KEY: Record<TestQuestion, string> = {
  reach: "test.question.reach",
  interest: "test.question.interest",
  usage: "test.question.usage",
  response: "test.question.response",
  economics: "test.question.economics",
};

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language: Language = await getLanguage();

  const hasSetup = !!project.business_model_type;

  if (!hasSetup) {
    return (
      <div>
        <Link href="/my-path" className="mb-3 inline-block text-xs text-neutral-500">
          {t("journey.backToMyPath", language)}
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">{t("test.setupTitle", language)}</h1>
        <form action={setTestSetupAction} className="mt-4 space-y-3">
          <input type="hidden" name="project_id" value={id} />
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("test.whatTesting", language)}</label>
            <input name="test_offering" className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("test.whoWith", language)}</label>
            <input name="test_customer" className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("test.price", language)}</label>
            <input name="test_price" className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("test.channel", language)}</label>
            <input name="test_channel" className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("test.businessType", language)}</label>
            <select name="business_model_type" className="w-full rounded-md border border-neutral-200 p-2 text-xs">
              {BUSINESS_MODEL_TYPES.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label[language]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full rounded-md bg-neutral-900 py-2.5 text-xs font-semibold text-white">
            {t("test.startTesting", language)}
          </button>
        </form>
      </div>
    );
  }

  const entries = listTestEntries(id);
  const milestones = listCustomerMilestoneEvents(id);
  const summary = summarizeTestEntries(entries);
  const hasMilestone = (mt: string) => milestones.some((m) => m.event_type === mt);
  const bmType = project.business_model_type as BusinessModelType;
  const indicators = INDICATOR_EXAMPLES[bmType] ?? INDICATOR_EXAMPLES.other;

  return (
    <div>
      <Link href="/my-path" className="mb-3 inline-block text-xs text-neutral-500">
        {t("journey.backToMyPath", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{t("test.subtitle", language)}</p>

      <div className="mt-3 flex gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasMilestone("customer") ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
          🎯 {t("test.milestone.customer", language)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasMilestone("payment") ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
          💰 {t("test.milestone.payment", language)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasMilestone("repeat") ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
          🔁 {t("test.milestone.repeat", language)}
        </span>
      </div>
      <form action={addCustomerMilestoneAction} className="mt-2 flex gap-1.5">
        <input type="hidden" name="project_id" value={id} />
        <select name="event_type" className="rounded-md border border-neutral-200 px-2 py-1 text-[10px]">
          <option value="customer">{t("test.markFirstCustomer", language)}</option>
          <option value="payment">{t("test.markFirstPayment", language)}</option>
          <option value="repeat">{t("test.markFirstRepeat", language)}</option>
        </select>
        <button type="submit" className="rounded-md border border-neutral-300 px-2 py-1 text-[10px] font-semibold text-neutral-700">
          {t("test.log", language)}
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {TEST_QUESTIONS.map((q) => (
          <details key={q} className="rounded-lg border border-neutral-200 bg-white p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="text-xs font-medium text-neutral-900">{t(QUESTION_KEY[q], language)}</span>
              <span className="text-[10px] text-neutral-400">
                {summary.positiveByQuestion[q]}/{summary.totalByQuestion[q]} {t("test.yes", language)}
              </span>
            </summary>
            <p className="mt-1.5 text-[10.5px] text-neutral-500">
              {q === "reach"
                ? indicators.reach[language]
                : q === "interest"
                  ? indicators.interest[language]
                  : q === "usage"
                    ? indicators.usage[language]
                    : q === "response"
                      ? t("test.responseEconomicsExamples", language)
                      : t("test.priceEconomicsExamples", language)}
            </p>
            <form action={addTestEntryAction} className="mt-2 space-y-1.5">
              <input type="hidden" name="project_id" value={id} />
              <input type="hidden" name="question" value={q} />
              <input name="body" placeholder={t("test.logObservation", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10.5px] text-neutral-500">
                  <input type="checkbox" name="is_positive" /> {t("test.countsAsYes", language)}
                </label>
                <button type="submit" className="rounded-md border border-neutral-300 px-2.5 py-1 text-[10.5px] font-semibold text-neutral-700">
                  {t("journey.add", language)}
                </button>
              </div>
            </form>
            {entries.filter((e) => e.question === q).length > 0 && (
              <ul className="mt-2 space-y-1">
                {entries
                  .filter((e) => e.question === q)
                  .slice(0, 4)
                  .map((e) => (
                    <li key={e.id} className="rounded bg-neutral-50 p-1.5 text-[10.5px] text-neutral-700">
                      {e.is_positive ? "✓ " : ""}
                      {e.body}
                    </li>
                  ))}
              </ul>
            )}
          </details>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-800">
          {summary.totalEntries} {t("test.observationsLogged", language)}
        </p>
        <p className="mt-1 text-[11px] text-neutral-500">
          {hasPositiveSignal(entries) ? t("test.positiveSignal", language) : t("test.noPositiveSignal", language)}
        </p>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {hasPositiveSignal(entries) ? (
            <Link
              href={`/my-path/projects/${id}/experiment`}
              className="block w-full rounded-md bg-neutral-900 py-2 text-center text-[11px] font-semibold text-white"
            >
              {t("test.runExperiment", language)}
            </Link>
          ) : (
            <button disabled className="rounded-md border border-neutral-200 py-2 text-[11px] font-semibold text-neutral-300">
              {t("test.runExperimentDisabled", language)}
            </button>
          )}
          <form action={returnToFindAction}>
            <input type="hidden" name="project_id" value={id} />
            <button type="submit" className="w-full rounded-md border border-neutral-300 py-2 text-[11px] font-semibold text-neutral-700">
              {t("test.backToFind", language)}
            </button>
          </form>
          <form action={archiveProjectAction}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="w-full rounded-md border border-neutral-200 py-2 text-[11px] font-semibold text-neutral-400">
              {t("test.archive", language)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
