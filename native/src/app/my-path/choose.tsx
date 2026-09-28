import React from "react";
import { Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { ActionCard } from "@/components/ui/ActionCard";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import { getDiscoverAnswers } from "@/lib/db";
import { useScrollContentStyle } from "@/lib/layout-metrics";
import { type as typography } from "@/lib/theme";

export default function MyPathChooseScreen() {
  const { language } = useLanguage();
  const discover = getDiscoverAnswers();
  const questionnaireHref = discover?.completed_at ? "/my-path/results" : "/my-path/start";
  const questionnaireCta = discover?.completed_at ? t("explore.notSureCtaContinue", language) : t("explore.notSureCta", language);
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });

  return (
    <ScreenScaffold safeBottom>
      <ScrollView contentContainerStyle={scrollContent}>
        <FlowBackHeader backLabel={t("myPathList.title", language)} onBack={() => router.back()} />
        <Text style={styles.title}>{t("myPath.chooseTitle", language)}</Text>

        <ActionCard
          featured
          glyph="quiz"
          title={t("explore.notSureTitle", language)}
          body={t("explore.notSureBody", language)}
          cta={questionnaireCta}
          onPress={() => router.push(questionnaireHref as any)}
        />

        <ActionCard
          glyph="idea"
          title={t("myPath.chooseOwnTitle", language)}
          body={t("myPath.chooseOwnBody", language)}
          cta={t("myPath.chooseOwnCta", language)}
          onPress={() => router.push("/my-path/new?own=1" as any)}
        />
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.screenTitle, fontSize: 26, marginTop: 4, marginBottom: 18 },
});
