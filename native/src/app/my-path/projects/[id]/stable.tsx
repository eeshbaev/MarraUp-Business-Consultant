import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import {
  getProject,
  listClosedCycles,
  listOperationsNotes,
  getFounderDependence,
  addOperationsNote,
  upsertFounderDependence,
  markStableViewIntroShown,
} from "@/lib/db";
import { computeStableBusinessView } from "@/lib/journey/stable-business-view";

const DEPENDENCE_FIELDS: { key: "only_i_sell" | "only_i_deliver" | "only_i_know_process" | "process_undocumented" | "no_backup"; labelKey: string }[] = [
  { key: "only_i_sell", labelKey: "stable.dep.onlyISell" },
  { key: "only_i_deliver", labelKey: "stable.dep.onlyIDeliver" },
  { key: "only_i_know_process", labelKey: "stable.dep.onlyIKnowProcess" },
  { key: "process_undocumented", labelKey: "stable.dep.processUndocumented" },
  { key: "no_backup", labelKey: "stable.dep.noBackup" },
];

export default function StableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();
  const [reloadKey, setReloadKey] = useState(0);
  useFocusEffect(useCallback(() => { setReloadKey((k) => k + 1); }, []));

  const project = useMemo(() => getProject(id), [id, reloadKey]);
  const closedCycles = useMemo(() => listClosedCycles(id), [id, reloadKey]);
  const notes = useMemo(() => listOperationsNotes(id), [id, reloadKey]);
  const dependence = useMemo(() => getFounderDependence(id), [id, reloadKey]);
  const view = useMemo(() => computeStableBusinessView(closedCycles, dependence, language), [closedCycles, dependence, language]);

  const [noteBody, setNoteBody] = useState("");
  const [depState, setDepState] = useState(() => ({
    only_i_sell: dependence?.only_i_sell ?? false,
    only_i_deliver: dependence?.only_i_deliver ?? false,
    only_i_know_process: dependence?.only_i_know_process ?? false,
    process_undocumented: dependence?.process_undocumented ?? false,
    no_backup: dependence?.no_backup ?? false,
  }));

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showIntro = !project.stable_view_intro_shown_at;

  function addNote() {
    const body = noteBody.trim();
    if (!body) return;
    addOperationsNote(id, body);
    setNoteBody("");
    setReloadKey((k) => k + 1);
  }

  function toggleDep(key: keyof typeof depState) {
    setDepState((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function saveDependence() {
    upsertFounderDependence(id, depState);
    setReloadKey((k) => k + 1);
  }

  function dismissIntro() {
    markStableViewIntroShown(id);
    setReloadKey((k) => k + 1);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.push(`/my-path/projects/${id}/revenue` as any)}>
          <Text style={styles.backLink}>{t("stable.backToRevenue", language)}</Text>
        </Pressable>

        {showIntro && (
          <View style={styles.introBox}>
            <Text style={styles.introBody}>{t("stable.introBody", language)}</Text>
            <Pressable onPress={dismissIntro}>
              <Text style={styles.introDismiss}>{t("stable.gotIt", language)}</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.subtitle}>{t("stable.subtitle", language)}</Text>

        {!view.hasEnoughData ? (
          <Text style={styles.needsCycle}>{t("stable.needsCycle", language)}</Text>
        ) : (
          <View style={styles.summaryBox}>
            {view.summaryLines.map((l, i) => (
              <Text key={i} style={styles.summaryLine}>
                {l}
              </Text>
            ))}
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>{t("stable.operations", language)}</Text>
          <View style={styles.card}>
            {notes.slice(0, 5).map((n) => (
              <Text key={n.id} style={styles.noteLine}>
                {n.body}
              </Text>
            ))}
            <View style={styles.noteRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t("stable.addNote", language)}
                value={noteBody}
                onChangeText={setNoteBody}
              />
              <Pressable style={styles.smallOutlineButton} onPress={addNote}>
                <Text style={styles.smallOutlineButtonText}>{t("journey.add", language)}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>{t("stable.founderDependence", language)}</Text>
          <View style={styles.card}>
            {DEPENDENCE_FIELDS.map((f) => (
              <Pressable key={f.key} style={styles.checkRow} onPress={() => toggleDep(f.key)}>
                <Switch value={depState[f.key]} onValueChange={() => toggleDep(f.key)} />
                <Text style={styles.checkLabel}>{t(f.labelKey, language)}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.primaryButton} onPress={saveDependence}>
              <Text style={styles.primaryButtonText}>{t("journey.save", language)}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.assessmentButton} onPress={() => router.push("/new/intro" as any)}>
          <Text style={styles.assessmentButtonText}>{t("stable.openAssessment", language)}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },
  backLink: { fontSize: 12, color: "#737373", marginBottom: 12 },
  introBox: { marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#f5f5f5", padding: 12 },
  introBody: { fontSize: 11, lineHeight: 16, color: "#404040" },
  introDismiss: { marginTop: 8, fontSize: 10.5, fontWeight: "600", color: "#737373", textDecorationLine: "underline" },
  title: { fontSize: 18, fontWeight: "600", color: "#171717" },
  subtitle: { marginTop: 2, fontSize: 12, color: "#737373" },
  needsCycle: { marginTop: 16, fontSize: 12, color: "#737373" },
  summaryBox: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 12, gap: 4 },
  summaryLine: { fontSize: 11, lineHeight: 16, color: "#404040" },
  sectionLabel: { marginBottom: 6, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, color: "#a3a3a3" },
  card: { borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 12, gap: 6 },
  noteLine: { fontSize: 11, color: "#404040" },
  noteRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: "#171717", backgroundColor: "#fff" },
  smallOutlineButton: { borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingHorizontal: 12, justifyContent: "center" },
  smallOutlineButtonText: { fontSize: 12, fontWeight: "600", color: "#404040" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkLabel: { flex: 1, fontSize: 11, color: "#404040" },
  primaryButton: { marginTop: 4, borderRadius: 8, backgroundColor: "#171717", paddingVertical: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  assessmentButton: { marginTop: 16, borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingVertical: 12, alignItems: "center" },
  assessmentButtonText: { fontSize: 12, fontWeight: "600", color: "#404040" },
});
