import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { AppPressable } from "@/components/ui/AppPressable";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import { clearDiscoverAnswers, getDiscoverAnswers, markDirectionExplored } from "@/lib/db";
import { rankDirections } from "@/lib/discover/engine";
import { explainDirection, directionDisplayName } from "@/lib/discover/explain";
import { findSectorGroup } from "@/lib/sector-taxonomy";
import type { SectorId } from "@/lib/discover/sectors";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { colors, panelSurface, radii, space, type as typography } from "@/lib/theme";

export default function DiscoverResultsScreen() {
  const { language } = useLanguage();
  const record = getDiscoverAnswers();
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  if (!record) {
    return (
      <ScreenScaffold background="flat" safeBottom>
        <View style={styles.emptyPage}>
          <Text style={typography.screenSubtitle}>{t("launchNew.notStartedYet", language)}</Text>
          <PrimaryButton label={t("launchNew.startNow", language)} onPress={() => router.push("/my-path/start" as any)} />
        </View>
      </ScreenScaffold>
    );
  }

  const directions = rankDirections({ tags: record.tags, hardExclusions: record.hardExclusions as SectorId[] });

  function exploreDirection(sectorId: string) {
    markDirectionExplored();
    router.push(`/market?sector=${encodeURIComponent(sectorId)}` as any);
  }

  function confirmDeleteProfile() {
    Alert.alert(t("common.delete", language), t("discover.results.deleteConfirm", language), [
      { text: t("common.cancel", language), style: "cancel" },
      {
        text: t("common.delete", language),
        style: "destructive",
        onPress: () => {
          clearDiscoverAnswers();
          router.replace("/my-path/start" as any);
        },
      },
    ]);
  }

  const subtitleKey = directions.length === 1 ? "discover.results.subtitleOne" : "discover.results.subtitleMany";

  return (
    <ScreenScaffold background="flat" safeBottom>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={scrollContent}>
          <FlowBackHeader backLabel={t("common.backToProfile", language)} onBack={() => router.push("/(tabs)/profile" as any)} />

          <Text style={typography.screenTitle}>{t("discover.results.title", language)}</Text>
          <Text style={[typography.screenSubtitle, styles.lede]}>{t(subtitleKey, language)}</Text>

          {directions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t("discover.results.empty", language)}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {directions.map((d, index) => {
                const group = findSectorGroup(d.sectorId);
                const label = group ? group.name[language] : d.sectorId;
                const featured = index === 0;
                return (
                  <View key={d.sectorId} style={[styles.card, featured && styles.cardFeatured]}>
                    <View style={styles.cardTop}>
                      <View style={[styles.rankBadge, featured && styles.rankBadgeFeatured]}>
                        <Text style={[styles.rankText, featured && styles.rankTextFeatured]}>{index + 1}</Text>
                      </View>
                      <View style={styles.cardCopy}>
                        <Text style={featured ? styles.cardBadgeAccent : styles.cardBadgeMuted}>
                          {t("discover.results.cardBadge", language)}
                        </Text>
                        <Text style={styles.cardTitle}>{directionDisplayName(label, d.subSector)}</Text>
                        <Text style={styles.cardBody}>
                          <Text style={styles.cardBodyLabel}>{t("discover.results.whyLabel", language)}: </Text>
                          {explainDirection(d)}
                        </Text>
                      </View>
                    </View>
                    <AppPressable onPress={() => exploreDirection(d.sectorId)} style={[styles.ctaRow, featured && styles.ctaRowFeatured]}>
                      <Text style={[styles.cta, featured && styles.ctaFeatured]}>{t("discover.results.exploreCta", language)}</Text>
                      <Text style={styles.ctaChevron}>›</Text>
                    </AppPressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <View style={styles.footerActions}>
            <View style={styles.footerBtnCol}>
              <SecondaryButton label={t("common.delete", language)} onPress={confirmDeleteProfile} />
            </View>
            <View style={styles.footerBtnCol}>
              <PrimaryButton label={t("discover.results.startProject", language)} onPress={() => router.push("/my-path/choose" as any)} />
            </View>
          </View>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  emptyPage: { flex: 1, paddingHorizontal: space.screenX, paddingTop: space.section, gap: 20 },
  lede: { marginBottom: 8 },
  list: { marginTop: space.section, gap: 14 },
  card: {
    ...panelSurface(),
    padding: space.card + 4,
  },
  cardFeatured: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeFeatured: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoftBorder,
  },
  rankText: { fontSize: 16, fontWeight: "700", color: colors.textMuted },
  rankTextFeatured: { color: colors.accentDark },
  cardCopy: { flex: 1, gap: 6 },
  cardBadgeAccent: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.accentDark,
  },
  cardBadgeMuted: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textFaint,
  },
  cardTitle: { ...typography.cardTitle, fontSize: 18 },
  cardBody: { ...typography.cardBody, marginTop: 2 },
  cardBodyLabel: { fontWeight: "600", color: colors.text },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ctaRowFeatured: {
    borderTopColor: colors.accentSoftBorder,
    backgroundColor: colors.accentSoft,
    marginHorizontal: -(space.card + 4),
    marginBottom: -(space.card + 4),
    paddingHorizontal: space.card + 4,
    paddingBottom: 14,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  cta: { fontSize: 15, fontWeight: "600", color: colors.accentDark },
  ctaFeatured: { color: colors.accent },
  ctaChevron: { fontSize: 22, fontWeight: "300", color: colors.accentDark, marginTop: -2 },
  emptyCard: {
    marginTop: space.section,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    padding: space.card + 4,
  },
  emptyText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  footerActions: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  footerBtnCol: { flex: 1 },
});
