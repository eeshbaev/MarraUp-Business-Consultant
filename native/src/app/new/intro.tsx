import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { InfoPill } from "@/components/ui/InfoPill";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { findAssessmentResumeTarget } from "@/lib/assessment/progress";
import { t, tf } from "@/lib/ui-copy";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { colors, panelSurface, space, type as typography } from "@/lib/theme";

export default function AssessIntroScreen() {
  const { language } = useLanguage();
  const { sector, name } = useLocalSearchParams<{ sector?: string; name?: string }>();
  const [resume, setResume] = useState(() => findAssessmentResumeTarget());

  useFocusEffect(
    useCallback(() => {
      setResume(findAssessmentResumeTarget());
    }, [])
  );

  function startNew() {
    router.push({ pathname: "/new", params: { sector, name } });
  }

  function continueSaved() {
    if (!resume) return;
    router.push(`/assessment/${resume.businessId}` as any);
  }

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  return (
    <ScreenScaffold background="flat" safeBottom>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={scrollContent}>
          <FlowBackHeader backLabel={t("tab.explore", language)} onBack={() => router.replace("/(tabs)/explore" as any)} />
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>{t("assessIntro.title", language)}</Text>
            <Text style={styles.body}>{t("assessIntro.whyBody", language)}</Text>
            <Text style={styles.wherePlan}>{t("assessIntro.wherePlan", language)}</Text>
            <View style={styles.pillRow}>
              <InfoPill label={t("assessIntro.chipTime", language)} />
              <InfoPill label={t("assessIntro.chipSave", language)} />
              <InfoPill label={t("assessIntro.chipScore", language)} />
            </View>
          </View>

          {resume ? (
            <View style={styles.resumeCard}>
              <Text style={styles.resumeTitle}>{tf("assessIntro.continue", language, { name: resume.businessName })}</Text>
              <Text style={styles.resumeMeta}>
                {tf("assessIntro.savedProgress", language, { current: resume.answered, total: resume.total })}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          {resume ? (
            <>
              <PrimaryButton label={tf("assessIntro.continue", language, { name: resume.businessName })} onPress={continueSaved} />
              <SecondaryButton label={t("assessIntro.start", language)} onPress={startNew} />
            </>
          ) : (
            <PrimaryButton label={t("assessIntro.start", language)} onPress={startNew} />
          )}
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: {
    ...panelSurface({ marginTop: 12 }),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: space.section,
    gap: 12,
  },
  heroEyebrow: { ...typography.cardTitle, fontSize: 20, color: colors.accentDark },
  body: { ...typography.screenSubtitle, fontSize: 16, lineHeight: 24, marginTop: 0 },
  wherePlan: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  resumeCard: {
    marginTop: space.section,
    ...panelSurface(),
    padding: space.card + 4,
    borderColor: colors.accentSoftBorder,
    backgroundColor: colors.accentSoft,
    gap: 6,
  },
  resumeTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  resumeMeta: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
