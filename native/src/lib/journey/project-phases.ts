import { PROJECT_STAGE_ORDER } from "../discover/milestones";
import type { Project, ProjectStage } from "../db";

const STAGE_SEGMENT: Record<ProjectStage, string> = {
  finding: "find",
  blueprint: "blueprint",
  developing: "develop",
  testing: "test",
  revenue: "revenue",
};

export function projectStageScreenHref(projectId: string, stage: ProjectStage): string {
  return `/my-path/projects/${projectId}/${STAGE_SEGMENT[stage]}`;
}

export function projectHubHref(projectId: string): string {
  return `/my-path/projects/${projectId}`;
}

export type ProjectStageRow = {
  stage: ProjectStage;
  labelKey: string;
  achieved: boolean;
  current: boolean;
  href: string;
};

const STAGE_LABEL_KEY: Record<ProjectStage, string> = {
  finding: "myPathList.stage.finding",
  blueprint: "myPathList.stage.blueprint",
  developing: "myPathList.stage.developing",
  testing: "myPathList.stage.testing",
  revenue: "myPathList.stage.revenue",
};

export function listProjectStageRows(project: Project): ProjectStageRow[] {
  const currentIdx = PROJECT_STAGE_ORDER.indexOf(project.stage);
  return PROJECT_STAGE_ORDER.map((stage, idx) => ({
    stage,
    labelKey: STAGE_LABEL_KEY[stage],
    achieved: idx < currentIdx,
    current: idx === currentIdx,
    href: projectStageScreenHref(project.id, stage),
  }));
}
