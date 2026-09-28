import Link from "next/link";
import TabHeader from "@/components/TabHeader";
import { getLanguage } from "@/lib/language";
import { t, tf } from "@/lib/ui-copy";
import {
  listActiveProjects,
  listDevelopTasks,
  listFindTasks,
  MAX_ACTIVE_PROJECTS,
  type Project,
} from "@/lib/db";
import { computeProjectSignals, STALL_THRESHOLD_DAYS } from "@/lib/journey/stalled";
import { computeDevelopCompletion, isFindTaskListComplete } from "@/lib/journey/find-progress";

export const dynamic = "force-dynamic";

const STAGE_LABEL_KEY: Record<Project["stage"], string> = {
  finding: "myPathList.stage.finding",
  blueprint: "myPathList.stage.blueprint",
  developing: "myPathList.stage.developing",
  testing: "myPathList.stage.testing",
  revenue: "myPathList.stage.revenue",
};

function progressFor(project: Project, findDone: number, developTotal: number, developDone: number) {
  if (project.stage === "finding") return findDone / 7;
  if (project.stage === "developing" && developTotal > 0) return developDone / developTotal;
  if (project.stage === "testing" || project.stage === "revenue") return 1;
  return project.stage === "blueprint" ? 1 : 0;
}

export default async function MyPathPage() {
  const language = await getLanguage();
  const projects = listActiveProjects();

  const withTasks = projects.map((project) => ({
    project,
    findTasks: listFindTasks(project.id),
    developTasks: listDevelopTasks(project.id),
  }));

  const signals = computeProjectSignals(withTasks.map((p) => ({ project: p.project, developTasks: p.developTasks })));
  const stalled = withTasks.find((p) => p.project.id === signals.stalledProjectId);
  const ready = withTasks.find((p) => p.project.id === signals.readyProjectId);

  return (
    <div>
      <TabHeader
        title={t("myPathList.title", language)}
        subtitle={`${projects.length} ${tf("myPathList.slotsInUse", language, { max: MAX_ACTIVE_PROJECTS })}`}
        language={language}
      />

      {stalled && ready && stalled.project.id !== ready.project.id && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {stalled.project.name || t("myPathList.aProject", language)}{" "}
            {tf("myPathList.stalled", language, { days: STALL_THRESHOLD_DAYS })}
          </p>
          <p className="mt-1 text-xs text-amber-800">{t("myPathList.anotherReady", language)}</p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/my-path/projects/${stalled.project.id}/develop`}
              className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-center text-xs font-semibold text-amber-900"
            >
              {tf("myPathList.continue", language, { name: stalled.project.name || t("myPathList.it", language) })}
            </Link>
            <Link
              href={`/my-path/projects/${ready.project.id}/develop`}
              className="flex-1 rounded-md bg-neutral-900 px-3 py-2 text-center text-xs font-semibold text-white"
            >
              {tf("myPathList.develop", language, { name: ready.project.name || t("myPathList.it", language) })}
            </Link>
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-center">
          <p className="text-sm text-neutral-600">{t("myPathList.noActiveProjects", language)}</p>
          <Link href="/my-path/new" className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
            {t("myPathList.startProject", language)}
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {withTasks.map(({ project, findTasks, developTasks }) => {
          const findDone = findTasks.filter((t) => t.status === "done").length;
          const completion = computeDevelopCompletion(project.bp_required_resources, developTasks);
          const pct = Math.round(progressFor(project, findDone, developTasks.length, developTasks.filter((t) => t.status === "done").length) * 100);
          const href =
            project.stage === "finding"
              ? `/my-path/projects/${project.id}/find`
              : project.stage === "blueprint"
              ? `/my-path/projects/${project.id}/blueprint`
              : project.stage === "testing"
              ? `/my-path/projects/${project.id}/test`
              : project.stage === "revenue"
              ? `/my-path/projects/${project.id}/revenue`
              : `/my-path/projects/${project.id}/develop`;
          const isStalled = signals.stalledProjectId === project.id;

          return (
            <Link key={project.id} href={href} className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{project.name || project.market_gap_text || t("myPathList.untitled", language)}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {t(STAGE_LABEL_KEY[project.stage], language)}
                    {isStalled ? ` · ${t("myPathList.stalledSuffix", language)}` : ""}
                    {completion.isReadyForTest ? ` · ${t("myPathList.readySuffix", language)}` : ""}
                    {project.stage === "finding" && isFindTaskListComplete(findTasks) ? ` · ${t("myPathList.decidedSuffix", language)}` : ""}
                  </div>
                </div>
                <span className="flex-none rounded-full bg-neutral-700 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  {t(STAGE_LABEL_KEY[project.stage], language)}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-neutral-900" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      {projects.length > 0 && projects.length < MAX_ACTIVE_PROJECTS && (
        <Link href="/my-path/new" className="mt-4 block rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm font-medium text-neutral-500">
          + {t("myPathList.startProject", language)}
        </Link>
      )}
    </div>
  );
}
