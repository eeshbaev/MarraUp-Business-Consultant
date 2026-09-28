import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { AppPressable } from "@/components/ui/AppPressable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { t, tf } from "@/lib/ui-copy";
import { getDiscoverAnswers, listActiveProjects, listDevelopTasks, listFindTasks, MAX_ACTIVE_PROJECTS, type Project } from "@/lib/db";
import { rankDirections } from "@/lib/discover/engine";
import type { SectorId } from "@/lib/discover/sectors";
import { hasDiscoverProgress } from "@/lib/discover/resume-step";
import { computeProjectSignals, STALL_THRESHOLD_DAYS, type ProjectWithDevelopTasks } from "@/lib/journey/stalled";
import { projectHubHref } from "@/lib/journey/project-phases";
import { useScrollContentStyle } from "@/lib/layout-metrics";
import { cardSurface, colors, radii, space, type as typography } from "@/lib/theme";
import type { FindTask, DevelopTask } from "@/lib/db";


interface WithTasks {
  project: Project;
  findTasks: FindTask[];
  developTasks: DevelopTask[];
}

function SlotMeter({ used, max }: { used: number; max: number }) {
  return (
    <View style={styles.slotRow}>
      {Array.from({ length: max }).map((_, i) => (
        <View key={i} style={[styles.slotDot, i < used && styles.slotDotFilled]} />
      ))}
    </View>
  );
}

