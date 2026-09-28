import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { ChoiceOptionGroup } from "@/components/ui/ChoiceOptionGroup";
import { PrimaryButton, SecondaryButton } from "@/components/ui/PrimaryButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { buildAssessmentSteps, stepAnswerKey, type AssessmentStep } from "@/lib/assessment/flow";
import {
  clearDraftAssessment,
  getBusiness,
  getDraftAssessment,
  getDraftIntake,
  saveAssessment,
  saveDraftAssessment,
  savePlan,
} from "@/lib/db";
import { HEALTH_QUESTIONS, OWNER_EXPOSURE } from "@/lib/content";
import { deriveStage } from "@/lib/intake";
import { buildAssessment } from "@/lib/scoring/assessment";
import { buildPlan } from "@/lib/action-plan/engine";
import type { Level, OwnerExposureLevel } from "@/lib/types";
import { useLanguage } from "@/lib/LanguageContext";
import { getText, getHealthQuestionLevelText } from "@/lib/localization";
import { getDimensionName, t, tf } from "@/lib/ui-copy";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { colors, space, type as typography } from "@/lib/theme";

const LEVELS: Level[] = ["A", "B", "C", "D", "E"];
const OWNER_LEVELS = ["1", "2", "3", "4", "5"] as const;

