import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listDevelopTasks, type DevelopTask } from "@/lib/db";
import { addDevelopTaskAction, updateDevelopTaskStatusAction, deleteDevelopTaskAction, confirmReadyForTestAction } from "@/app/journey-actions";
import { DEVELOP_CATEGORIES_CONFIG } from "@/lib/journey/find-tasks-config";
import { computeDevelopCompletion } from "@/lib/journey/find-progress";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

const STATUS_CLASS: Record<DevelopTask["status"], string> = {
  not_started: "bg-neutral-100 text-neutral-500",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-green-50 text-green-700",
};

export default async function DevelopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language = await getLanguage();

  const tasks = listDevelopTasks(id);
  const completion = computeDevelopCompletion(project.bp_required_resources, tasks);

  return (
    <div>
      <Link href="/my-path" className="mb-3 inline-block text-xs text-neutral-500">
        {t("journey.backToMyPath", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{t("develop.subtitle", language)}</p>

      {project.bp_launch_ready_condition && (
        <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-2.5">
          <div className="text-[10px] font-semibold uppercase text-neutral-400">{t("develop.launchReady", language)}</div>
          <div className="mt-0.5 text-[11px] text-neutral-700">{project.bp_launch_ready_condition}</div>
        </div>
      )}

      {completion.resourceGaps.length > 0 && (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
          {t("develop.notCoveredYet", language)} {completion.resourceGaps.slice(0, 3).join(", ")}
        </div>
      )}

      {completion.isReadyForTest && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center">
          <p className="text-xs font-semibold text-neutral-800">{t("develop.readyForTest", language)}</p>
          <form action={confirmReadyForTestAction} className="mt-2">
            <input type="hidden" name="project_id" value={id} />
            <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
              {t("develop.confirmMoveToTest", language)}
            </button>
          </form>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {DEVELOP_CATEGORIES_CONFIG.map((cat) => {
          const catTasks = tasks.filter((t) => t.category === cat.key);
          return (
            <div key={cat.key}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  {cat.order} · {cat.title[language]}
                </span>
                {cat.required && <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">{t("develop.required", language)}</span>}
              </div>
              <p className="mb-1.5 text-[11px] text-neutral-500">{cat.question[language]}</p>

              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
                {catTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 p-2.5">
                    <span className="text-xs text-neutral-800">{task.label}</span>
                    <div className="flex flex-none items-center gap-1.5">
                      <form action={updateDevelopTaskStatusAction} className="flex items-center gap-1">
                        <input type="hidden" name="project_id" value={id} />
                        <input type="hidden" name="id" value={task.id} />
                        <select
                          name="status"
                          defaultValue={task.status}
                          className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[task.status]}`}
                        >
                          <option value="not_started">{t("journey.status.notStarted", language)}</option>
                          <option value="in_progress">{t("journey.status.inProgress", language)}</option>
                          <option value="done">{t("journey.status.done", language)}</option>
                        </select>
                        <button type="submit" className="text-[10px] text-neutral-400">
                          ✓
                        </button>
                      </form>
                      <form action={deleteDevelopTaskAction}>
                        <input type="hidden" name="project_id" value={id} />
                        <input type="hidden" name="id" value={task.id} />
                        <button type="submit" className="text-[10px] text-neutral-300">
                          ✕
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
                <form action={addDevelopTaskAction} className="flex gap-1.5 p-2">
                  <input type="hidden" name="project_id" value={id} />
                  <input type="hidden" name="category" value={cat.key} />
                  <input name="label" placeholder={t("develop.addTask", language)} className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
                  <button type="submit" className="rounded-md border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-700">
                    +
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
