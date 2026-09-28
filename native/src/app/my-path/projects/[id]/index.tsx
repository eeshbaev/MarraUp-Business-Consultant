import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { GroupedSection } from "@/components/ui/GroupedSection";
import { ListRow } from "@/components/ui/ListRow";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { getProject } from "@/lib/db";
import { listProjectStageRows } from "@/lib/journey/project-phases";
import { projectStageHref } from "@/lib/journey/stage-href";
import { useLanguage } from "@/lib/LanguageContext";
import { useScrollContentStyle } from "@/lib/layout-metrics";
import { t } from "@/lib/ui-copy";
import { colors, space, type as typography } from "@/lib/theme";

export default function ProjectHubScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const projectId = Array.isArray(idParam) ? idParam[0] : idParam;
  const { language } = useLanguage();
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTick((n) => n + 1);
    }, [])
  );

  const project = projectId ? getProject(projectId) : null;
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });
  void tick;

  if (!project || !projectId) {
    return (
      <ScreenScaffold safeBottom>
        <View style={{ padding: space.screenX }}>
          <Text style={typography.screenTitle}>{t("common.notFound", language)}</Text>
        </View>
      </ScreenScaffold>
    );
  }

  const stages = listProjectStageRows(project);
  const title = project.name || project.market_gap_text || t("myPathList.untitled", language);

  return (
    <ScreenScaffold background="flat" safeBottom>
      <ScrollView contentContainerStyle={[scrollContent, styles.scroll]}>
        <FlowBackHeader backLabel={t("journey.backToMyPath", language)} onBack={() => router.replace("/my-path" as any)} />
        <View style={styles.hero}>
          <Text style={typography.screenTitle}>{title}</Text>
          <Text style={typography.screenSubtitle}>{t("project.hub.subtitle", language)}</Text>
        </View>

        <PrimaryButton label={t("project.hub.continue", language)} onPress={() => router.push(projectStageHref(project) as any)} />

        <GroupedSection title={t("project.hub.phasesSection", language)}>
          {stages.map((row, index) => (
            <ListRow
              key={row.stage}
              title={t(row.labelKey, language)}
              subtitle={
                row.current
                  ? t("project.hub.phaseCurrent", language)
                  : row.achieved
                    ? t("project.hub.phaseDone", language)
                    : t("project.hub.phaseUpcoming", language)
              }
              onPress={() => router.push(row.href as any)}
              isLast={index === stages.length - 1}
            />
          ))}
        </GroupedSection>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: space.section },
  hero: { gap: 8 },
});
