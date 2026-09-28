import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ActionGlyph } from "../../components/ui/ActionGlyphs";
import { BusinessAvatar } from "../../components/ui/BusinessAvatar";
import { GroupedSection } from "../../components/ui/GroupedSection";
import { ListRow } from "../../components/ui/ListRow";
import { PrimaryButton, SecondaryButton } from "../../components/ui/PrimaryButton";
import { ScreenScaffold } from "../../components/ui/ScreenScaffold";
import { useLanguage } from "../../lib/LanguageContext";
import { listActiveProjects, listBusinessPlanSummaries, type BusinessPlanSummary, type Project } from "../../lib/db";
import { planProgressLabel } from "../../lib/assessment/progress";
import { projectHubHref } from "../../lib/journey/project-phases";
import { useScrollContentStyle } from "../../lib/layout-metrics";
import { t, tf } from "../../lib/ui-copy";
import { colors, panelSurface, space, type as typography } from "../../lib/theme";

const STAGE_LABEL_KEY: Record<Project["stage"], string> = {
  finding: "myPathList.stage.finding",
  blueprint: "myPathList.stage.blueprint",
  developing: "myPathList.stage.developing",
  testing: "myPathList.stage.testing",
  revenue: "myPathList.stage.revenue",
};

export default function TasksScreen() {
  const { language } = useLanguage();
  const [summaries, setSummaries] = useState(() => listBusinessPlanSummaries());
  const [projects, setProjects] = useState(() => listActiveProjects());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setSummaries(listBusinessPlanSummaries());
    setProjects(listActiveProjects());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const scrollContent = useScrollContentStyle("tab");
  const hasWork = summaries.length > 0 || projects.length > 0;

  return (
    <ScreenScaffold>
      <ScrollView
        contentContainerStyle={scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <Text style={typography.screenTitle}>{t("header.tasks.title", language)}</Text>
          <Text style={typography.screenSubtitle}>{t("header.tasks.subtitle", language)}</Text>
        </View>

        {!hasWork ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t("tasks.emptyTitle", language)}</Text>
            <Text style={styles.emptyBody}>{t("tasks.emptyBody", language)}</Text>
            <PrimaryButton label={t("tasks.emptyCta", language)} onPress={() => router.push("/new/intro" as any)} />
            <SecondaryButton label={t("explore.myPathCta", language)} onPress={() => router.push("/my-path" as any)} />
          </View>
        ) : (
          <>
            {projects.length > 0 ? (
              <GroupedSection title={t("tasks.projectsSection", language)}>
                {projects.map((project, index) => (
                  <ProjectRow key={project.id} project={project} isLast={index === projects.length - 1} />
                ))}
              </GroupedSection>
            ) : null}

            {summaries.length > 0 ? (
              <GroupedSection title={t("tasks.businessesSection", language)}>
                {summaries.map((entry, index) => (
                  <BusinessPlanRow key={entry.business.id} entry={entry} isLast={index === summaries.length - 1} />
                ))}
              </GroupedSection>
            ) : null}

            {projects.length === 0 && summaries.length > 0 ? (
              <Text style={styles.hint}>{t("tasks.emptyProjectsHint", language)}</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

function ProjectRow({ project, isLast }: { project: Project; isLast?: boolean }) {
  const { language } = useLanguage();
  const title = project.name || project.market_gap_text || t("myPathList.untitled", language);
  const stageLabel = t(STAGE_LABEL_KEY[project.stage], language);

  return (
    <ListRow
      leading={
        <View style={styles.projectGlyph}>
          <ActionGlyph kind="path" />
        </View>
      }
      title={title}
      subtitle={tf("tasks.projectPhaseMeta", language, { stage: stageLabel })}
      onPress={() => router.push(projectHubHref(project.id) as any)}
      isLast={isLast}
    />
  );
}

function BusinessPlanRow({ entry, isLast }: { entry: BusinessPlanSummary; isLast?: boolean }) {
  const { language } = useLanguage();
  const progress = planProgressLabel(entry.business.id);
  const subtitle =
    entry.openCount === 0
      ? t("tasks.allDoneBadge", language)
      : progress
        ? tf("explore.businessPlanProgress", language, {
            resolved: progress.resolved,
            total: progress.total,
          })
        : entry.business.sector;

  return (
    <ListRow
      leading={<BusinessAvatar name={entry.business.name} sector={entry.business.sector} />}
      title={entry.business.name}
      subtitle={subtitle}
      onPress={() => router.push(`/business/${entry.business.id}` as any)}
      isLast={isLast}
    />
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space.section, gap: 8 },
  empty: {
    ...panelSurface(),
    gap: 12,
    alignItems: "flex-start",
  },
  emptyTitle: { ...typography.cardTitle },
  emptyBody: { ...typography.cardBody, color: colors.textSecondary },
  hint: { ...typography.cardBody, color: colors.textMuted, marginTop: space.section },
  projectGlyph: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
