import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/ui-copy";
import { getNotifications } from "../../../lib/notifications";

// getNotifications() is ported verbatim from the web app; its hrefs use
// /plan/[id] (built) and /reassess/[id] (not yet built natively — the
// reassessment flow is a separate feature). Reassessment items fall back to
// the Results screen, the closest built equivalent, until /reassess exists.
export default function NotificationsScreen() {
  const { language } = useLanguage();
  const notifications = getNotifications(language);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("common.backToProfile", language)}</Text>
        </Pressable>
        <Text style={styles.title}>{t("notifications.title", language)}</Text>
        <Text style={styles.subtitle}>{t("notifications.subtitle", language)}</Text>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("notifications.empty", language)}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((n) => (
              <Pressable
                key={n.id}
                style={styles.row}
                onPress={() => {
                  const href = n.href.startsWith("/reassess/") ? `/results/${n.business_id}` : n.href;
                  router.push(href as never);
                }}
              >
                <Text style={styles.rowText}>{n.text}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  backLink: { fontSize: 14, color: "#737373", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "600", color: "#171717" },
  subtitle: { fontSize: 14, color: "#737373", marginTop: 2, marginBottom: 20 },
  empty: { borderRadius: 12, borderWidth: 1, borderColor: "#d4d4d4", borderStyle: "dashed", padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#737373", textAlign: "center" },
  list: { borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", overflow: "hidden" },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  rowText: { fontSize: 14, color: "#262626" },
});
