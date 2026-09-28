import { getBusiness, getLatestAssessment, listAssessments, getLatestPlan, getPlanByAssessment } from "@/lib/db";
import { scoreHealth } from "@/lib/scoring/health";
import { scoreRisk } from "@/lib/scoring/risk";
import { notFound } from "next/navigation";
import Link from "next/link";
import FlowPage from "@/components/FlowPage";
import { getLanguage } from "@/lib/language";
import { t, getDimensionName, LOCALE_BY_LANGUAGE } from "@/lib/ui-copy";

export default async function ResultsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = getBusiness(businessId);
  const assessment = getLatestAssessment(businessId);
  if (!business || !assessment) notFound();

  const language = await getLanguage();
  const health = scoreHealth(assessment.health_answers, assessment.stage);
  const risk = scoreRisk(assessment.risk_answers);

  // Real history, not a guess: every assessment for this business, in order.
  // If there's more than one, the one before the current one is what "since
  // last time" is measured against — computed here, never fabricated.
  const history = listAssessments(businessId);
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const healthDelta = previous ? Math.round((health.total - previous.business_health_score) * 10) / 10 : null;
  const riskDelta = previous ? Math.round((risk.total - previous.risk_exposure_score) * 10) / 10 : null;
  const exposuresResolved = previous ? previous.critical_exposures.filter((e) => !assessment.critical_exposures.includes(e)) : [];
  const exposuresNew = previous ? assessment.critical_exposures.filter((e) => !previous.critical_exposures.includes(e)) : [];
  const currentPlan = getLatestPlan(businessId);

  return (
    <FlowPage>
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{business.name}</h1>
        <p className="text-sm text-neutral-600">
          {business.sector} · assessed {new Date(assessment.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])}
        </p>
      </div>

      {previous && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Since your last assessment ({new Date(previous.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])})
          </div>
          {/* Findings first, score second (Lifecycle v1.0 Section 9) — the
              score gives orientation, the findings explain the business. */}
          {(exposuresResolved.length > 0 || exposuresNew.length > 0) && (
            <div className="mt-2 space-y-1 text-sm">
              {exposuresResolved.length > 0 && (
                <p className="text-emerald-700">
                  {exposuresResolved.length} critical exposure{exposuresResolved.length > 1 ? "s" : ""} no longer at the severe level: {exposuresResolved.join(", ")}
                </p>
              )}
              {exposuresNew.length > 0 && (
                <p className="text-red-700">
                  {exposuresNew.length} new critical exposure{exposuresNew.length > 1 ? "s" : ""} since last time: {exposuresNew.join(", ")}
                </p>
              )}
            </div>
          )}
          {healthDelta === 0 && riskDelta === 0 && exposuresResolved.length === 0 && exposuresNew.length === 0 && (
            <p className="mt-2 text-sm text-neutral-500">No measurable movement since last time — that&apos;s honest information too.</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <DeltaLine label="Assessed health" from={previous.business_health_score} to={health.total} delta={healthDelta!} goodDirection="up" />
            <DeltaLine label="Assessed risk exposure" from={previous.risk_exposure_score} to={risk.total} delta={riskDelta!} goodDirection="down" />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            These numbers describe how your assessment answers changed — not a measurement of what actually changed in the business.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <ScoreCard label={t("results.health", language)} value={health.total} suffix="/ 100" tone="good" />
        <ScoreCard label={t("results.risk", language)} value={risk.total} suffix="/ 100" tone="bad" />
      </div>

      {(assessment.critical_exposures.length > 0 || assessment.undemonstrated_constructs.length > 0) && (
        <div className="space-y-3">
          {assessment.critical_exposures.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-medium text-red-900">{t("results.criticalExposures", language)}</div>
              <div className="mt-1 text-sm text-red-800">
                {assessment.critical_exposures.length} exposure{assessment.critical_exposures.length > 1 ? "s" : ""} severe
                enough to end the business as it stands: {assessment.critical_exposures.join(", ")}
              </div>
            </div>
          )}
          {assessment.undemonstrated_constructs.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-900">{t("results.notYetDemonstrated", language)}</div>
              <div className="mt-1 text-sm text-amber-800">
                {assessment.undemonstrated_constructs.join(", ")} — not yet measurable at this stage, not a favorable score.
              </div>
            </div>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">{t("results.healthByDimension", language)}</h2>
        <div className="space-y-2">
          {health.byDimension.map((d) => (
            <Bar key={d.dimension} label={getDimensionName(d.dimension, language)} points={d.points} max={d.max} tone="good" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">{t("results.riskByCategory", language)}</h2>
        <div className="space-y-2">
          {risk.byCategory.map((c) => (
            <div key={c.category}>
              <Bar label={getDimensionName(c.category, language)} points={c.points} max={c.max} tone="bad" />
              {c.saturated && <div className="mt-0.5 text-xs text-amber-700">{t("results.saturated", language)}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">{t("results.ownerExposure", language)}</h2>
        <p className="text-sm text-neutral-700">
          Level {assessment.owner_exposure_level} of 5 — not scored toward either number above.
        </p>
      </section>

      {history.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Business history</h2>
          <p className="text-xs text-neutral-500">
            An assessment is a snapshot. This is the history — every assessment stays on the record, nothing is overwritten.
          </p>
          <div className="space-y-3">
            {history.map((a, i) => {
              const prior = i > 0 ? history[i - 1] : null;
              const plan = getPlanByAssessment(a.id);
              const resolvedSincePlan = plan ? plan.action_plan.filter((it) => it.state === "resolved").length : null;
              const resolvedExposures = prior ? prior.critical_exposures.filter((e) => !a.critical_exposures.includes(e)) : [];
              const newExposures = prior ? a.critical_exposures.filter((e) => !prior.critical_exposures.includes(e)) : [];
              return (
                <div key={a.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{new Date(a.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])}</span>
                    <span className="text-xs text-neutral-500">
                      Health {a.business_health_score} · Risk {a.risk_exposure_score}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-neutral-600">
                    {resolvedExposures.length > 0 && (
                      <p className="text-emerald-700">{resolvedExposures.length} exposure{resolvedExposures.length > 1 ? "s" : ""} resolved since prior assessment</p>
                    )}
                    {newExposures.length > 0 && (
                      <p className="text-red-700">{newExposures.length} new exposure{newExposures.length > 1 ? "s" : ""} identified</p>
                    )}
                    {plan && resolvedSincePlan !== null && (
                      <p>
                        {resolvedSincePlan} of {plan.action_plan.length} action items from this assessment&apos;s plan resolved
                      </p>
                    )}
                    {!prior && <p>First assessment on record.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {currentPlan && (
        <p className="text-sm text-neutral-600">
          {currentPlan.action_plan.filter((i) => i.state === "resolved").length} of {currentPlan.action_plan.length} action items
          resolved since this plan started ({new Date(currentPlan.cycle_started_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])}).
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/plan/${businessId}`}
          className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {t("results.viewPlan", language)}
        </Link>
        <Link
          href={`/reassess/${businessId}`}
          className="inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-500"
        >
          Reassess this business
        </Link>
      </div>
    </div>
    </FlowPage>
  );
}

// goodDirection: for Health, up is good; for Risk, down is good — the sign
// of a plain number delta can't say that on its own, so the color follows
// this rather than the raw sign.
function DeltaLine({
  label,
  from,
  to,
  delta,
  goodDirection,
}: {
  label: string;
  from: number;
  to: number;
  delta: number;
  goodDirection: "up" | "down";
}) {
  const isGood = goodDirection === "up" ? delta > 0 : delta < 0;
  const isFlat = delta === 0;
  const color = isFlat ? "text-neutral-500" : isGood ? "text-emerald-700" : "text-red-700";
  const sign = delta > 0 ? "+" : "";
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${color}`}>
        {from} → {to} ({sign}
        {delta})
      </div>
    </div>
  );
}

function ScoreCard({ label, value, suffix, tone }: { label: string; value: number; suffix: string; tone: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${tone === "good" ? "text-emerald-700" : "text-red-700"}`}>
        {value} <span className="text-base font-normal text-neutral-400">{suffix}</span>
      </div>
    </div>
  );
}

function Bar({ label, points, max, tone }: { label: string; points: number; max: number; tone: "good" | "bad" }) {
  const pct = max > 0 ? Math.min(100, (points / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-600">
        <span>{label}</span>
        <span>
          {points} / {max}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-neutral-100">
        <div
          className={`h-2 rounded-full ${tone === "good" ? "bg-emerald-600" : "bg-red-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
