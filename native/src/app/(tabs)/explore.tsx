import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { BrandWordmark } from "../../components/ui/BrandWordmark";
import { ActionCard } from "../../components/ui/ActionCard";
import { ScreenScaffold } from "../../components/ui/ScreenScaffold";
import { useLanguage } from "../../lib/LanguageContext";
import { t, tf } from "../../lib/ui-copy";
import { getUserProfile } from "../../lib/db";
import { getAssessExploreResume, getMyPathResume } from "../../lib/resume-context";
import { useScrollContentStyle } from "../../lib/layout-metrics";
import { colors, space, type as typography } from "../../lib/theme";

export default function ExploreScreen() {
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [myPathResume, setMyPathResume] = useState(() => getMyPathResume());
  const [assessResume, setAssessResume] = useState(() => getAssessExploreResume());
  const [displayName, setDisplayName] = useState(() => getUserProfile()?.display_name?.trim() ?? "");

  const load = useCallback(() => {
    setMyPathResume(getMyPathResume());
    setAssessResume(getAssessExploreResume());
    setDisplayName(getUserProfile()?.display_name?.trim() ?? "");
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

  return (
    <ScreenScaffold>
      <ScrollView
        contentContainerStyle={scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.exploreHeader}>
          <View style={styles.brandRow}>
            <BrandWordmark size="xl" />
            <Text style={styles.brandDash}> — </Text>
            <Text style={styles.brandRole}>{t("header.explore.brandRole", language)}</Text>
          </View>
          <Text style={styles.welcomeLine}>
            {displayName
              ? tf("header.explore.welcomeTitle", language, { name: displayName })
              : t("header.explore.welcomeTitleGuest", language)}
          </Text>
          <Text style={styles.startPrompt}>{t("header.explore.subtitle", language)}</Text>
        </View>

        <Text style={typography.sectionLabel}>{t("explore.pathsSection", language)}</Text>

        <ActionCard
          featured
          glyph="path"
          badge={t("explore.pathBadgeNew", language)}
          title={t("explore.myPathTitle", language)}
          cta={t("explore.myPathCta", language)}
          resume={myPathResume}
          onPress={() => router.push("/my-path" as any)}
        />

        <ActionCard
          featured
          glyph="assess"
          badge={t("explore.pathBadgeLive", language)}
          title={t("explore.runningTitle", language)}
          cta={t("explore.runningCta", language)}
          resume={assessResume}
          onPress={() => router.push("/new/intro" as any)}
        />
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  exploreHeader: { marginBottom: space.section, gap: 8 },
  brandRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 0,
    rowGap: 4,
  },
  brandDash: { fontSize: 17, fontWeight: "500", color: colors.textMuted },
  brandRole: {
    flex: 1,
    minWidth: 160,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  welcomeLine: { ...typography.screenTitle, marginTop: 4 },
  startPrompt: { ...typography.screenSubtitle, marginTop: 0 },
});
