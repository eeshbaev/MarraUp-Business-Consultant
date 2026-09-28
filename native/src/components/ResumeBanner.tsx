import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppPressable } from "./ui/AppPressable";
import { useLanguage } from "../lib/LanguageContext";
import type { ResumeSuggestion } from "../lib/resume-context";
import { t, tf } from "../lib/ui-copy";
import { colors, panelSurface, space, type as typography } from "../lib/theme";

type Props = {
  suggestion: ResumeSuggestion;
  /** Inside an ActionCard — no outer stripe/margin. */
  variant?: "standalone" | "embedded";
};

export function ResumeBanner({ suggestion, variant = "standalone" }: Props) {
  const embedded = variant === "embedded";
  const { language } = useLanguage();

  const body =
    suggestion.kind === "assessment"
      ? tf("explore.resumeAssessmentBody", language, {
          name: suggestion.businessName,
          current: suggestion.answered,
          total: suggestion.total,
        })
      : suggestion.kind === "plan"
        ? tf("explore.resumePlanBody", language, {
            name: suggestion.businessName,
            count: suggestion.openCount,
            plural: suggestion.openCount === 1 ? "" : "s",
          })
        : suggestion.kind === "discover"
          ? suggestion.completed
            ? t("explore.resumeDiscoverCompletedBody", language)
            : t("explore.resumeDiscoverProgressBody", language)
          : tf("explore.resumeMyPathBody", language, { name: suggestion.projectName || t("myPathList.untitled", language) });

  const onPress = () => {
    if (suggestion.kind === "assessment") {
      router.push(`/assessment/${suggestion.businessId}`);
    } else if (suggestion.kind === "plan") {
      router.push("/(tabs)/tasks" as any);
    } else {
      router.push(suggestion.href as any);
    }
  };

  return (
    <AppPressable onPress={onPress} style={[styles.banner, embedded && styles.bannerEmbedded]}>
      <Text style={styles.kicker}>{t("explore.resumeTitle", language)}</Text>
      <Text style={[typography.cardBody, embedded && styles.bodyEmbedded]}>{body}</Text>
      <Text style={styles.cta}>
        {t("explore.resumeCta", language)} ›
      </Text>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...panelSurface({ marginBottom: space.section - 4 }),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: space.card + 2,
    gap: 10,
  },
  bannerEmbedded: {
    marginBottom: 0,
    marginTop: 12,
    borderLeftWidth: 0,
    backgroundColor: colors.bgMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.card,
  },
  bodyEmbedded: { marginTop: 4 },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentDark,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cta: { fontSize: 15, fontWeight: "700", color: colors.accentDark },
});
