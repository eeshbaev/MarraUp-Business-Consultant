import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listFindTasks, listFindNotes, type FindTask } from "@/lib/db";
import { updateFindTaskAction, addFindNoteAction } from "@/app/journey-actions";
import { FIND_TASKS } from "@/lib/journey/find-tasks-config";
import { isFindTaskListComplete } from "@/lib/journey/find-progress";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_KEY: Record<FindTask["status"], string> = {
  not_started: "journey.status.notStarted",
  in_progress: "journey.status.inProgress",
  done: "journey.status.done",
};
const STATUS_CLASS: Record<FindTask["status"], string> = {
  not_started: "bg-neutral-100 text-neutral-500",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-green-50 text-green-700",
};

export default async function FindPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const language = await getLanguage();

  const tasks = listFindTasks(id);
  const decided = isFindTaskListComplete(tasks);

  return (
    <div>
      <Link href="/my-path" className="mb-3 inline-block text-xs text-neutral-500">
        {t("journey.backToMyPath", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{project.name || t("journey.newProject", language)}</h1>
      <p className="mt-0.5 text-xs text-neutral-500">{t("find.subtitle", language)}</p>

      <div className="mt-4 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
        {FIND_TASKS.map((cfg) => {
          const task = tasks.find((t) => t.task_key === cfg.key)!;
          return (
            <details key={cfg.key} className="p-3.5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold text-neutral-400">{cfg.order}</div>
                  <div className="text-xs font-medium leading-tight text-neutral-900">{cfg.question[language]}</div>
                </div>
                <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[task.status]}`}>
                  {t(STATUS_KEY[task.status], language)}
                </span>
              </summary>

              <p className="mt-2 text-[11px] text-neutral-500">{cfg.hint[language]}</p>

              <form action={updateFindTaskAction} className="mt-2 space-y-2">
                <input type="hidden" name="project_id" value={id} />
                <input type="hidden" name="task_key" value={cfg.key} />
                {!cfg.repeatable && (
                  <textarea name="summary" defaultValue={task.summary ?? ""} rows={2} className="w-full rounded-md border border-neutral-200 p-2 text-xs" />
                )}
                {cfg.repeatable && <input type="hidden" name="summary" value={task.summary ?? ""} />}
                <div className="flex gap-2">
                  <select name="status" defaultValue={task.status} className="rounded-md border border-neutral-200 px-2 py-1.5 text-xs">
                    <option value="not_started">{t("journey.status.notStarted", language)}</option>
                    <option value="in_progress">{t("journey.status.inProgress", language)}</option>
                    <option value="done">{t("journey.status.done", language)}</option>
                  </select>
                  <button type="submit" className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white">
                    {t("journey.save", language)}
                  </button>
                </div>
              </form>

              {cfg.repeatable && <FindNoteLog projectId={id} findTaskId={task.id} language={language} />}
            </details>
          );
        })}
      </div>

      {decided && (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center">
          <p className="text-xs text-neutral-600">{t("find.decided", language)}</p>
          <Link href={`/my-path/projects/${id}/blueprint`} className="mt-2 inline-block rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
            {t("find.openBlueprint", language)}
          </Link>
        </div>
      )}
    </div>
  );
}

async function FindNoteLog({ projectId, findTaskId, language }: { projectId: string; findTaskId: string; language: Language }) {
  const notes = listFindNotes(findTaskId);
  return (
    <div className="mt-3">
      {notes.length > 0 && (
        <ul className="mb-2 space-y-1">
          {notes.slice(0, 5).map((n) => (
            <li key={n.id} className="rounded bg-neutral-50 p-2 text-[11px] text-neutral-700">
              {n.body}
            </li>
          ))}
        </ul>
      )}
      <form action={addFindNoteAction} className="flex gap-2">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="find_task_id" value={findTaskId} />
        <input name="body" placeholder={t("journey.addEntry", language)} className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs" />
        <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700">
          {t("journey.add", language)}
        </button>
      </form>
    </div>
  );
}
