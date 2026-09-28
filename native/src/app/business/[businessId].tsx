import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { GroupedSection } from "@/components/ui/GroupedSection";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { BusinessAvatar } from "@/components/ui/BusinessAvatar";
import { draftAnsweredCount } from "@/lib/assessment/progress";
import { getBusiness, getDraftIntake, getLatestAssessment, getLatestPlan } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { useScrollContentStyle } from "@/lib/layout-metrics";
import { t, tf } from "@/lib/ui-copy";
import { colors, space, type as typography } from "@/lib/theme";

export default function BusinessHubScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const id = Array.isArray(businessId) ? businessId[0] : businessId;
  const { language } = useLanguage();
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTick((n) => n + 1);
    }, [])
  );

  const business = id ? getBusiness(id) : null;
  const assessment = id ? getLatestAssessment(id) : null;
  const plan = id ? getLatestPlan(id) : null;
  const intake = id ? getDraftIntake(id) : null;
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });

  void tick;

  if (!business || !id) {
    return (
      <ScreenScaffold safeBottom>
        <View style={{ padding: space.screenX }}>
          <Text style={typography.screenTitle}>{t("common.notFound", language)}</Text>
        </View>
      </ScreenScaffold>
    );
  }

  const inProgressAssessment = !assessment && intake;
  const progress = inProgressAssessment ? draftAnsweredCount(intake, id) : null;
  const planProgress =
    plan != null
      ? {
          resolved: plan.action_plan.filter((i) => i.state === "resolved").length,
          total: plan.action_plan.length,
        }
      : null;

  type HubRow = { key: string; title: string; subtitle?: string; href: string };
  const hubRows: HubRow[] = [];
  if (inProgressAssessment) {
    hubRows.push({
      key: "assessment",
      title: t("business.hub.continueAssessment", language),
      subtitle: progress
        ? tf("assessIntro.savedProgress", language, { current: progress.answered, total: progress.total })
        : undefined,
      href: `/assessment/${id}`,
    });
  }
  if (assessment) {
    hubRows.push({
      key: "scores",
      title: t("business.hub.scores", language),
      subtitle: t("business.hub.scoresHint", language),
      href: `/results/${id}`,
    });
  }
  if (plan && planProgress) {
    hubRows.push({
      key: "plan",
      title: t("business.hub.actionPlan", language),
      subtitle: tf("explore.businessPlanProgress", language, {
        resolved: planProgress.resolved,
        total: planProgress.total,
      }),
      href: `/plan/${id}`,
    });
  }

  return (
    <ScreenScaffold background="flat" safeBottom>
      <ScrollView contentContainerStyle={scrollContent}>
        <FlowBackHeader backLabel={t("tab.tasks", language)} onBack={() => router.replace("/(tabs)/tasks" as any)} />
        <View style={styles.hero}>
          <BusinessAvatar name={business.name} sector={business.sector} />
          <Text style={typography.screenTitle}>{business.name}</Text>
          <Text style={typography.screenSubtitle}>{business.sector}</Text>
        </View>

        <GroupedSection title={t("business.hub.section", language)}>
          {hubRows.map((row, index) => (
            <ListRow
              key={row.key}
              title={row.title}
              subtitle={row.subtitle}
              onPress={() => router.push(row.href as any)}
              isLast={index === hubRows.length - 1}
            />
          ))}
        </GroupedSection>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "flex-start", gap: 8, marginBottom: space.section },
});
