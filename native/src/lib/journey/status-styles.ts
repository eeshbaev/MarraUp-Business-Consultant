import type { TaskStatus } from "@/lib/db";
import { colors } from "@/lib/theme";

export const JOURNEY_STATUS_KEY: Record<TaskStatus, string> = {
  not_started: "journey.status.notStarted",
  in_progress: "journey.status.inProgress",
  done: "journey.status.done",
};

export const JOURNEY_STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  not_started: { bg: colors.bgMuted, color: colors.textMuted },
  in_progress: { bg: colors.accentSoft, color: colors.accentDark },
  done: { bg: "#ECFDF5", color: colors.success },
};

export const JOURNEY_STATUS_ORDER: TaskStatus[] = ["not_started", "in_progress", "done"];
