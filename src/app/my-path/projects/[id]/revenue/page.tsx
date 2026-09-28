import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getCurrentCycle, getPreviousCycle } from "@/lib/db";
import { updateCycleFieldsAction, closeCycleAction } from "@/app/journey-actions";
import { daysIntoCycle, isCycleDue } from "@/lib/journey/revenue-cycle";
import { summarizeCycle } from "@/lib/journey/revenue-interpretation";
import { getLanguage } from "@/lib/language";
import { t, tf } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const NUM_FIELDS: { key: string; labelKey: string }[] = [
  { key: "money_invested", labelKey: "revenue.field.moneyInvested" },
  { key: "revenue", labelKey: "revenue.revenue" },
  { key: "expenses", labelKey: "revenue.field.expenses" },
  { key: "new_customers", labelKey: "revenue.field.newCustomers" },
  { key: "total_customers", labelKey: "revenue.field.totalCustomers" },
  { key: "repeat_customers", labelKey: "revenue.field.repeatCustomers" },
  { key: "sales_count", labelKey: "revenue.field.salesCount" },
  { key: "avg_sale_value", labelKey: "revenue.field.avgSaleValue" },
];

export default async function RevenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language: Language = await getLanguage();

  const cycle = getCurrentCycle(id);
  const previous = getPreviousCycle(id, cycle.cycle_number);
  const day = Math.round(daysIntoCycle(cycle));
  const due = isCycleDue(cycle);
  const netCash = (cycle.revenue ?? 0) - (cycle.expenses ?? 0);
  const summary = summarizeCycle(cycle, previous, language);

  return (
    <div>
      <Link href="/my-path" className="mb-3 inline-block text-xs text-neutral-500">
        {t("journey.backToMyPath", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{tf("revenue.day", language, { day })}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <div className="text-[10px] text-neutral-400">{t("revenue.revenue", language)}</div>
          <div className="text-sm font-semibold text-neutral-900">{cycle.revenue ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <div className="text-[10px] text-neutral-400">{t("revenue.netCash", language)}</div>
          <div className="text-sm font-semibold text-neutral-900">{netCash}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <div className="text-[10px] text-neutral-400">{t("revenue.customers", language)}</div>
          <div className="text-sm font-semibold text-neutral-900">
            {cycle.total_customers ?? "—"} · {cycle.repeat_customers ?? 0} {t("revenue.repeat", language)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <div className="text-[10px] text-neutral-400">{t("revenue.cycle", language)}</div>
          <div className="text-sm font-semibold text-neutral-900">#{cycle.cycle_number}</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        {summary.map((line, i) => (
          <p key={i} className="text-[11px] leading-relaxed text-neutral-700">
            {line}
          </p>
        ))}
      </div>

      <details className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-neutral-800">{t("revenue.editCycle", language)}</summary>
        <form action={updateCycleFieldsAction} className="mt-2.5 space-y-2">
          <input type="hidden" name="project_id" value={id} />
          <input type="hidden" name="cycle_id" value={cycle.id} />
          {NUM_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-2">
              <label className="text-[11px] text-neutral-600">{t(f.labelKey, language)}</label>
              <input
                type="number"
                name={f.key}
                step="any"
                defaultValue={(cycle as unknown as Record<string, number | null>)[f.key] ?? ""}
                className="w-24 rounded-md border border-neutral-200 px-2 py-1 text-right text-xs"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-[11px] text-neutral-600">{t("revenue.recurringCommitments", language)}</label>
            <textarea name="recurring_commitments" defaultValue={cycle.recurring_commitments ?? ""} rows={2} className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-neutral-600">{t("revenue.notes", language)}</label>
            <textarea name="notes" defaultValue={cycle.notes ?? ""} rows={2} className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
          </div>
          <button type="submit" className="w-full rounded-md bg-neutral-900 py-2 text-xs font-semibold text-white">
            {t("revenue.saveCycle", language)}
          </button>
        </form>
      </details>

      {due && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold text-neutral-800">{t("revenue.day30Review", language)}</p>
          <form action={closeCycleAction} className="mt-2 space-y-1.5">
            <input type="hidden" name="project_id" value={id} />
            <input type="hidden" name="cycle_id" value={cycle.id} />
            <input name="review_what_happened" placeholder={t("experiment.whatHappened", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
            <input name="review_what_changed" placeholder={t("revenue.whatChanged", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
            <input name="review_needs_attention" placeholder={t("revenue.needsAttention", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
            <input name="review_next_step" placeholder={t("revenue.nextStep", language)} className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
            <button type="submit" className="w-full rounded-md bg-neutral-900 py-2 text-xs font-semibold text-white">
              {t("revenue.closeCycle", language)}
            </button>
          </form>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link href={`/my-path/projects/${id}/experiment`} className="flex-1 rounded-md border border-neutral-300 py-2 text-center text-[11px] font-semibold text-neutral-700">
          {t("revenue.investigateInExperiment", language)}
        </Link>
        <Link href={`/my-path/projects/${id}/stable`} className="flex-1 rounded-md border border-neutral-300 py-2 text-center text-[11px] font-semibold text-neutral-700">
          {t("revenue.viewAsStable", language)}
        </Link>
      </div>
    </div>
  );
}
