import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { AppPressable } from "@/components/ui/AppPressable";
import { useLanguage } from "@/lib/LanguageContext";
import { t, tf } from "@/lib/ui-copy";
import { getDiscoverAnswers, saveDiscoverAnswers } from "@/lib/db";
import { questionFlow, flattenAnswers } from "@/lib/discover/answers";
import { discoverResumeStepIndex } from "@/lib/discover/resume-step";
import { HARD_CONSTRAINT_OPTIONS, Q27_PROMPT, Q27_HELPER } from "@/lib/discover/questions-constraints";
import type { Question } from "@/lib/discover/questions";
import { colors, radii, space, type as typography } from "@/lib/theme";

type RawAnswers = Record<string, string[]>;

export default function DiscoverStartScreen() {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const existing = getDiscoverAnswers();
  const [answers, setAnswers] = useState<RawAnswers>(existing?.answers ?? {});
  const [stepIndex, setStepIndex] = useState(() =>
    existing && !existing.completed_at ? discoverResumeStepIndex(existing.answers) : 0
  );

  const flow = useMemo(() => questionFlow(answers), [answers]);
  const totalSteps = flow.length + 1;
  const isConstraintsStep = stepIndex >= flow.length;
  const current: Question | null = isConstraintsStep ? null : flow[stepIndex];

  const selected: string[] = current ? answers[current.id] ?? [] : answers.__hard_exclusions__ ?? [];

  function toggle(optionId: string) {
    if (!current) return;
    const max = current.maxSelect;
    setAnswers((prev) => {
      const prevSelected = prev[current.id] ?? [];
      let next: string[];
      if (current.type === "single") {
        next = [optionId];
      } else if (prevSelected.includes(optionId)) {
        next = prevSelected.filter((id) => id !== optionId);
      } else if (max && prevSelected.length >= max) {
        return prev;
      } else {
        next = [...prevSelected, optionId];
      }
      const merged = { ...prev, [current.id]: next };
      persistDraft(merged);
      return merged;
    });
  }

  function toggleConstraint(sectorId: string) {
    setAnswers((prev) => {
      const prevList = prev.__hard_exclusions__ ?? [];
      const next = prevList.includes(sectorId) ? prevList.filter((s) => s !== sectorId) : [...prevList, sectorId];
      const merged = { ...prev, __hard_exclusions__: next };
      persistDraft(merged);
      return merged;
    });
  }

  function persist(next: RawAnswers, completed: boolean) {
    const hardExclusions = next.__hard_exclusions__ ?? [];
    const { tags, preferences } = flattenAnswers(next);
    saveDiscoverAnswers({ answers: next, tags, hardExclusions, preferences, completed });
  }

  function persistDraft(next: RawAnswers) {
    persist(next, false);
  }

  function saveAndExit() {
    persist(answers, false);
    router.replace("/(tabs)/explore");
  }

  function goBack() {
    if (stepIndex > 0) {
      persist(answers, false);
      setStepIndex(stepIndex - 1);
    } else {
      saveAndExit();
    }
  }

  function goNext() {
    if (!canContinue) return;
    if (stepIndex + 1 >= totalSteps) {
      persist(answers, true);
      router.push("/my-path/results" as any);
    } else {
      persist(answers, false);
      setStepIndex(stepIndex + 1);
    }
  }

  const canContinue = isConstraintsStep || selected.length > 0;
  const progress = (stepIndex + 1) / totalSteps;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.page}>
        <View style={styles.top}>
          <FlowBackHeader
            backLabel={stepIndex > 0 ? t("common.back", language) : t("tab.explore", language)}
            onBack={goBack}
          />
          <ProgressBar
            label={tf("discover.progressLabel", language, { current: stepIndex + 1, total: totalSteps })}
            progress={progress}
          />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isConstraintsStep ? (
            <>
              <Text style={styles.prompt}>{Q27_PROMPT[language]}</Text>
              <Text style={styles.helper}>{Q27_HELPER[language]}</Text>
              <View style={styles.options}>
                {HARD_CONSTRAINT_OPTIONS.map((opt) => (
                  <OptionButton
                    key={opt.sectorId}
                    label={opt.label[language]}
                    active={selected.includes(opt.sectorId)}
                    onPress={() => toggleConstraint(opt.sectorId)}
                  />
                ))}
              </View>
            </>
          ) : current ? (
            <>
              <Text style={styles.prompt}>{current.prompt}</Text>
              {current.helper ? <Text style={styles.helper}>{current.helper}</Text> : null}
              <View style={styles.options}>
                {current.options.map((opt) => (
                  <OptionButton key={opt.id} label={opt.label} active={selected.includes(opt.id)} onPress={() => toggle(opt.id)} />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(space.screenBottom - 32, insets.bottom + 12) }]}>
          {!canContinue ? <Text style={styles.footerHint}>{t("discover.chooseOneHint", language)}</Text> : null}
          <View style={styles.footerActions}>
            <View style={styles.footerBtnCol}>
              <SecondaryButton label={t("discover.saveExit", language)} onPress={saveAndExit} />
            </View>
            <View style={styles.footerBtnCol}>
              <PrimaryButton
                label={stepIndex + 1 >= totalSteps ? t("discover.seeDirections", language) : t("discover.continue", language)}
                onPress={goNext}
                disabled={!canContinue}
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OptionButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <AppPressable style={[styles.option, active && styles.optionActive]} onPress={onPress}>
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1 },
  top: { paddingHorizontal: space.screenX, paddingTop: space.screenTop, gap: 12 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: space.section },
  prompt: { ...typography.screenTitle, fontSize: 24, lineHeight: 30 },
  helper: { marginTop: 8, fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  options: { marginTop: 20, gap: 10 },
  option: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  optionTextActive: { color: colors.accentDark, fontWeight: "600" },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
    gap: 10,
  },
  footerHint: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  footerActions: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  footerBtnCol: { flex: 1 },
});
