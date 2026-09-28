import { createProject } from "./db";

export function startLaunchProjectFromGap(sectorId: string, text: string) {
  return createProject({
    source: "market_gap",
    market_gap_sector_id: sectorId,
    market_gap_text: text,
  });
}

export function startLaunchProjectFromIdea(description: string) {
  return createProject({
    source: "self",
    self_description: description,
  });
}

export function projectFindHref(projectId: string) {
  return `/my-path/projects/${projectId}/find` as const;
}
