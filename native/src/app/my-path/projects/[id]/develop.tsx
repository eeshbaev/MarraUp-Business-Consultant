import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { GroupedTextField } from "@/components/ui/GroupedTextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { t, tf } from "@/lib/ui-copy";
import {
  getProject,
  listDevelopTasks,
  addDevelopTask,
  updateDevelopTaskStatus,
  deleteDevelopTask,
  confirmReadyForTest,
  type Project,
  type DevelopTask,
  type TaskStatus,
} from "@/lib/db";
import { DEVELOP_CATEGORIES_CONFIG } from "@/lib/journey/find-tasks-config";
import { computeDevelopCompletion } from "@/lib/journey/find-progress";
import { JOURNEY_STATUS_KEY, JOURNEY_STATUS_STYLE } from "@/lib/journey/status-styles";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { popOrReplace } from "@/lib/navigation";
import { colors, panelSurface, radii, space, type as typography } from "@/lib/theme";

const STATUS_ORDER: TaskStatus[] = ["not_started", "in_progress", "done"];

export default function DevelopScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const projectId = Array.isArray(idParam) ? idParam[0] : idParam;
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<DevelopTask[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fieldEpoch, setFieldEpoch] = useState(0);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  const load = useCallback(() => {
    if (!projectId) return;
    setProject(getProject(projectId));
    setTasks(listDevelopTasks(projectId));
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const completion = useMemo(
    () => (project ? computeDevelopCompletion(project.bp_required_resources, tasks) : null),
    [project, tasks]
  );

  const doneCount = tasks.filter((tk) => tk.status === "done").length;
  const registerTasks = tasks.filter((tk) => tk.category === "register_approve");
  const registerOk = registerTasks.length > 0 && registerTasks.every((tk) => tk.status === "done");
  const canMoveToTest = !!(completion?.isReadyForTest && registerOk);

  if (!project || !projectId) {
    return (
      <ScreenScaffold safeBottom>
        <View />
      </ScreenScaffold>
    );
  }

  function cycleStatus(task: DevelopTask) {
    const idx = STATUS_ORDER.indexOf(task.status);
    updateDevelopTaskStatus(task.id, STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]);
    load();
  }

  function remove(task: DevelopTask) {
    deleteDevelopTask(task.id);
    load();
  }

  function addTask(categoryKey: string) {
    const label = (drafts[categoryKey] ?? "").trim();
    if (!label) return;
    addDevelopTask(projectId, categoryKey as DevelopTask["category"], label, "done");
    setDrafts((prev) => ({ ...prev, [categoryKey]: "" }));
    setFieldEpoch((e) => e + 1);
    load();
  }

  function confirmMoveToTest() {
    if (!canMoveToTest) return;
    confirmReadyForTest(projectId);
    router.push(`/my-path/projects/${projectId}/test` as any);
  }

  return (
    <ScreenScaffold background="flat" safeBottom>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
          <FlowBackHeader
            backLabel={t("project.hub.back", language)}
            onBack={() => popOrReplace(`/my-path/projects/${projectId}`)}
          />
          <Text style={typography.screenTitle}>{project.name}</Text>
          <Text style={typography.screenSubtitle}>{t("develop.subtitle", language)}</Text>
          <Text style={styles.howTo}>{t("develop.howToProceed", language)}</Text>
          {tasks.length > 0 ? (
            <Text style={styles.progressLine}>{tf("develop.tasksProgress", language, { done: doneCount, total: tasks.length })}</Text>
          ) : null}

          {project.bp_launch_ready_condition ? (
            <View style={styles.launchReady}>
              <Text style={styles.launchReadyLabel}>{t("develop.launchReady", language)}</Text>
              <Text style={styles.launchReadyText}>{project.bp_launch_ready_condition}</Text>
            </View>
          ) : null}

          {completion && completion.resourceGaps.length > 0 ? (
            <View style={styles.gapCard}>
              <Text style={styles.gapText}>
                {t("develop.notCoveredYet", language)} {completion.resourceGaps.slice(0, 3).join(", ")}
              </Text>
            </View>
          ) : null}

          {!registerOk && registerTasks.length === 0 ? (
            <Text style={styles.registerHint}>{t("develop.registerRequired", language)}</Text>
          ) : null}

          <View style={styles.categories}>
            {DEVELOP_CATEGORIES_CONFIG.map((cat) => {
              const catTasks = tasks.filter((tk) => tk.category === cat.key);
              return (
                <View key={cat.key} style={styles.category}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>
                      {cat.order} · {cat.title[language]}
                    </Text>
                    {cat.required ? (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>{t("develop.required", language)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.categoryQuestion}>{cat.question[language]}</Text>

                  <View style={styles.taskList}>
                    {catTasks.map((task) => {
                      const s = JOURNEY_STATUS_STYLE[task.status];
                      return (
                        <View key={task.id} style={styles.taskRow}>
                          <Text style={styles.taskLabel}>{task.label}</Text>
                          <View style={styles.taskRowActions}>
                            <Pressable style={[styles.taskStatus, { backgroundColor: s.bg }]} onPress={() => cycleStatus(task)}>
                              <Text style={[styles.taskStatusText, { color: s.color }]}>{t(JOURNEY_STATUS_KEY[task.status], language)}</Text>
                            </Pressable>
                            <Pressable onPress={() => remove(task)} hitSlop={8}>
                              <Text style={styles.removeText}>✕</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                    <View style={styles.addRow}>
                      <GroupedTextField
                        key={`${fieldEpoch}-${cat.key}`}
                        style={styles.addInput}
                        placeholder={t("develop.addTask", language)}
                        value={drafts[cat.key] ?? ""}
                        defaultValue={drafts[cat.key] ?? ""}
                        onChangeText={(v) => setDrafts((prev) => ({ ...prev, [cat.key]: v }))}
                        onSubmitEditing={() => addTask(cat.key)}
                        returnKeyType="done"
                        isLast
                      />
                      <Pressable style={styles.addButton} onPress={() => addTask(cat.key)}>
                        <Text style={styles.addButtonText}>{t("develop.addTaskCta", language)}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          {canMoveToTest ? (
            <PrimaryButton label={t("develop.confirmMoveToTest", language)} onPress={confirmMoveToTest} />
          ) : (
            <Text style={styles.footerHint}>
              {completion?.isReadyForTest && !registerOk
                ? t("develop.registerRequired", language)
                : t("develop.howToProceed", language)}
            </Text>
          )}
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  howTo: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 8, marginBottom: 6 },
  progressLine: { fontSize: 13, fontWeight: "600", color: colors.accentDark, marginBottom: 12 },
  launchReady: {
    marginBottom: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    padding: space.card,
  },
  launchReadyLabel: { ...typography.sectionLabel, marginBottom: 4 },
  launchReadyText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  gapCard: {
    marginBottom: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
    padding: space.card,
  },
  gapText: { fontSize: 13, color: "#92400E", lineHeight: 18 },
  registerHint: { fontSize: 13, color: colors.warning, marginBottom: 12, lineHeight: 18 },
  categories: { marginTop: 8, gap: space.section - 8 },
  category: { gap: 6 },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryTitle: { ...typography.sectionLabel, marginBottom: 0 },
  requiredBadge: { borderRadius: radii.full, backgroundColor: "#FFF7ED", paddingHorizontal: 8, paddingVertical: 3 },
  requiredBadgeText: { fontSize: 10, fontWeight: "700", color: "#C2410C" },
  categoryQuestion: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  taskList: { ...panelSurface({ paddingVertical: 0, overflow: "hidden" }), marginTop: 6 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: space.card,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  taskLabel: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  taskRowActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  taskStatus: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  taskStatusText: { fontSize: 11, fontWeight: "700" },
  removeText: { fontSize: 16, color: colors.textFaint, fontWeight: "600" },
  addRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: space.card,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addInput: { flex: 1, minHeight: 44, paddingVertical: 8 },
  addButton: {
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: { fontSize: 14, fontWeight: "700", color: colors.accentDark },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  footerHint: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
});
