import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import {
  getProject,
  listTestEntries,
  listExperimentsForProject,
  createExperimentForProject,
  completeExperiment,
  moveToRevenue,
  type WeakPoint,
  type EvidenceState,
  type RealityCheckDecision,
} from "@/lib/db";
import { computeWeakPoints } from "@/lib/journey/weak-point-engine";
import { hasPositiveSignal } from "@/lib/journey/test-signal";
import { EXPERIMENT_SUGGESTIONS, WEAK_POINT_LABEL } from "@/lib/journey/experiment-suggestions";
import { computeIncompleteExperiments } from "@/lib/journey/experiment-gate";

const EVIDENCE_OPTIONS: { key: EvidenceState; labelKey: string }[] = [
  { key: "supported", labelKey: "experiment.evidence.supported" },
  { key: "challenged", labelKey: "experiment.evidence.challenged" },
  { key: "unclear", labelKey: "experiment.evidence.unclear" },
];
const DECISION_OPTIONS: { key: RealityCheckDecision; labelKey: string }[] = [
  { key: "continue", labelKey: "experiment.decision.continue" },
  { key: "change", labelKey: "experiment.decision.change" },
  { key: "stop", labelKey: "experiment.decision.stop" },
];

export default function ExperimentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();
  const [reloadKey, setReloadKey] = useState(0);
  useFocusEffect(useCallback(() => { setReloadKey((k) => k + 1); }, []));

  const project = useMemo(() => getProject(id), [id, reloadKey]);
  const testEntries = useMemo(() => listTestEntries(id), [id, reloadKey]);
  const weakPoints = useMemo(() => computeWeakPoints(testEntries), [testEntries]);
  const experiments = useMemo(() => listExperimentsForProject(id), [id, reloadKey]);
  const incomplete = useMemo(() => computeIncompleteExperiments(experiments), [experiments]);
  const canMoveOn = incomplete.length === 0 && hasPositiveSignal(testEntries);

  const [openSuggestion, setOpenSuggestion] = useState<string | null>(null);
  const [intervention, setIntervention] = useState("");
  const [decisionRule, setDecisionRule] = useState("");
  const [decisionRuleReasoning, setDecisionRuleReasoning] = useState("");

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [whatHappened, setWhatHappened] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [learning, setLearning] = useState("");
  const [evidenceState, setEvidenceState] = useState<EvidenceState>("supported");
  const [decision, setDecision] = useState<RealityCheckDecision>("continue");

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  function startExperiment(wp: WeakPoint, i: number, hypothesis: string) {
    createExperimentForProject({
      project_id: id,
      hypothesis,
      intervention: intervention.trim(),
      decision_rule: decisionRule.trim(),
      decision_rule_reasoning: decisionRuleReasoning.trim(),
      weak_point: wp,
      suggestion_key: `${wp}_${i}`,
    });
    setIntervention("");
    setDecisionRule("");
    setDecisionRuleReasoning("");
    setOpenSuggestion(null);
    setReloadKey((k) => k + 1);
  }

  function saveCompletion(experimentId: string) {
    completeExperiment(experimentId, {
      what_happened: whatHappened.trim(),
      important_limitations: null,
      interpretation: interpretation.trim(),
      evidence_state: evidenceState,
      decision,
      learning: learning.trim(),
    });
    setWhatHappened("");
    setInterpretation("");
    setLearning("");
    setEvidenceState("supported");
    setDecision("continue");
    setCompletingId(null);
    setReloadKey((k) => k + 1);
  }

  function moveOn() {
    moveToRevenue(id);
    router.push(`/my-path/projects/${id}/revenue` as any);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.push(`/my-path/projects/${id}/test` as any)}>
          <Text style={styles.backLink}>{t("experiment.backToTest", language)}</Text>
        </Pressable>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.subtitle}>{t("experiment.subtitle", language)}</Text>

        {incomplete.length > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {incomplete.length} {t(incomplete.length > 1 ? "experiment.openPlural" : "experiment.openSingular", language)}
            </Text>
          </View>
        )}

        {weakPoints.length > 0 && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <Text style={styles.sectionLabel}>{t("experiment.weakPointsFound", language)}</Text>
            {weakPoints.map((wp) => (
              <View key={wp} style={styles.card}>
                <Text style={styles.cardTitle}>{WEAK_POINT_LABEL[wp][language]}</Text>
                <View style={{ marginTop: 8, gap: 8 }}>
                  {EXPERIMENT_SUGGESTIONS[wp].map((s, i) => {
                    const key = `${wp}_${i}`;
                    const isOpen = openSuggestion === key;
                    return (
                      <View key={key} style={styles.suggestionBox}>
                        <Text style={styles.suggestionText}>{s[language]}</Text>
                        <Pressable
                          onPress={() => {
                            setOpenSuggestion(isOpen ? null : key);
                            setIntervention("");
                            setDecisionRule("");
                            setDecisionRuleReasoning("");
                          }}
                        >
                          <Text style={styles.suggestionToggle}>{t("experiment.startThis", language)}</Text>
                        </Pressable>
                        {isOpen && (
                          <View style={{ marginTop: 6, gap: 6 }}>
                            <TextInput
                              style={styles.smallInput}
                              placeholder={t("experiment.whatWillYouDo", language)}
                              value={intervention}
                              onChangeText={setIntervention}
                            />
                            <TextInput
                              style={styles.smallInput}
                              placeholder={t("experiment.howWillYouKnow", language)}
                              value={decisionRule}
                              onChangeText={setDecisionRule}
                            />
                            <TextInput
                              style={styles.smallInput}
                              placeholder={t("experiment.whyThatRule", language)}
                              value={decisionRuleReasoning}
                              onChangeText={setDecisionRuleReasoning}
                            />
                            <Pressable style={styles.smallPrimaryButton} onPress={() => startExperiment(wp, i, s[language])}>
                              <Text style={styles.smallPrimaryButtonText}>{t("experiment.start", language)}</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {experiments.length > 0 && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Text style={styles.sectionLabel}>{t("experiment.yourExperiments", language)}</Text>
            {experiments.map((e) => {
              const isCompleting = completingId === e.id;
              return (
                <View key={e.id} style={styles.card}>
                  <Text style={styles.experimentHypothesis}>{e.hypothesis}</Text>
                  <Text style={styles.experimentDecision}>
                    {e.decision ? `${t("experiment.decision", language)} ${e.decision}` : t("experiment.notYetDecided", language)}
                  </Text>
                  {!e.decision && (
                    <View style={{ marginTop: 8 }}>
                      {!isCompleting ? (
                        <Pressable
                          style={styles.smallOutlineButton}
                          onPress={() => {
                            setCompletingId(e.id);
                            setWhatHappened("");
                            setInterpretation("");
                            setLearning("");
                          }}
                        >
                          <Text style={styles.smallOutlineButtonText}>{t("experiment.startThis", language)}</Text>
                        </Pressable>
                      ) : (
                        <View style={{ gap: 6 }}>
                          <TextInput
                            style={styles.smallInput}
                            placeholder={t("experiment.whatHappened", language)}
                            value={whatHappened}
                            onChangeText={setWhatHappened}
                          />
                          <TextInput
                            style={styles.smallInput}
                            placeholder={t("experiment.interpretation", language)}
                            value={interpretation}
                            onChangeText={setInterpretation}
                          />
                          <TextInput
                            style={styles.smallInput}
                            placeholder={t("experiment.whatDidYouLearn", language)}
                            value={learning}
                            onChangeText={setLearning}
                          />
                          <View style={styles.chipRow}>
                            {EVIDENCE_OPTIONS.map((o) => (
                              <Pressable
                                key={o.key}
                                style={[styles.smallChip, evidenceState === o.key && styles.chipActive]}
                                onPress={() => setEvidenceState(o.key)}
                              >
                                <Text style={[styles.smallChipText, evidenceState === o.key && styles.chipTextActive]}>{t(o.labelKey, language)}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <View style={styles.chipRow}>
                            {DECISION_OPTIONS.map((o) => (
                              <Pressable
                                key={o.key}
                                style={[styles.smallChip, decision === o.key && styles.chipActive]}
                                onPress={() => setDecision(o.key)}
                              >
                                <Text style={[styles.smallChipText, decision === o.key && styles.chipTextActive]}>{t(o.labelKey, language)}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <Pressable style={styles.smallPrimaryButton} onPress={() => saveCompletion(e.id)}>
                            <Text style={styles.smallPrimaryButtonText}>{t("journey.save", language)}</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: 20, gap: 8 }}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push(`/my-path/projects/${id}/test` as any)}>
            <Text style={styles.secondaryButtonText}>{t("experiment.backToTestButton", language)}</Text>
          </Pressable>
          {canMoveOn ? (
            <Pressable style={styles.primaryButton} onPress={moveOn}>
              <Text style={styles.primaryButtonText}>{t("experiment.moveToRevenue", language)}</Text>
            </Pressable>
          ) : (
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>{t("experiment.moveToRevenue", language)}</Text>
            </View>
          )}
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
  warningBox: { marginTop: 12, borderRadius: 8, borderWidth: 1, borderColor: "#fde68a", backgroundColor: "#fffbeb", padding: 10 },
  warningText: { fontSize: 11, color: "#92400e" },
  sectionLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, color: "#a3a3a3" },
  card: { borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#171717" },
  suggestionBox: { borderRadius: 8, borderWidth: 1, borderColor: "#f5f5f5", padding: 8 },
  suggestionText: { fontSize: 11, color: "#404040" },
  suggestionToggle: { marginTop: 6, fontSize: 10, color: "#a3a3a3" },
  smallInput: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 10.5, color: "#171717", backgroundColor: "#fff" },
  smallPrimaryButton: { alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#171717", paddingHorizontal: 10, paddingVertical: 6 },
  smallPrimaryButtonText: { fontSize: 10.5, fontWeight: "600", color: "#fff" },
  smallOutlineButton: { alignSelf: "flex-start", borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingHorizontal: 10, paddingVertical: 6 },
  smallOutlineButtonText: { fontSize: 10.5, fontWeight: "600", color: "#404040" },
  experimentHypothesis: { fontSize: 12, color: "#262626" },
  experimentDecision: { marginTop: 4, fontSize: 10.5, color: "#a3a3a3" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  smallChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff" },
  smallChipText: { fontSize: 10, color: "#171717", fontWeight: "500" },
  chipActive: { backgroundColor: "#171717", borderColor: "#171717" },
  chipTextActive: { color: "#fff" },
  secondaryButton: { borderRadius: 8, borderWidth: 1, borderColor: "#d4d4d4", paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { fontSize: 11, fontWeight: "600", color: "#404040" },
  primaryButton: { borderRadius: 8, backgroundColor: "#171717", paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  disabledButton: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", paddingVertical: 12, alignItems: "center" },
  disabledButtonText: { fontSize: 11, fontWeight: "600", color: "#d4d4d4" },
});
