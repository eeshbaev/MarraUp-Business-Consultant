import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { t, tf } from "@/lib/ui-copy";
import {
  getProject,
  listFindTasks,
  listFindNotes,
  updateFindTask,
  addFindNote,
  type FindTask,
  type FindNote,
  type Project,
  type FindTaskKey,
  type TaskStatus,
} from "@/lib/db";
import { FIND_TASKS } from "@/lib/journey/find-tasks-config";
import { isFindTaskListComplete } from "@/lib/journey/find-progress";
import { JOURNEY_STATUS_KEY, JOURNEY_STATUS_ORDER, JOURNEY_STATUS_STYLE } from "@/lib/journey/status-styles";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { popOrReplace } from "@/lib/navigation";
import { colors, panelSurface, radii, space, type as typography } from "@/lib/theme";

export default function FindScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<FindTask[]>([]);
  const [expanded, setExpanded] = useState<FindTaskKey | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });
  const footerPad = useStickyFooterPadding();

  const load = useCallback(() => {
    if (!id) return;
    setProject(getProject(id));
    setTasks(listFindTasks(id));
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const progress = useMemo(() => {
    const done = tasks.filter((tk) => tk.status === "done").length;
    return FIND_TASKS.length ? done / FIND_TASKS.length : 0;
  }, [tasks]);

  if (!project || !id) {
    return (
      <ScreenScaffold safeBottom>
        <View />
      </ScreenScaffold>
    );
  }

  const decided = isFindTaskListComplete(tasks);

  function draftSummary(cfg: (typeof FIND_TASKS)[number], task: FindTask): string {
    return (cfg.repeatable ? task.summary ?? "" : drafts[cfg.key] ?? task.summary ?? "").trim();
  }

  function taskHasContent(cfg: (typeof FIND_TASKS)[number], task: FindTask): boolean {
    if (cfg.repeatable) return listFindNotes(task.id).length > 0;
    return draftSummary(cfg, task).length > 0;
  }

  /** Primary Save — persist text and mark step done when there is content. */
  function completeTask(cfg: (typeof FIND_TASKS)[number], task: FindTask) {
    if (!id) return;
    if (!taskHasContent(cfg, task)) return;
    const summary = draftSummary(cfg, task);
    updateFindTask(id, cfg.key, { status: "done", summary: summary || undefined });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[cfg.key];
      return next;
    });
    load();
  }

  function cycleStatus(cfg: (typeof FIND_TASKS)[number], task: FindTask) {
    if (!id) return;
    const idx = JOURNEY_STATUS_ORDER.indexOf(task.status);
    const next = JOURNEY_STATUS_ORDER[(idx + 1) % JOURNEY_STATUS_ORDER.length];
    const summary = draftSummary(cfg, task);
    updateFindTask(id, cfg.key, { status: next, summary: summary || undefined });
    setDrafts((prev) => {
      const draft = { ...prev };
      delete draft[cfg.key];
      return draft;
    });
    load();
  }

  function onNotesChanged(cfg: (typeof FIND_TASKS)[number], task: FindTask) {
    if (!id) return;
    if (listFindNotes(task.id).length === 0) return;
    if (task.status === "not_started") {
      updateFindTask(id, cfg.key, { status: "in_progress" });
    }
    load();
  }

  return (
    <ScreenScaffold safeBottom>
      <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
        <FlowBackHeader
          backLabel={t("project.hub.back", language)}
          onBack={() => popOrReplace(`/my-path/projects/${id}`)}
        />
        <Text style={typography.screenTitle}>{project.name || t("journey.newProject", language)}</Text>
        <Text style={styles.subtitle}>{t("find.subtitle", language)}</Text>

        <View style={styles.progressWrap}>
          <ProgressBar
            label={tf("find.progressLabel", language, {
              done: tasks.filter((tk) => tk.status === "done").length,
              total: FIND_TASKS.length,
            })}
            progress={progress}
          />
        </View>

        <View style={styles.taskList}>
          {FIND_TASKS.map((cfg, index) => {
            const task = tasks.find((tk) => tk.task_key === cfg.key);
            if (!task) return null;
            const isOpen = expanded === cfg.key;
            const statusStyle = JOURNEY_STATUS_STYLE[task.status];
            const isLast = index === FIND_TASKS.length - 1;
            return (
              <View key={cfg.key} style={[styles.taskCard, !isLast && styles.taskDivider]}>
                <Pressable
                  style={({ pressed }) => [styles.taskHeader, pressed && styles.taskHeaderPressed]}
                  onPress={() => setExpanded(isOpen ? null : cfg.key)}
                >
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>{cfg.order}</Text>
                  </View>
                  <View style={styles.taskHeaderCopy}>
                    <Text style={styles.taskQuestion}>{cfg.question[language]}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.color }]} numberOfLines={1}>
                      {t(JOURNEY_STATUS_KEY[task.status], language)}
                    </Text>
                  </View>
                </Pressable>

                {isOpen ? (
                  <View style={styles.taskBody}>
                    <Text style={styles.taskHint}>{cfg.hint[language]}</Text>

                    {!cfg.repeatable ? (
                      <TextInput
                        style={styles.textArea}
                        multiline
                        value={drafts[cfg.key] ?? task.summary ?? ""}
                        onChangeText={(v) => setDrafts((prev) => ({ ...prev, [cfg.key]: v }))}
                        placeholderTextColor={colors.textFaint}
                      />
                    ) : null}

                    {cfg.repeatable ? (
                      <FindNoteLog
                        findTaskId={task.id}
                        language={language}
                        onChanged={() => onNotesChanged(cfg, task)}
                      />
                    ) : null}

                    <View style={styles.taskActions}>
                      <SecondaryButton label={t(JOURNEY_STATUS_KEY[task.status], language)} onPress={() => cycleStatus(cfg, task)} />
                      <PrimaryButton
                        label={t("journey.save", language)}
                        onPress={() => completeTask(cfg, task)}
                        disabled={!taskHasContent(cfg, task)}
                        style={styles.saveBtn}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        {decided ? (
          <>
            <View style={styles.decidedCard}>
              <Text style={styles.decidedText}>{t("find.decided", language)}</Text>
            </View>
            <PrimaryButton label={t("find.openBlueprint", language)} onPress={() => router.push(`/my-path/projects/${id}/blueprint` as any)} />
          </>
        ) : (
          <Text style={styles.footerHint}>{t("find.completeDecideHint", language)}</Text>
        )}
      </View>
    </ScreenScaffold>
  );
}

function FindNoteLog({
  findTaskId,
  language,
  onChanged,
}: {
  findTaskId: string;
  language: import("@/lib/types").Language;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState<FindNote[]>(() => listFindNotes(findTaskId));
  const [body, setBody] = useState("");

  useEffect(() => {
    setNotes(listFindNotes(findTaskId));
  }, [findTaskId]);

  function add() {
    const trimmed = body.trim();
    if (!trimmed) return;
    addFindNote(findTaskId, trimmed);
    setBody("");
    setNotes(listFindNotes(findTaskId));
    onChanged();
  }

  return (
    <View style={styles.noteLog}>
      {notes.length > 0 ? (
        <View style={styles.noteList}>
          {notes.slice(0, 8).map((n) => (
            <Text key={n.id} style={styles.noteItem}>
              {n.body}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.noteInputRow}>
        <TextInput
          style={styles.noteInput}
          value={body}
          onChangeText={setBody}
          placeholder={t("journey.addEntry", language)}
          placeholderTextColor={colors.textFaint}
        />
        <Pressable style={styles.noteAddButton} onPress={add}>
          <Text style={styles.noteAddButtonText}>{t("journey.add", language)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...typography.screenSubtitle, marginBottom: space.section - 4 },
  progressWrap: { marginBottom: space.section },
  taskList: { ...panelSurface({ paddingVertical: 0, overflow: "hidden" }) },
  taskCard: { backgroundColor: colors.bgElevated },
  taskDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.card,
    paddingVertical: 14,
    minHeight: 56,
  },
  taskHeaderPressed: { backgroundColor: colors.bgMuted },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontSize: 13, fontWeight: "700", color: colors.accentDark },
  taskHeaderCopy: { flex: 1, minWidth: 0 },
  taskQuestion: { fontSize: 15, fontWeight: "600", color: colors.text, lineHeight: 21 },
  statusBadge: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 110 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  taskBody: {
    paddingHorizontal: space.card,
    paddingBottom: space.card,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  taskHint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 88,
    backgroundColor: colors.bgElevated,
    marginBottom: 12,
  },
  taskActions: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  saveBtn: { flex: 1 },
  noteLog: { marginBottom: 12 },
  noteList: { gap: 8, marginBottom: 10 },
  noteItem: {
    borderRadius: radii.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  noteInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bgElevated,
  },
  noteAddButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteAddButtonText: { fontSize: 14, fontWeight: "600", color: colors.accentDark },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  decidedCard: { ...panelSurface(), padding: space.card, alignItems: "center" },
  decidedText: { fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  footerHint: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19, marginBottom: 4 },
});
