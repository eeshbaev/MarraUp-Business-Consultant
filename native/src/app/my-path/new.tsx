import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { AppPressable } from "@/components/ui/AppPressable";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import { getUserProfile, getDiscoverAnswers } from "@/lib/db";
import { projectFindHref, startLaunchProjectFromGap, startLaunchProjectFromIdea } from "@/lib/launch-project";
import { MARKET_RESEARCH } from "@/lib/market-research-data";
import { findSectorGroup } from "@/lib/sector-taxonomy";
import { rankDirections } from "@/lib/discover/engine";
import type { CountryCode } from "@/lib/market-copy";
import type { SectorId } from "@/lib/discover/sectors";
import { cardSurface, colors, radii, space, type as typography } from "@/lib/theme";

export default function NewProjectScreen() {
  const { language } = useLanguage();
  const { own } = useLocalSearchParams<{ own?: string }>();
  const ownOnly = own === "1" || own === "true";

  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const profile = getUserProfile();
  const countryData = profile ? MARKET_RESEARCH[profile.country as CountryCode] : undefined;
  const discoverRecord = getDiscoverAnswers();

  const eligibleSectorIds = useMemo(() => {
    if (!discoverRecord?.completed_at) return null;
    const directions = rankDirections({
      tags: discoverRecord.tags,
      hardExclusions: discoverRecord.hardExclusions as SectorId[],
    });
    return new Set(directions.map((d) => d.sectorId as string));
  }, [discoverRecord]);

  const gapItems = useMemo(
    () =>
      countryData
        ?.filter((sector) => eligibleSectorIds?.has(sector.sectorId))
        .flatMap((sector) =>
          (sector.gaps ?? []).slice(0, 1).map((gap) => ({
            sectorId: sector.sectorId,
            sectorName: findSectorGroup(sector.sectorId)?.name[language] ?? sector.sectorId,
            text: gap.description,
          }))
        ) ?? [],
    [countryData, language, eligibleSectorIds]
  );

  function startFromGap(sectorId: string, text: string) {
    try {
      setError(null);
      const project = startLaunchProjectFromGap(sectorId, text);
      router.push(projectFindHref(project.id) as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function startFromSelf() {
    const trimmed = description.trim();
    if (!trimmed) {
      setError(t("newProject.placeholder", language));
      return;
    }
    try {
      setError(null);
      const project = startLaunchProjectFromIdea(trimmed);
      router.push(projectFindHref(project.id) as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const backHref = ownOnly ? "/my-path/choose" : "/my-path/results";

  if (ownOnly) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.page}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <FlowBackHeader backLabel={t("myPath.chooseTitle", language)} onBack={() => router.push("/my-path/choose" as any)} />
            <Text style={styles.title}>{t("myPath.chooseOwnTitle", language)}</Text>
            <Text style={styles.subtitle}>{t("myPath.chooseOwnBody", language)}</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder={t("newProject.placeholder", language)}
              placeholderTextColor={colors.textFaint}
              textAlignVertical="top"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton
              label={t("newProject.start", language)}
              onPress={startFromSelf}
              disabled={!description.trim()}
              hint={!description.trim() ? t("newProject.placeholder", language) : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FlowBackHeader backLabel={t("discover.seeDirections", language)} onBack={() => router.push(backHref as any)} />
        <Text style={styles.title}>{t("newProject.title", language)}</Text>
        <Text style={styles.subtitle}>{t("newProject.gapHint", language)}</Text>

        {!discoverRecord?.completed_at ? (
          <View style={styles.discoverGate}>
            <Text style={styles.discoverGateTitle}>{t("newProject.needDiscoverTitle", language)}</Text>
            <Text style={styles.discoverGateBody}>{t("newProject.needDiscoverBody", language)}</Text>
            <PrimaryButton label={t("newProject.startQuestionnaire", language)} onPress={() => router.push("/my-path/start" as any)} />
          </View>
        ) : gapItems.length === 0 ? (
          <Text style={styles.emptyText}>{t("newProject.noGaps", language)}</Text>
        ) : (
          <View style={styles.gapList}>
            {gapItems.slice(0, 12).map((gap) => (
              <AppPressable key={gap.sectorId} style={styles.gapCard} onPress={() => startFromGap(gap.sectorId, gap.text)}>
                <Text style={styles.gapSector}>{gap.sectorName}</Text>
                <Text style={styles.gapText}>{gap.text}</Text>
              </AppPressable>
            ))}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: space.screenX, paddingTop: space.screenTop, paddingBottom: space.section },
  title: { ...typography.screenTitle, fontSize: 24, marginTop: 4 },
  subtitle: { ...typography.screenSubtitle, marginTop: 6, marginBottom: 16 },
  gapList: { gap: 12 },
  emptyText: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  gapCard: { ...cardSurface(), padding: space.card },
  gapSector: { fontSize: 12, fontWeight: "600", color: colors.accentDark, marginBottom: 6 },
  gapText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  textArea: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    backgroundColor: colors.bgElevated,
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    paddingBottom: space.screenBottom - 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  discoverGate: {
    ...cardSurface(),
    padding: space.card,
    borderColor: colors.accentSoftBorder,
    backgroundColor: colors.accentSoft,
    gap: 10,
  },
  discoverGateTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  discoverGateBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  error: { marginTop: 16, fontSize: 14, color: colors.danger },
});
