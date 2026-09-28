import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listClosedCycles, listOperationsNotes, getFounderDependence } from "@/lib/db";
import { addOperationsNoteAction, saveFounderDependenceAction, markStableViewIntroShownAction } from "@/app/journey-actions";
import { computeStableBusinessView } from "@/lib/journey/stable-business-view";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEPENDENCE_FIELDS: { key: string; labelKey: string }[] = [
  { key: "only_i_sell", labelKey: "stable.dep.onlyISell" },
  { key: "only_i_deliver", labelKey: "stable.dep.onlyIDeliver" },
  { key: "only_i_know_process", labelKey: "stable.dep.onlyIKnowProcess" },
  { key: "process_undocumented", labelKey: "stable.dep.processUndocumented" },
  { key: "no_backup", labelKey: "stable.dep.noBackup" },
];

export default async function StableBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language: Language = await getLanguage();

  const closedCycles = listClosedCycles(id);
  const notes = listOperationsNotes(id);
  const dependence = getFounderDependence(id);
  const view = computeStableBusinessView(closedCycles, dependence, language);
  const showIntro = !project.stable_view_intro_shown_at;

  return (
    <div>
      <Link href={`/my-path/projects/${id}/revenue`} className="mb-3 inline-block text-xs text-neutral-500">
        {t("stable.backToRevenue", language)}
      </Link>

      {showIntro && (
        <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[11px] leading-relaxed text-neutral-700">{t("stable.introBody", language)}</p>
          <form action={markStableViewIntroShownAction} className="mt-2">
            <input type="hidden" name="project_id" value={id} />
            <button type="submit" className="text-[10.5px] font-semibold text-neutral-500 underline">
              {t("stable.gotIt", language)}
            </button>
          </form>
        </div>
      )}

      <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{t("stable.subtitle", language)}</p>

      {!view.hasEnoughData ? (
        <p className="mt-4 text-xs text-neutral-500">{t("stable.needsCycle", language)}</p>
      ) : (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
          {view.summaryLines.map((l, i) => (
            <p key={i} className="text-[11px] leading-relaxed text-neutral-700">
              {l}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("stable.operations", language)}</p>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          {notes.slice(0, 5).map((n) => (
            <p key={n.id} className="mb-1.5 text-[11px] text-neutral-700">
              {n.body}
            </p>
          ))}
          <form action={addOperationsNoteAction} className="flex gap-1.5">
            <input type="hidden" name="project_id" value={id} />
            <input name="body" placeholder={t("stable.addNote", language)} className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
            <button type="submit" className="rounded-md border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-700">
              {t("journey.add", language)}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{t("stable.founderDependence", language)}</p>
        <form action={saveFounderDependenceAction} className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1.5">
          <input type="hidden" name="project_id" value={id} />
          {DEPENDENCE_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-[11px] text-neutral-700">
              <input
                type="checkbox"
                name={f.key}
                defaultChecked={!!(dependence as unknown as Record<string, boolean> | null)?.[f.key]}
              />
              {t(f.labelKey, language)}
            </label>
          ))}
          <button type="submit" className="mt-1 w-full rounded-md bg-neutral-900 py-2 text-xs font-semibold text-white">
            {t("journey.save", language)}
          </button>
        </form>
      </div>

      <Link
        href="/new/intro"
        className="mt-4 block rounded-md border border-neutral-300 py-2.5 text-center text-xs font-semibold text-neutral-700"
      >
        {t("stable.openAssessment", language)}
      </Link>
    </div>
  );
}
