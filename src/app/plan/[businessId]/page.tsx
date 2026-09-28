import Link from "next/link";
import { getBusiness, getLatestAssessment, getPlanByAssessment, listDeliveryEvidenceForItem } from "@/lib/db";
import { HEALTH_QUESTIONS, RISK_FIELDS, OWNER_EXPOSURE } from "@/lib/content";
import { confirmActionItemAction } from "@/app/actions";
import { notFound } from "next/navigation";
import type { Level, Language } from "@/lib/types";
import FlowPage from "@/components/FlowPage";
import { getLanguage } from "@/lib/language";
import { getText, getHealthQuestionLevelText } from "@/lib/localization";
import { getDimensionName, LOCALE_BY_LANGUAGE } from "@/lib/ui-copy";

const LEVELS: Level[] = ["A", "B", "C", "D", "E"];
const PRIORITY_STYLE: Record<string, string> = {
  "Very High": "bg-red-100 text-red-800",
  High: "bg-amber-100 text-amber-800",
  Medium: "bg-blue-100 text-blue-800",
};

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ resolvedItem?: string; itemState?: string; healthFrom?: string; healthTo?: string; riskFrom?: string; riskTo?: string }>;
}) {
  const { businessId } = await params;
  const business = getBusiness(businessId);
  const assessment = getLatestAssessment(businessId);
  if (!business || !assessment) notFound();
  const plan = getPlanByAssessment(assessment.id);
  if (!plan) notFound();

  const language = await getLanguage();
  const totalOther = Object.values(plan.other_actions_counts).reduce((s, n) => s + n, 0);
  const resolvedCount = plan.action_plan.filter((i) => i.state === "resolved").length;
  const CYCLE_LENGTH_DAYS = 120;
  const cycleDue = Date.now() - new Date(plan.cycle_started_at).getTime() >= CYCLE_LENGTH_DAYS * 24 * 60 * 60 * 1000;

  // Active-plan guidance rule (Business Evaluation Lifecycle v1.0): while a
  // plan is active, always surface ONE obvious next action rather than
  // leaving the owner to scan five items and guess — action_plan is already
  // in priority order, so the first unresolved item is exactly that.
  const nextItem = plan.action_plan.find((i) => i.state !== "resolved") ?? null;

  const sp = await searchParams;
  const justConfirmed = sp.resolvedItem ? plan.action_plan.find((i) => i.id === sp.resolvedItem) : null;
  const healthFrom = sp.healthFrom ? Number(sp.healthFrom) : null;
  const healthTo = sp.healthTo ? Number(sp.healthTo) : null;
  const riskFrom = sp.riskFrom ? Number(sp.riskFrom) : null;
  const riskTo = sp.riskTo ? Number(sp.riskTo) : null;

  return (
    <FlowPage>
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Action Plan — {business.name}</h1>
        <p className="text-sm text-neutral-600">
          The {plan.action_plan.length} most important things to work on right now, one per area of the business, not just
          the {plan.action_plan.length} most severe overall.
        </p>
        <p className="mt-2 text-sm font-medium text-neutral-700">
          {resolvedCount} of {plan.action_plan.length} resolved since this plan started ({new Date(plan.cycle_started_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])}).
        </p>
      </div>

      {nextItem && (
        <div className="rounded-lg border border-neutral-900 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your next step</div>
          <p className="mt-1 text-sm text-neutral-800">
            {plan.action_plan.length - resolvedCount} priorit{plan.action_plan.length - resolvedCount === 1 ? "y" : "ies"} remain
            {plan.action_plan.length - resolvedCount === 1 ? "s" : ""}. Next: {getText(nextItem.content_id, "title", language)}.
          </p>
          <a href={`#item-${nextItem.id}`} className="mt-2 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2">
            Go to this priority
          </a>
        </div>
      )}

      {justConfirmed && healthFrom !== null && healthTo !== null && riskFrom !== null && riskTo !== null && (
        <div
          className={`rounded-md border p-4 text-sm ${
            sp.itemState === "resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-neutral-200 bg-neutral-50 text-neutral-800"
          }`}
        >
          <p className="font-medium">
            {sp.itemState === "resolved"
              ? `You just resolved "${getText(justConfirmed.content_id, "title", language)}."`
              : `Progress recorded on "${getText(justConfirmed.content_id, "title", language)}" — not yet resolved, but noted.`}
          </p>
          <p className="mt-1 text-xs">
            Your assessed health changed {healthFrom} → {healthTo} and assessed risk exposure changed {riskFrom} → {riskTo}, based
            on your latest answers.
          </p>
          <p className="mt-1 text-xs text-neutral-500">This reflects your updated assessment — not a measurement of what actually changed in the business.</p>
        </div>
      )}

      {/* Edge case named explicitly in Business Evaluation Lifecycle v1.0:
          the 120-day interval can arrive while the plan is still incomplete.
          That doesn't make the unresolved work irrelevant — both realities
          are shown together, and the owner decides whether to continue the
          plan, reassess, or both (the owner-decision principle). */}
      {cycleDue && resolvedCount < plan.action_plan.length && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Your reassessment window is now due.</p>
          <p className="mt-1 text-amber-800">
            You still have {plan.action_plan.length - resolvedCount} unresolved priorit
            {plan.action_plan.length - resolvedCount === 1 ? "y" : "ies"} from this plan — reassessing doesn&apos;t make that work
            disappear. Continue this plan, reassess now, or both; it&apos;s your call.
          </p>
        </div>
      )}

      {resolvedCount === plan.action_plan.length && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-800">
          <p className="font-medium">Plan completed — every item in this plan has been resolved.</p>
          <p className="mt-1 text-neutral-600">
            {cycleDue
              ? "Your reassessment window is now due."
              : "Your next step is to reassess your business when you're ready — a new assessment can show what has changed since this plan began."}
          </p>
        </div>
      )}

      <div className="space-y-5">
        {plan.action_plan.map((item, idx) => (
          <div
            key={item.id}
            id={`item-${item.id}`}
            className={`rounded-lg border bg-white p-5 space-y-3 ${
              nextItem?.id === item.id ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLE[item.priority_level]}`}>
                  {item.priority_level}
                </span>
                {nextItem?.id === item.id && (
                  <span className="inline-block rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white">Next</span>
                )}
              </div>
              <span className="text-xs text-neutral-400">#{idx + 1} · {getDimensionName(item.dimension, language)}</span>
            </div>
            <h2 className="text-base font-medium">{getText(item.content_id, "title", language)}</h2>
            <div className="space-y-2 text-sm text-neutral-700">
              <p><span className="font-medium text-neutral-500">Finding: </span>{getText(item.content_id, "finding", language)}</p>
              <p><span className="font-medium text-neutral-500">Why it matters: </span>{getText(item.content_id, "consequence", language)}</p>
              <p><span className="font-medium text-neutral-500">Next action: </span>{getText(item.content_id, "action", language)}</p>
              {item.content.avoid && (
                <p><span className="font-medium text-neutral-500">Avoid: </span>{getText(item.content_id, "avoid", language)}</p>
              )}
            </div>

            <DeliveryEvidenceView businessId={businessId} itemId={item.id} language={language} />

            {item.state === "resolved" ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Resolved.</div>
            ) : item.resolution_rule.type === "CATEGORY_THRESHOLD" || item.resolution_rule.type === "COUNT_THRESHOLD" ? (
              <p className="text-xs text-neutral-500">
                This resolves at your next full reassessment — it depends on several fields together, not one you can confirm on its own.
              </p>
            ) : (
              <ConfirmForm businessId={businessId} assessmentId={assessment.id} item={item} language={language} />
            )}
          </div>
        ))}
      </div>

      <Link href={`/reassess/${businessId}`} className="inline-block text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-800">
        Reassess this business
      </Link>

      {totalOther > 0 && (
        <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          <div className="font-medium text-neutral-500 text-xs uppercase tracking-wide mb-2">Other Actions</div>
          <div className="flex gap-4">
            {Object.entries(plan.other_actions_counts)
              .filter(([, n]) => n > 0)
              .map(([level, n]) => (
                <span key={level}>
                  {n} {level}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
    </FlowPage>
  );
}

// Addendum A (Business Evaluation Lifecycle v1.0): shows the owner's own
// past delivery notes/photos for this item — their own memory of what they
// actually did. Never analyzed, verified, or scored by MarraUp.
function DeliveryEvidenceView({ businessId, itemId, language }: { businessId: string; itemId: string; language: Language }) {
  const evidence = listDeliveryEvidenceForItem(businessId, itemId);
  if (evidence.length === 0) return null;
  return (
    <div className="space-y-2 border-t border-neutral-100 pt-3">
      <p className="text-xs font-medium text-neutral-500">Your delivery notes</p>
      {evidence.map((e) => (
        <div key={e.id} className="rounded-md bg-neutral-50 p-2.5 text-sm text-neutral-700">
          {e.note && <p>{e.note}</p>}
          {e.photo_data_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.photo_data_url} alt="Delivery photo" className="mt-2 max-h-40 rounded-md border border-neutral-200" />
          )}
          <p className="mt-1 text-xs text-neutral-400">{new Date(e.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])}</p>
        </div>
      ))}
    </div>
  );
}