export default function MyPathScreen() {
  const { language } = useLanguage();
  const [withTasks, setWithTasks] = useState<WithTasks[]>([]);
  const [discover, setDiscover] = useState(() => getDiscoverAnswers());

  const load = useCallback(() => {
    const projects = listActiveProjects();
    setWithTasks(
      projects.map((project) => ({
        project,
        findTasks: listFindTasks(project.id),
        developTasks: listDevelopTasks(project.id),
      }))
    );
    setDiscover(getDiscoverAnswers());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const signals = computeProjectSignals(withTasks.map((p): ProjectWithDevelopTasks => ({ project: p.project, developTasks: p.developTasks })));
  const stalled = withTasks.find((p) => p.project.id === signals.stalledProjectId);
  const ready = withTasks.find((p) => p.project.id === signals.readyProjectId);

  const startProjectHref = "/my-path/choose";

  const discoverCompleted = !!discover?.completed_at;
  const discoverHasDraft = discover != null && hasDiscoverProgress(discover.answers);
  const directionCount =
    discoverCompleted && discover
      ? rankDirections({ tags: discover.tags, hardExclusions: discover.hardExclusions as SectorId[] }).length
      : 0;

  const goBackToExplore = () => router.replace("/(tabs)/explore" as any);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });

  return (
    <ScreenScaffold safeBottom>
      <ScrollView
        contentContainerStyle={scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.accent} />}
      >
        <FlowBackHeader backLabel={t("tab.explore", language)} onBack={goBackToExplore} />
        <View style={styles.header}>
          <Text style={styles.title}>{t("myPathList.title", language)}</Text>
          <SlotMeter used={withTasks.length} max={MAX_ACTIVE_PROJECTS} />
          <Text style={styles.subtitle}>
            {withTasks.length} {tf("myPathList.slotsInUse", language, { max: MAX_ACTIVE_PROJECTS })}
          </Text>
        </View>

        {stalled && ready && stalled.project.id !== ready.project.id && (
          <View style={styles.nudge}>
            <Text style={styles.nudgeTitle}>
              {stalled.project.name || t("myPathList.aProject", language)} {tf("myPathList.stalled", language, { days: STALL_THRESHOLD_DAYS })}
            </Text>
            <Text style={styles.nudgeBody}>{t("myPathList.anotherReady", language)}</Text>
            <View style={styles.nudgeRow}>
              <View style={styles.nudgeBtnWrap}>
                <SecondaryButton
                  label={tf("myPathList.continue", language, { name: stalled.project.name || t("myPathList.it", language) })}
                  onPress={() => router.push(`/my-path/projects/${stalled.project.id}/develop` as any)}
                />
              </View>
              <View style={styles.nudgeBtnWrap}>
                <PrimaryButton
                  label={tf("myPathList.develop", language, { name: ready.project.name || t("myPathList.it", language) })}
                  onPress={() => router.push(`/my-path/projects/${ready.project.id}/develop` as any)}
                />
              </View>
            </View>
          </View>
        )}

        {(discoverCompleted || discoverHasDraft) && (
          <View style={styles.discoverCard}>
            <Text style={styles.discoverTitle}>{t("myPathList.discoverSavedTitle", language)}</Text>
            <Text style={styles.discoverBody}>
              {discoverCompleted
                ? tf("myPathList.discoverSavedCompleted", language, { count: directionCount })
                : t("myPathList.discoverSavedInProgress", language)}
            </Text>
            <View style={styles.discoverActions}>
              {discoverCompleted ? (
                <PrimaryButton
                  label={t("myPathList.viewDirections", language)}
                  onPress={() => router.push("/my-path/results" as any)}
                />
              ) : (
                <PrimaryButton
                  label={t("myPathList.continueQuestionnaire", language)}
                  onPress={() => router.push("/my-path/start" as any)}
                />
              )}
            </View>
          </View>
        )}

        {withTasks.length === 0 && (
          <EmptyState
            title={t("myPathList.noActiveProjects", language)}
            body={t("myPath.exploreTeaser", language)}
            actionLabel={discoverCompleted ? t("myPathList.startProject", language) : t("explore.myPathCta", language)}
            onAction={() => router.push(discoverCompleted ? "/my-path/new" as any : (startProjectHref as any))}
          />
        )}

        <View style={styles.list}>
          {withTasks.map(({ project }) => {
            const isStalled = signals.stalledProjectId === project.id;
            return (
              <AppPressable key={project.id} style={styles.card} onPress={() => router.push(projectHubHref(project.id) as any)}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{project.name || project.market_gap_text || t("myPathList.untitled", language)}</Text>
                    {isStalled ? <Text style={styles.cardMeta}>{t("myPathList.stalledSuffix", language)}</Text> : null}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </AppPressable>
            );
          })}
        </View>

        {withTasks.length > 0 && withTasks.length < MAX_ACTIVE_PROJECTS && (
          <AppPressable style={styles.addCard} onPress={() => router.push(startProjectHref as any)}>
            <Text style={styles.addCardText}>+ {t("myPathList.startProject", language)}</Text>
          </AppPressable>
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  discoverCard: {
    marginBottom: space.section,
    ...cardSurface(),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: space.card + 4,
    gap: 10,
  },
  discoverTitle: { ...typography.cardTitle, fontSize: 18 },
  discoverBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  discoverActions: { marginTop: 6 },
  header: { marginBottom: space.section - 4 },
  title: { ...typography.screenTitle, fontSize: 28 },
  subtitle: { ...typography.screenSubtitle, marginTop: 6 },
  slotRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  slotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
  },
  slotDotFilled: { backgroundColor: colors.accent, borderColor: colors.accent },
  nudge: {
    marginBottom: space.section - 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    padding: space.card,
  },
  nudgeTitle: { fontSize: 14, fontWeight: "600", color: "#78350F" },
  nudgeBody: { marginTop: 6, fontSize: 13, color: "#92400E", lineHeight: 19 },
  nudgeRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  nudgeBtnWrap: { flex: 1 },
  list: { gap: 12, marginTop: 8 },
  card: { ...cardSurface(), padding: space.card, borderLeftWidth: 4, borderLeftColor: colors.accent },
  cardRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text, lineHeight: 22 },
  cardMeta: { marginTop: 4, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  chevron: { fontSize: 22, fontWeight: "300", color: colors.textMuted, lineHeight: 24 },
  addCard: {
    marginTop: space.section - 4,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.accentSoftBorder,
    backgroundColor: colors.bgElevated,
    padding: space.card,
    alignItems: "center",
  },
  addCardText: { fontSize: 15, fontWeight: "600", color: colors.accentDark },
});