export default function AssessmentScreen() {
  const { businessId: idParam, reassess } = useLocalSearchParams<{ businessId: string; reassess?: string }>();
  const businessId = Array.isArray(idParam) ? idParam[0] : idParam;
  const { language } = useLanguage();

  const business = useMemo(() => (businessId ? getBusiness(businessId) : null), [businessId]);
  const intake = useMemo(() => (businessId ? getDraftIntake(businessId) : null), [businessId]);
  const stage = useMemo(() => (intake ? deriveStage(intake.customer_payment_status) : null), [intake]);
  const steps = useMemo(() => (intake ? buildAssessmentSteps(intake) : []), [intake]);

  const [healthAnswers, setHealthAnswers] = useState<Record<string, Level>>({});
  const [riskAnswers, setRiskAnswers] = useState<Record<string, Level>>({});
  const [ownerLevel, setOwnerLevel] = useState<OwnerExposureLevel | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  const loadDraft = useCallback(() => {
    if (!businessId) return;
    const draft = getDraftAssessment(businessId);
    if (draft) {
      setHealthAnswers(draft.health_answers ?? {});
      setRiskAnswers(draft.risk_answers ?? {});
      setOwnerLevel(draft.owner_exposure_level);
      setStepIndex(Math.min(draft.step_index ?? 0, Math.max(steps.length - 1, 0)));
    }
    setHydrated(true);
  }, [businessId, steps.length]);

  useFocusEffect(
    useCallback(() => {
      loadDraft();
    }, [loadDraft])
  );

  const persist = useCallback(
    (patch: {
      health?: Record<string, Level>;
      risk?: Record<string, Level>;
      owner?: OwnerExposureLevel | null;
      step?: number;
    }) => {
      if (!businessId) return;
      const next = {
        health_answers: patch.health ?? healthAnswers,
        risk_answers: patch.risk ?? riskAnswers,
        owner_exposure_level: patch.owner ?? ownerLevel,
        step_index: patch.step ?? stepIndex,
      };
      saveDraftAssessment(businessId, next);
    },
    [businessId, healthAnswers, riskAnswers, ownerLevel, stepIndex]
  );

  const current: AssessmentStep | undefined = steps[stepIndex];
  const progress = steps.length ? (stepIndex + 1) / steps.length : 0;
  const isLast = stepIndex >= steps.length - 1;

  if (!business || !intake || !stage || !businessId || steps.length === 0) {
    return (
      <ScreenScaffold safeBottom>
        <View style={styles.missing}>
          <Text style={typography.screenTitle}>{t("common.notFound", language)}</Text>
          <Text style={typography.screenSubtitle}>{t("assessment.notFoundBody", language)}</Text>
          <PrimaryButton label={t("tab.explore", language)} onPress={() => router.replace("/(tabs)/explore" as any)} />
        </View>
      </ScreenScaffold>
    );
  }

  const heading = reassess
    ? tf("assessment.headingReassessment", language, { name: business.name })
    : tf("assessment.headingAssessment", language, { name: business.name });

  function saveAndExit() {
    persist({});
    router.replace("/(tabs)/explore" as any);
  }

  function goBack() {
    if (stepIndex > 0) {
      const next = stepIndex - 1;
      setStepIndex(next);
      persist({ step: next });
    } else {
      saveAndExit();
    }
  }

  function goNext() {
    if (!current) return;
    const key = stepAnswerKey(current);
    const answered =
      current.kind === "owner"
        ? ownerLevel != null
        : current.kind === "health"
          ? !!healthAnswers[key]
          : !!riskAnswers[key];
    if (!answered) {
      setError(t("assessment.chooseOneHint", language));
      return;
    }
    setError(null);
    if (isLast) {
      submit();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    persist({ step: next });
  }

  function pickHealth(questionId: string, lvl: Level) {
    const nextHealth = { ...healthAnswers, [questionId]: lvl };
    setHealthAnswers(nextHealth);
    setError(null);
    if (!isLast) {
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      persist({ health: nextHealth, step: nextStep });
    } else {
      persist({ health: nextHealth });
    }
  }

  function pickRisk(fieldId: string, lvl: Level) {
    const nextRisk = { ...riskAnswers, [fieldId]: lvl };
    setRiskAnswers(nextRisk);
    setError(null);
    if (!isLast) {
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      persist({ risk: nextRisk, step: nextStep });
    } else {
      persist({ risk: nextRisk });
    }
  }

  function pickOwner(lvl: OwnerExposureLevel) {
    setOwnerLevel(lvl);
    setError(null);
    persist({ owner: lvl });
  }

  function submit() {
    for (const step of steps) {
      if (step.kind === "owner") {
        if (!ownerLevel) {
          setError(t("assessment.errorMissingOwner", language));
          return;
        }
        continue;
      }
      const key = stepAnswerKey(step);
      if (step.kind === "health" && !healthAnswers[key]) {
        setError(t("assessment.errorMissingHealth", language));
        return;
      }
      if (step.kind === "risk" && !riskAnswers[key]) {
        setError(t("assessment.errorMissingRisk", language));
        return;
      }
    }

    const assessment = buildAssessment({
      id: `asmt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      business_id: businessId,
      intake: intake!,
      raw_health_answers: healthAnswers,
      raw_risk_answers: riskAnswers,
      owner_exposure_level: ownerLevel!,
    });
    saveAssessment(assessment);
    const plan = buildPlan(assessment);
    savePlan(businessId, assessment.id, { action_plan: plan.action_plan, other_actions_counts: plan.other_actions_counts });
    clearDraftAssessment(businessId);
    router.replace(`/results/${businessId}?deliver=plan` as any);
  }

  const sectionEyebrow =
    current?.kind === "health"
      ? getDimensionName(current.dimension, language)
      : current?.kind === "risk"
        ? getDimensionName(current.category, language)
        : t("assessment.ownerExposureTitle", language);

  const prompt = (() => {
    if (!current) return "";
    if (current.kind === "health") {
      const q = HEALTH_QUESTIONS.find((x) => x.question_id === current.questionId)!;
      return getText(q.question_id, "text", language);
    }
    if (current.kind === "risk") {
      return getText(current.fieldId, "text", language);
    }
    return getText(OWNER_EXPOSURE.field_id, "text", language);
  })();

  const options: [string, string][] = (() => {
    if (!current) return [];
    if (current.kind === "health") {
      const q = HEALTH_QUESTIONS.find((x) => x.question_id === current.questionId)!;
      return LEVELS.map((lvl) => [lvl, getHealthQuestionLevelText(q, lvl, language, stage)] as [string, string]);
    }
    if (current.kind === "risk") {
      return LEVELS.map((lvl) => [lvl, getText(current.fieldId, `level_${lvl}`, language)] as [string, string]);
    }
    return OWNER_LEVELS.map((lvl) => [lvl, getText(OWNER_EXPOSURE.field_id, `level_${lvl}`, language)] as [string, string]);
  })();

  const selectedValue =
    current?.kind === "health"
      ? healthAnswers[current.questionId] ?? ""
      : current?.kind === "risk"
        ? riskAnswers[current.fieldId] ?? ""
        : ownerLevel != null
          ? String(ownerLevel)
          : "";

  function onSelectValue(v: string) {
    if (!current) return;
    if (current.kind === "health") pickHealth(current.questionId, v as Level);
    else if (current.kind === "risk") pickRisk(current.fieldId, v as Level);
    else pickOwner(Number(v) as OwnerExposureLevel);
  }

  return (
    <ScreenScaffold background="flat" safeBottom>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
          <FlowBackHeader
            backLabel={stepIndex > 0 ? t("common.back", language) : t("tab.explore", language)}
            onBack={goBack}
          />
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.intro}>
            {t("assessment.evidenceStandardIntro", language)}{" "}
            <Text style={styles.introStrong}>{stage.stage_label.replace("_", " ").toLowerCase()}</Text>{" "}
            {t("assessment.evidenceStandardOutro", language)}
          </Text>

          {hydrated ? (
            <>
              <View style={styles.progressWrap}>
                <ProgressBar
                  label={tf("assessment.progressLabel", language, { current: stepIndex + 1, total: steps.length })}
                  progress={progress}
                />
              </View>
              <Text style={styles.eyebrow}>{sectionEyebrow}</Text>
              <Text style={styles.prompt}>{prompt}</Text>

              <View style={styles.optionsPanel}>
                <ChoiceOptionGroup layout="stack" options={options} value={selectedValue} onChange={onSelectValue} />
              </View>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.autosaveHint}>{t("assessment.autosaveHint", language)}</Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <View style={styles.footerActions}>
            <View style={styles.footerCol}>
              <SecondaryButton label={t("assessment.saveExit", language)} onPress={saveAndExit} />
            </View>
            <View style={styles.footerCol}>
              <PrimaryButton
                label={isLast ? t("assessment.seeResults", language) : t("assessment.continue", language)}
                onPress={goNext}
                disabled={!selectedValue}
                hint={!selectedValue ? t("assessment.chooseOneHint", language) : undefined}
              />
            </View>
          </View>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  missing: { flex: 1, padding: space.screenX, gap: 16, justifyContent: "center" },
  heading: { ...typography.screenTitle, fontSize: 24, marginBottom: 6 },
  intro: { ...typography.screenSubtitle, fontSize: 15, lineHeight: 22 },
  introStrong: { fontWeight: "700", color: colors.text },
  progressWrap: { marginTop: space.section, marginBottom: space.section - 8 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.accentDark,
    marginBottom: 8,
  },
  prompt: { fontSize: 20, fontWeight: "700", color: colors.text, lineHeight: 28, letterSpacing: -0.3, marginBottom: 16 },
  optionsPanel: {
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: "hidden",
  },
  error: { marginTop: 12, fontSize: 14, color: colors.danger },
  autosaveHint: { marginTop: 16, fontSize: 13, color: colors.textMuted, lineHeight: 18, textAlign: "center" },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  footerActions: { flexDirection: "row", gap: 10 },
  footerCol: { flex: 1 },
});
