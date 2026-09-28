import type { Project } from "../db";

export function projectStageHref(project: Project): string {
  switch (project.stage) {
    case "finding":
      return `/my-path/projects/${project.id}/find`;
    case "blueprint":
      return `/my-path/projects/${project.id}/blueprint`;
    case "testing":
      return `/my-path/projects/${project.id}/test`;
    case "revenue":
      return `/my-path/projects/${project.id}/revenue`;
    default:
      return `/my-path/projects/${project.id}/develop`;
  }
}
