import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/ui-copy";

export default function PrivacyScreen() {
  const { language } = useLanguage();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("common.backToProfile", language)}</Text>
        </Pressable>
        <Text style={styles.title}>{t("privacy.title", language)}</Text>

        <View style={{ gap: 14 }}>
          <Text style={styles.p}>{t("privacy.p1", language)}</Text>
          <Text style={styles.p}>{t("privacy.p2", language)}</Text>
          <Text style={styles.p}>{t("privacy.p3", language)}</Text>
          <Text style={styles.p}>{t("privacy.p4", language)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  backLink: { fontSize: 14, color: "#737373", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "600", color: "#171717", marginBottom: 24 },
  p: { fontSize: 14, color: "#404040", lineHeight: 21 },
});
