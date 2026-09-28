import { getBusiness, getDraftIntake } from "@/lib/db";
import { HEALTH_DIMENSIONS, HEALTH_QUESTIONS, RISK_CATEGORIES, RISK_FIELDS, OWNER_EXPOSURE } from "@/lib/content";
import { deriveStage, isUnproven, isProspectiveA } from "@/lib/intake";
import { CONCENTRATION_CONSTRUCT_IDS } from "@/lib/fields";
import { submitAssessmentAction } from "@/app/actions";
import { notFound } from "next/navigation";
import type { Level } from "@/lib/types";
import FlowPage from "@/components/FlowPage";
import { getLanguage } from "@/lib/language";
import { getText, getHealthQuestionLevelText } from "@/lib/localization";
import { getDimensionName } from "@/lib/ui-copy";

const LEVELS: Level[] = ["A", "B", "C", "D", "E"];

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ reassess?: string }>;
}) {
  const { businessId } = await params;
  const business = getBusiness(businessId);
  const intake = getDraftIntake(businessId);
  if (!business || !intake) notFound();

  const language = await getLanguage();
  const stage = deriveStage(intake.customer_payment_status);
  const { reassess } = await searchParams;
  const heading = reassess ? `Reassessment — ${business.name}` : `Assessment — ${business.name}`;

  return (
    <FlowPage>
    <form action={submitAssessmentAction} className="space-y-12">
      <input type="hidden" name="business_id" value={businessId} />

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-sm text-neutral-600">
          Based on your answers, this assessment uses the <strong>{stage.stage_label.replace("_", " ").toLowerCase()}</strong>{" "}
          evidence standard. This affects what evidence is expected at each level — not how well you can score. Every
          business can reach the top of every question.
        </p>
      </div>

      {HEALTH_DIMENSIONS.map(({ dimension }) => (
        <section key={dimension} className="space-y-6 border-t border-neutral-200 pt-8">
          <h2 className="text-lg font-medium">{getDimensionName(dimension, language)}</h2>
          {HEALTH_QUESTIONS.filter((q) => q.dimension === dimension).map((q) => {
            return (
              <fieldset key={q.question_id} className="space-y-2">
                <legend className="text-sm font-medium text-neutral-800">{getText(q.question_id, "text", language)}</legend>
                <div className="space-y-1.5">
                  {LEVELS.map((lvl) => (
                    <label key={lvl} className="flex gap-2 text-sm text-neutral-700">
                      <input type="radio" name={`health__${q.question_id}`} value={lvl} required className="mt-1" />
                      <span>{getHealthQuestionLevelText(q, lvl, language, stage)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </section>
      ))}

      <section className="space-y-6 border-t border-neutral-200 pt-8">
        <div>
          <h2 className="text-lg font-medium">Risk Exposure</h2>
          <p className="text-sm text-neutral-600">
            Every question asks what would happen if something went wrong — not how likely it is.
          </p>
        </div>
        {RISK_CATEGORIES.map(({ category }) => (
          <div key={category} className="space-y-6">
            <h3 className="text-base font-medium text-neutral-800">{getDimensionName(category, language)}</h3>
            {RISK_FIELDS.filter((f) => f.category === category).map((f) => {
              const isConstruct = (CONCENTRATION_CONSTRUCT_IDS as readonly string[]).includes(f.field_id);
              const skippedUnproven = isConstruct && isUnproven(f.field_id, intake.currently_in_place);
              const skippedProspective = !isConstruct && isProspectiveA(f.field_id, intake.currently_in_place);
              const fieldText = getText(f.field_id, "text", language);
              if (skippedUnproven) {
                return (
                  <div key={f.field_id} className="rounded-md border border-dashed border-neutral-300 p-3 text-sm text-neutral-500">
                    {fieldText} — <em>not yet applicable at this stage; recorded as not yet demonstrated, not scored.</em>
                  </div>
                );
              }
              if (skippedProspective) {
                return (
                  <div key={f.field_id} className="rounded-md border border-dashed border-neutral-300 p-3 text-sm text-neutral-500">
                    {fieldText} — <em>not currently applicable; recorded as no exposure.</em>
                  </div>
                );
              }
              return (
                <fieldset key={f.field_id} className="space-y-2">
                  <legend className="text-sm font-medium text-neutral-800">{fieldText}</legend>
                  <div className="space-y-1.5">
                    {LEVELS.map((lvl) => (
                      <label key={lvl} className="flex gap-2 text-sm text-neutral-700">
                        <input type="radio" name={`risk__${f.field_id}`} value={lvl} required className="mt-1" />
                        <span>{getText(f.field_id, `level_${lvl}`, language)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        ))}
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-8">
        <div>
          <h2 className="text-lg font-medium">Owner Exposure</h2>
          <p className="text-sm text-neutral-600">
            Not scored toward either number — shown on its own, since it&apos;s about you personally, not the business.
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-800">{getText(OWNER_EXPOSURE.field_id, "text", language)}</legend>
          <div className="space-y-1.5">
            {(["1", "2", "3", "4", "5"] as const).map((lvl) => (
              <label key={lvl} className="flex gap-2 text-sm text-neutral-700">
                <input type="radio" name="owner_exposure_level" value={lvl} required className="mt-1" />
                <span>{getText(OWNER_EXPOSURE.field_id, `level_${lvl}`, language)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
        See my results
      </button>
    </form>
    </FlowPage>
  );
}
