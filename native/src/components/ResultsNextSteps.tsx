import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton, SecondaryButton } from "./ui/PrimaryButton";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../lib/ui-copy";
import { cardSurface, colors, space, type as typography } from "../lib/theme";

type Props = {
  businessId: string;
  hasOpenPlanItems: boolean;
};

export function ResultsNextSteps({ businessId, hasOpenPlanItems }: Props) {
  const { language } = useLanguage();

  return (
    <View style={styles.card}>
      <Text style={typography.sectionLabel}>{t("results.nextStepsTitle", language)}</Text>
      <PrimaryButton
        label={t("results.viewPlan", language)}
        onPress={() => router.push(`/plan/${businessId}`)}
        style={styles.primary}
      />
      {hasOpenPlanItems ? null : (
        <SecondaryButton
          label={t("results.nextStepReassess", language)}
          onPress={() => router.push(`/reassess/${businessId}`)}
          style={styles.secondary}
        />
      )}
      <SecondaryButton
        label={t("results.nextStepMarket", language)}
        onPress={() => router.push("/(tabs)/market")}
        style={styles.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface(),
    padding: space.card,
    gap: 10,
    backgroundColor: colors.bgMuted,
  },
  primary: { marginTop: 4 },
  secondary: { marginTop: 0 },
});
