import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import {
  getProject,
  listTestEntries,
  listCustomerMilestoneEvents,
  setTestSetup,
  addTestEntry,
  addCustomerMilestoneEvent,
  returnProjectToFind,
  archiveProject,
  TEST_QUESTIONS,
  type TestQuestion,
  type CustomerMilestoneType,
} from "@/lib/db";
import { BUSINESS_MODEL_TYPES, INDICATOR_EXAMPLES, type BusinessModelType } from "@/lib/journey/business-model-profiles";
import { summarizeTestEntries, hasPositiveSignal } from "@/lib/journey/test-signal";
import { popOrReplace } from "@/lib/navigation";

const QUESTION_KEY: Record<TestQuestion, string> = {
  reach: "test.question.reach",
  interest: "test.question.interest",
  usage: "test.question.usage",
  response: "test.question.response",
  economics: "test.question.economics",
};

const MILESTONE_OPTIONS: { key: CustomerMilestoneType; labelKey: string; emoji: string }[] = [
  { key: "customer", labelKey: "test.milestone.customer", emoji: "🎯" },
  { key: "payment", labelKey: "test.milestone.payment", emoji: "💰" },
  { key: "repeat", labelKey: "test.milestone.repeat", emoji: "🔁" },
];

export default function TestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();
  const [reloadKey, setReloadKey] = useState(0);
  useFocusEffect(useCallback(() => { setReloadKey((k) => k + 1); }, []));

  const project = useMemo(() => getProject(id), [id, reloadKey]);

  const [offering, setOffering] = useState("");
  const [customer, setCustomer] = useState("");
  const [price, setPrice] = useState("");
  const [channel, setChannel] = useState("");
  const [businessModelType, setBusinessModelType] = useState<BusinessModelType>("other");

  const [openQuestion, setOpenQuestion] = useState<TestQuestion | null>(null);
  const [entryBody, setEntryBody] = useState("");
  const [entryPositive, setEntryPositive] = useState(false);
  const [milestoneType, setMilestoneType] = useState<CustomerMilestoneType>("customer");

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasSetup = !!project.business_model_type;

  function submitSetup() {
    setTestSetup(id, {
      test_offering: offering.trim(),
      test_customer: customer.trim(),
      test_price: price.trim(),
      test_channel: channel.trim(),
      business_model_type: businessModelType,
    });
    setReloadKey((k) => k + 1);
  }

  if (!hasSetup) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => popOrReplace("/my-path")}>
            <Text style={styles.backLink}>{t("journey.backToMyPath", language)}</Text>
          </Pressable>
          <Text style={styles.title}>{t("test.setupTitle", language)}</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t("test.whatTesting", language)}</Text>
            <TextInput style={styles.input} value={offering} onChangeText={setOffering} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t("test.whoWith", language)}</Text>
            <TextInput style={styles.input} value={customer} onChangeText={setCustomer} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t("test.price", language)}</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t("test.channel", language)}</Text>
            <TextInput style={styles.input} value={channel} onChangeText={setChannel} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t("test.businessType", language)}</Text>
            <View style={styles.chipRow}>
              {BUSINESS_MODEL_TYPES.map((b) => (
                <Pressable
                  key={b.key}
                  style={[styles.chip, businessModelType === b.key && styles.chipActive]}
                  onPress={() => setBusinessModelType(b.key)}
                >
                  <Text style={[styles.chipText, businessModelType === b.key && styles.chipTextActive]}>{b.label[language]}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={submitSetup}>
            <Text style={styles.primaryButtonText}>{t("test.startTesting", language)}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const entries = listTestEntries(id);
  const milestones = listCustomerMilestoneEvents(id);
  const summary = summarizeTestEntries(entries);
  const hasMilestone = (mt: CustomerMilestoneType) => milestones.some((m) => m.event_type === mt);
  const bmType = project.business_model_type as BusinessModelType;
  const indicators = INDICATOR_EXAMPLES[bmType] ?? INDICATOR_EXAMPLES.other;
  const canRunExperiment = hasPositiveSignal(entries);

  function logMilestone() {
    addCustomerMilestoneEvent(id, milestoneType, null);
    setReloadKey((k) => k + 1);
  }

  function submitEntry(question: TestQuestion) {
    const body = entryBody.trim();
    if (!body) return;
    addTestEntry(id, question, body, entryPositive);
    setEntryBody("");
    setEntryPositive(false);
    setOpenQuestion(null);
    setReloadKey((k) => k + 1);
  }

  function backToFind() {
    returnProjectToFind(id);
    router.push(`/my-path/projects/${id}/find` as any);
  }

  function archive() {
    archiveProject(id);
    router.replace("/my-path" as any);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => popOrReplace("/my-path")}>
          <Text style={styles.backLink}>{t("journey.backToMyPath", language)}</Text>
        </Pressable>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.subtitle}>{t("test.subtitle", language)}</Text>

        <View style={styles.milestoneRow}>
          {MILESTONE_OPTIONS.map((m) => (
            <View key={m.key} style={[styles.milestoneBadge, hasMilestone(m.key) && styles.milestoneBadgeActive]}>
              <Text style={[styles.milestoneText, hasMilestone(m.key) && styles.milestoneTextActive]}>
                {m.emoji} {t(m.labelKey, language)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.milestoneLogRow}>
          <View style={styles.milestoneSelectRow}>
            {MILESTONE_OPTIONS.map((m) => (
              <Pressable key={m.key} style={[styles.smallChip, milestoneType === m.key && styles.chipActive]} onPress={() => setMilestoneType(m.key)}>
                <Text style={[styles.smallChipText, milestoneType === m.key && styles.chipTextActive]}>{t(m.labelKey, language)}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.logButton} onPress={logMilestone}>
            <Text style={styles.logButtonText}>{t("test.log", language)}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          {TEST_QUESTIONS.map((q) => {
            const isOpen = openQuestion === q;
            const qEntries = entries.filter((e) => e.question === q);
            const indicatorText =
              q === "reach"
                ? indicators.reach[language]
                : q === "interest"
                  ? indicators.interest[language]
                  : q === "usage"
                    ? indicators.usage[language]
                    : q === "response"
                      ? t("test.responseEconomicsExamples", language)
                      : t("test.priceEconomicsExamples", language);
            return (
              <View key={q} style={styles.card}>
                <Pressable
                  style={styles.cardHeader}
                  onPress={() => {
                    setOpenQuestion(isOpen ? null : q);
                    setEntryBody("");
                    setEntryPositive(false);
                  }}
                >
                  <Text style={styles.cardHeaderText}>{t(QUESTION_KEY[q], language)}</Text>
                  <Text style={styles.cardHeaderCount}>
                    {summary.positiveByQuestion[q]}/{summary.totalByQuestion[q]} {t("test.yes", language)}
                  </Text>
                </Pressable>
                {isOpen && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.hint}>{indicatorText}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t("test.logObservation", language)}
                      value={entryBody}
                      onChangeText={setEntryBody}
                    />
                    <View style={styles.entryRow}>
                      <Pressable style={styles.checkRow} onPress={() => setEntryPositive(!entryPositive)}>
                        <Switch value={entryPositive} onValueChange={setEntryPositive} />
                        <Text style={styles.checkLabel}>{t("test.countsAsYes", language)}</Text>
                      </Pressable>
                      <Pressable style={styles.smallPrimaryButton} onPress={() => submitEntry(q)}>
                        <Text style={styles.smallPrimaryButtonText}>{t("journey.add", language)}</Text>
                      </Pressable>
                    </View>
                    {qEntries.length > 0 && (
                      <View style={{ marginTop: 8, gap: 4 }}>
                        {qEntries.slice(0, 4).map((e) => (
                          <View key={e.id} style={styles.entryItem}>
                            <Text style={styles.entryItemText}>
                              {e.is_positive ? "✓ " : ""}
                              {e.body}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>
            {summary.totalEntries} {t("test.observationsLogged", language)}
          </Text>
          <Text style={styles.summaryBody}>
            {hasPositiveSignal(entries) ? t("test.positiveSignal", language) : t("test.noPositiveSignal", language)}
          </Text>

          <View style={{ marginTop: 10, gap: 8 }}>
            {canRunExperiment ? (
              <Pressable style={styles.primaryButton} onPress={() => router.push(`/my-path/projects/${id}/experiment` as any)}>
                <Text style={styles.primaryButtonText}>{t("test.runExperiment", language)}</Text>
              </Pressable>
            ) : (
              <View style={styles.disabledButton}>
                <Text style={styles.disabledButtonText}>{t("test.runExperimentDisabled", language)}</Text>
              </View>
            )}
            <Pressable style={styles.secondaryButton} onPress={backToFind}>
              <Text style={styles.secondaryButtonText}>{t("test.backToFind", language)}</Text>
            </Pressable>
            <Pressable style={styles.tertiaryButton} onPress={archive}>
              <Text style={styles.tertiaryButtonText}>{t("test.archive", language)}</Text>
            </Pressable>
          </View>
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
  field: { marginTop: 14, gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#737373" },
  input: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: "#171717", backgroundColor: "#fff", marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#171717", borderColor: "#171717" },
  chipText: { fontSize: 12, color: "#171717", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  primaryButton: { marginTop: 18, borderRadius: 8, backgroundColor: "#171717", paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  milestoneRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  milestoneBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#f5f5f5" },
  milestoneBadgeActive: { backgroundColor: "#dcfce7" },
  milestoneText: { fontSize: 10, fontWeight: "600", color: "#a3a3a3" },
  milestoneTextActive: { color: "#15803d" },
  milestoneLogRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" },
  milestoneSelectRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  smallChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff" },
  smallChipText: { fontSize: 10, color: "#171717", fontWeight: "500" },
  logButton: { borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingHorizontal: 10, paddingVertical: 6 },
  logButtonText: { fontSize: 10, fontWeight: "600", color: "#404040" },
  card: { borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardHeaderText: { fontSize: 13, fontWeight: "500", color: "#171717" },
  cardHeaderCount: { fontSize: 10, color: "#a3a3a3" },
  hint: { marginTop: 6, fontSize: 10.5, color: "#737373" },
  entryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  checkLabel: { fontSize: 10.5, color: "#737373" },
  smallPrimaryButton: { borderRadius: 8, backgroundColor: "#171717", paddingHorizontal: 10, paddingVertical: 6 },
  smallPrimaryButtonText: { fontSize: 10.5, fontWeight: "600", color: "#fff" },
  entryItem: { borderRadius: 6, backgroundColor: "#fafafa", padding: 6 },
  entryItemText: { fontSize: 10.5, color: "#404040" },
  summaryBox: { marginTop: 20, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#f5f5f5", padding: 12 },
  summaryTitle: { fontSize: 13, fontWeight: "600", color: "#262626" },
  summaryBody: { marginTop: 4, fontSize: 11, color: "#737373" },
  disabledButton: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", paddingVertical: 12, alignItems: "center" },
  disabledButtonText: { fontSize: 11, fontWeight: "600", color: "#d4d4d4" },
  secondaryButton: { borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { fontSize: 11, fontWeight: "600", color: "#404040" },
  tertiaryButton: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", paddingVertical: 12, alignItems: "center" },
  tertiaryButtonText: { fontSize: 11, fontWeight: "600", color: "#a3a3a3" },
});
