import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { FlowBackHeader } from "../../../components/FlowBackHeader";
import { GroupedSection } from "../../../components/ui/GroupedSection";
import { ListRow } from "../../../components/ui/ListRow";
import { ScreenScaffold } from "../../../components/ui/ScreenScaffold";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { useLanguage } from "../../../lib/LanguageContext";
import { useScrollContentStyle } from "../../../lib/layout-metrics";
import { t } from "../../../lib/ui-copy";
import type { Language } from "../../../lib/types";
import { space, type as typography } from "../../../lib/theme";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
];

export default function SettingsScreen() {
  const { language, setLanguage } = useLanguage();
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });

  return (
    <ScreenScaffold safeBottom>
      <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
        <FlowBackHeader backLabel={t("header.profile.title", language)} onBack={() => router.back()} />
        <Text style={typography.screenTitle}>{t("common.settings", language)}</Text>

        <GroupedSection title={t("common.language", language)}>
          <View style={styles.langPad}>
            <SegmentedControl
              segments={LANGUAGES.map((l) => ({ id: l.code, label: l.label }))}
              value={language}
              onChange={(id) => setLanguage(id as Language)}
            />
          </View>
        </GroupedSection>

        <GroupedSection>
          <ListRow
            title={t("common.notifications", language)}
            onPress={() => router.push("/profile/notifications")}
          />
          <ListRow title={t("common.privacy", language)} onPress={() => router.push("/profile/privacy")} isLast />
        </GroupedSection>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  langPad: { padding: space.card },
});