function fieldInfo(
  fieldId: string,
  stage: { revenue_status: "PRE_REVENUE" | "REVENUE_GENERATING"; evidence_maturity: "EMERGING" | "ESTABLISHED" },
  language: Language
) {
  const hq = HEALTH_QUESTIONS.find((q) => q.question_id === fieldId);
  if (hq) {
    return {
      text: getText(hq.question_id, "text", language),
      levelText: (lvl: Level) => getHealthQuestionLevelText(hq, lvl, language, stage),
    };
  }
  const rf = RISK_FIELDS.find((f) => f.field_id === fieldId);
  if (rf) {
    return {
      text: getText(rf.field_id, "text", language),
      levelText: (lvl: Level) => getText(rf.field_id, `level_${lvl}`, language),
    };
  }
  if (fieldId === "OWN-01") {
    return { text: getText(OWNER_EXPOSURE.field_id, "text", language), levelText: null };
  }
  return null;
}

async function ConfirmForm({
  businessId,
  assessmentId,
  item,
  language,
}: {
  businessId: string;
  assessmentId: string;
  item: import("@/lib/types").ActionItem;
  language: Language;
}) {
  const assessment = getLatestAssessment(businessId)!;
  const fields: { id: string; text: string; levelText: ((lvl: Level) => string) | null }[] = [];
  for (const f of item.source_fields) {
    const info = fieldInfo(f, assessment.stage, language);
    if (info) fields.push({ id: f, text: info.text, levelText: info.levelText });
  }

  return (
    <form action={confirmActionItemAction} encType="multipart/form-data" className="space-y-3 border-t border-neutral-100 pt-3">
      <input type="hidden" name="business_id" value={businessId} />
      <input type="hidden" name="assessment_id" value={assessmentId} />
      <input type="hidden" name="item_id" value={item.id} />
      <p className="text-xs font-medium text-neutral-500">{getText(item.content_id, "assessment_evidence", language)}</p>
      {fields.map((f) => (
        <fieldset key={f.id} className="space-y-1.5">
          <legend className="text-sm text-neutral-800">{f.text}</legend>
          {f.id === "OWN-01" ? (
            <select name={`answer__${f.id}`} className="rounded-md border border-neutral-300 px-2 py-1 text-sm">
              {(["1", "2", "3", "4", "5"] as const).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {getText(OWNER_EXPOSURE.field_id, `level_${lvl}`, language)}
                </option>
              ))}
            </select>
          ) : (
            <select name={`answer__${f.id}`} className="rounded-md border border-neutral-300 px-2 py-1 text-sm">
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {f.levelText!(lvl)}
                </option>
              ))}
            </select>
          )}
        </fieldset>
      ))}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-500">Add a note for yourself (optional)</label>
        <textarea name="note" rows={2} placeholder="What did you actually do?" className="block w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-500">Add a photo (optional)</label>
        <input type="file" name="photo" accept="image/*" className="block w-full text-xs text-neutral-600" />
      </div>
      <p className="text-xs text-neutral-400">This is your own record — it doesn&apos;t resolve the item. Re-answering above does.</p>
      <button type="submit" className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700">
        Mark as delivered
      </button>
    </form>
  );
}
