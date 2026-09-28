import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { popOrReplace } from "@/lib/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t, tf } from "@/lib/ui-copy";
import { getProject, getCurrentCycle, getPreviousCycle, updateCycleFields, closeCycleAndOpenNext, type RevenueCycle } from "@/lib/db";
import { daysIntoCycle, isCycleDue } from "@/lib/journey/revenue-cycle";
import { summarizeCycle } from "@/lib/journey/revenue-interpretation";

const NUM_FIELDS: { key: keyof RevenueCycle; labelKey: string }[] = [
  { key: "money_invested", labelKey: "revenue.field.moneyInvested" },
  { key: "revenue", labelKey: "revenue.revenue" },
  { key: "expenses", labelKey: "revenue.field.expenses" },
  { key: "new_customers", labelKey: "revenue.field.newCustomers" },
  { key: "total_customers", labelKey: "revenue.field.totalCustomers" },
  { key: "repeat_customers", labelKey: "revenue.field.repeatCustomers" },
  { key: "sales_count", labelKey: "revenue.field.salesCount" },
  { key: "avg_sale_value", labelKey: "revenue.field.avgSaleValue" },
];

export default function RevenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();
  const [reloadKey, setReloadKey] = useState(0);

  const project = useMemo(() => getProject(id), [id, reloadKey]);
  // getCurrentCycle() can INSERT a first cycle row when none exists yet, so
  // it must not run as a pure useMemo selector during render (React may
  // re-invoke it, e.g. under Strict Mode) — load it in an effect instead.
  const [cycle, setCycle] = useState<RevenueCycle | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      if (id) setCycle(getCurrentCycle(id));
    }, [id, reloadKey])
  );
  const previous = useMemo(() => (cycle ? getPreviousCycle(id, cycle.cycle_number) : null), [id, cycle, reloadKey]);

  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [recurringCommitments, setRecurringCommitments] = useState("");
  const [notes, setNotes] = useState("");

  const [reviewing, setReviewing] = useState(false);
  const [reviewWhatHappened, setReviewWhatHappened] = useState("");
  const [reviewWhatChanged, setReviewWhatChanged] = useState("");
  const [reviewNeedsAttention, setReviewNeedsAttention] = useState("");
  const [reviewNextStep, setReviewNextStep] = useState("");

  if (!project || !cycle) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>{project ? "" : "Not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const day = Math.round(daysIntoCycle(cycle));
  const due = isCycleDue(cycle);
  const netCash = (cycle.revenue ?? 0) - (cycle.expenses ?? 0);
  const summary = summarizeCycle(cycle, previous, language);

  function openEdit() {
    const initial: Record<string, string> = {};
    for (const f of NUM_FIELDS) {
      const v = (cycle as unknown as Record<string, number | null>)[f.key as string];
      initial[f.key as string] = v != null ? String(v) : "";
    }
    setFields(initial);
    setRecurringCommitments(cycle!.recurring_commitments ?? "");
    setNotes(cycle!.notes ?? "");
    setEditing(true);
  }

  function numOrNull(s: string): number | null {
    const trimmed = s.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  function saveCycle() {
    updateCycleFields(cycle!.id, {
      money_invested: numOrNull(fields.money_invested ?? ""),
      revenue: numOrNull(fields.revenue ?? ""),
      expenses: numOrNull(fields.expenses ?? ""),
      recurring_commitments: recurringCommitments.trim() || null,
      new_customers: numOrNull(fields.new_customers ?? ""),
      total_customers: numOrNull(fields.total_customers ?? ""),
      repeat_customers: numOrNull(fields.repeat_customers ?? ""),
      sales_count: numOrNull(fields.sales_count ?? ""),
      avg_sale_value: numOrNull(fields.avg_sale_value ?? ""),
      notes: notes.trim() || null,
    });
    setEditing(false);
    setReloadKey((k) => k + 1);
  }

  function submitReview() {
    closeCycleAndOpenNext(cycle!.id, {
      review_what_happened: reviewWhatHappened.trim(),
      review_what_changed: reviewWhatChanged.trim(),
      review_needs_attention: reviewNeedsAttention.trim(),
      review_next_step: reviewNextStep.trim(),
    });
    setReviewWhatHappened("");
    setReviewWhatChanged("");
    setReviewNeedsAttention("");
    setReviewNextStep("");
    setReviewing(false);
    setReloadKey((k) => k + 1);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => popOrReplace("/my-path")}>
          <Text style={styles.backLink}>{t("journey.backToMyPath", language)}</Text>
        </Pressable>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.subtitle}>{tf("revenue.day", language, { day })}</Text>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t("revenue.revenue", language)}</Text>
            <Text style={styles.statValue}>{cycle.revenue ?? "—"}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t("revenue.netCash", language)}</Text>
            <Text style={styles.statValue}>{netCash}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t("revenue.customers", language)}</Text>
            <Text style={styles.statValue}>
              {cycle.total_customers ?? "—"} · {cycle.repeat_customers ?? 0} {t("revenue.repeat", language)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t("revenue.cycle", language)}</Text>
            <Text style={styles.statValue}>#{cycle.cycle_number}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          {summary.map((line, i) => (
            <Text key={i} style={styles.summaryLine}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Pressable onPress={() => (editing ? setEditing(false) : openEdit())}>
            <Text style={styles.cardTitle}>{t("revenue.editCycle", language)}</Text>
          </Pressable>
          {editing && (
            <View style={{ marginTop: 10, gap: 8 }}>
              {NUM_FIELDS.map((f) => (
                <View key={f.key as string} style={styles.fieldRow}>
                  <Text style={styles.fieldRowLabel}>{t(f.labelKey, language)}</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={fields[f.key as string] ?? ""}
                    onChangeText={(v) => setFields((prev) => ({ ...prev, [f.key as string]: v }))}
                  />
                </View>
              ))}
              <View>
                <Text style={styles.fieldRowLabel}>{t("revenue.recurringCommitments", language)}</Text>
                <TextInput
                  style={styles.textarea}
                  value={recurringCommitments}
                  onChangeText={setRecurringCommitments}
                  multiline
                  numberOfLines={2}
                />
              </View>
              <View>
                <Text style={styles.fieldRowLabel}>{t("revenue.notes", language)}</Text>
                <TextInput style={styles.textarea} value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
              </View>
              <Pressable style={styles.primaryButton} onPress={saveCycle}>
                <Text style={styles.primaryButtonText}>{t("revenue.saveCycle", language)}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {due && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("revenue.day30Review", language)}</Text>
            {!reviewing ? (
              <Pressable style={[styles.smallOutlineButton, { marginTop: 8 }]} onPress={() => setReviewing(true)}>
                <Text style={styles.smallOutlineButtonText}>{t("revenue.day30Review", language)}</Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: 8, gap: 8 }}>
                <TextInput
                  style={styles.input}
                  placeholder={t("experiment.whatHappened", language)}
                  value={reviewWhatHappened}
                  onChangeText={setReviewWhatHappened}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("revenue.whatChanged", language)}
                  value={reviewWhatChanged}
                  onChangeText={setReviewWhatChanged}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("revenue.needsAttention", language)}
                  value={reviewNeedsAttention}
                  onChangeText={setReviewNeedsAttention}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("revenue.nextStep", language)}
                  value={reviewNextStep}
                  onChangeText={setReviewNextStep}
                />
                <Pressable style={styles.primaryButton} onPress={submitReview}>
                  <Text style={styles.primaryButtonText}>{t("revenue.closeCycle", language)}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={styles.footerRow}>
          <Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={() => router.push(`/my-path/projects/${id}/experiment` as any)}>
            <Text style={styles.secondaryButtonText}>{t("revenue.investigateInExperiment", language)}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={() => router.push(`/my-path/projects/${id}/stable` as any)}>
            <Text style={styles.secondaryButtonText}>{t("revenue.viewAsStable", language)}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },
  backLink: { fontSize: 12, color: "#737373", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "600", color: "#171717" },
  subtitle: { marginTop: 2, fontSize: 12, color: "#737373" },
  statGrid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: { width: "47%", borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 10 },
  statLabel: { fontSize: 10, color: "#a3a3a3" },
  statValue: { marginTop: 2, fontSize: 14, fontWeight: "600", color: "#171717" },
  summaryBox: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#f5f5f5", padding: 12, gap: 4 },
  summaryLine: { fontSize: 11, lineHeight: 16, color: "#404040" },
  card: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#262626" },
  fieldRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  fieldRowLabel: { fontSize: 11, color: "#525252", marginBottom: 4 },
  numInput: { width: 96, borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, color: "#171717", backgroundColor: "#fff", textAlign: "right" },
  textarea: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, padding: 8, fontSize: 12, color: "#171717", backgroundColor: "#fff", minHeight: 50, textAlignVertical: "top" },
  input: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: "#171717", backgroundColor: "#fff" },
  primaryButton: { marginTop: 4, borderRadius: 8, backgroundColor: "#171717", paddingVertical: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  smallOutlineButton: { alignSelf: "flex-start", borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingHorizontal: 10, paddingVertical: 6 },
  smallOutlineButtonText: { fontSize: 10.5, fontWeight: "600", color: "#404040" },
  footerRow: { marginTop: 16, flexDirection: "row", gap: 8 },
  secondaryButton: { borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { fontSize: 11, fontWeight: "600", color: "#404040" },
});
