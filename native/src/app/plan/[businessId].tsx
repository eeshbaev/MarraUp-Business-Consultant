import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { AppPressable } from "@/components/ui/AppPressable";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useScrollContentStyle } from "@/lib/layout-metrics";
import { colors, panelSurface, radii, space, type as typography } from "@/lib/theme";
import {
  getBusiness,
  getLatestAssessment,
  getPlanByAssessment,
  listDeliveryEvidenceForItem,
  updatePlanItems,
  updateAssessmentAnswers,
  createDeliveryEvidence,
} from "@/lib/db";
import { HEALTH_QUESTIONS, RISK_FIELDS, OWNER_EXPOSURE } from "@/lib/content";
import { scoreHealth } from "@/lib/scoring/health";
import { scoreRisk } from "@/lib/scoring/risk";
import { checkResolution, type ResolutionContext } from "@/lib/resolution";
import type { ActionItem, Level, OwnerExposureLevel, Stage } from "@/lib/types";
import { useLanguage } from "@/lib/LanguageContext";
import { getText, getHealthQuestionLevelText } from "@/lib/localization";
import { getDimensionName, LOCALE_BY_LANGUAGE, t, tf } from "@/lib/ui-copy";

const LEVELS: Level[] = ["A", "B", "C", "D", "E"];
const PRIORITY_STYLE: Record<string, { bg: string; fg: string }> = {
  "Very High": { bg: "#fee2e2", fg: "#991b1b" },
  High: { bg: "#fef3c7", fg: "#92400e" },
  Medium: { bg: "#dbeafe", fg: "#1e40af" },
};
const CYCLE_LENGTH_DAYS = 120;

function contextFromAssessment(healthAnswers: Record<string, Level>, riskAnswers: Record<string, Level | "UNPROVEN">, ownerLevel: number): ResolutionContext {
  const risk = scoreRisk(riskAnswers);
  const categoryTotals: Record<string, number> = { ...risk.categoryTotals };
  const saturatedCategories = risk.byCategory.filter((c) => c.saturated).map((c) => c.category);
  return {
    health_answers: healthAnswers,
    risk_answers: riskAnswers,
    owner_exposure_level: ownerLevel,
    category_totals: categoryTotals,
    critical_exposures: risk.criticalExposures,
    saturated_categories: saturatedCategories,
  };
}

function fieldInfo(fieldId: string, stage: Stage, language: ReturnType<typeof useLanguage>["language"]) {
  const hq = HEALTH_QUESTIONS.find((q) => q.question_id === fieldId);
  if (hq) {
    return { text: getText(hq.question_id, "text", language), levelText: (lvl: Level) => getHealthQuestionLevelText(hq, lvl, language, stage) };
  }
  const rf = RISK_FIELDS.find((f) => f.field_id === fieldId);
  if (rf) {
    return { text: getText(rf.field_id, "text", language), levelText: (lvl: Level) => getText(rf.field_id, `level_${lvl}`, language) };
  }
  if (fieldId === "OWN-01") {
    return { text: getText(OWNER_EXPOSURE.field_id, "text", language), levelText: null as ((lvl: Level) => string) | null };
  }
  return null;
}

export default function PlanScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const { language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language];

  // Bumped after a confirm to force this screen to re-read the plan/assessment from db.
  const [refreshKey, setRefreshKey] = useState(0);
  // Also refresh on focus, not just after this screen's own actions, so
  // edits made elsewhere (e.g. a reassessment) show up on return here.
  useFocusEffect(useCallback(() => { setRefreshKey((k) => k + 1); }, []));
  const [banner, setBanner] = useState<{ itemId: string; title: string; resolved: boolean; healthFrom: number; healthTo: number; riskFrom: number; riskTo: number } | null>(null);

  const business = useMemo(() => getBusiness(businessId), [businessId, refreshKey]);
  const assessment = useMemo(() => getLatestAssessment(businessId), [businessId, refreshKey]);
  const plan = useMemo(() => (assessment ? getPlanByAssessment(assessment.id) : null), [assessment, refreshKey]);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });

  if (!business || !assessment || !plan) {
    return (
      <ScreenScaffold safeBottom>
        <View style={{ padding: space.screenX }}>
          <Text style={typography.screenTitle}>{t("common.notFound", language)}</Text>
        </View>
      </ScreenScaffold>
    );
  }

  const totalOther = Object.values(plan.other_actions_counts).reduce((s, n) => s + n, 0);
  const resolvedCount = plan.action_plan.filter((i) => i.state === "resolved").length;
  const cycleDue = Date.now() - new Date(plan.cycle_started_at).getTime() >= CYCLE_LENGTH_DAYS * 24 * 60 * 60 * 1000;
  const nextItem = plan.action_plan.find((i) => i.state !== "resolved") ?? null;

  function confirmItem(item: ActionItem, answers: Record<string, string>, note: string) {
    const updatedHealth = { ...assessment!.health_answers };
    const updatedRisk = { ...assessment!.risk_answers };
    let updatedOwner = assessment!.owner_exposure_level;

    for (const f of item.source_fields) {
      const v = answers[f];
      if (!v) continue;
      if (f === "OWN-01") updatedOwner = Number(v) as OwnerExposureLevel;
      else if (HEALTH_QUESTIONS.some((q) => q.question_id === f)) updatedHealth[f] = v as Level;
      else updatedRisk[f] = v as Level;
    }

    const ctx = contextFromAssessment(updatedHealth, updatedRisk, updatedOwner);
    const resolved = checkResolution(item.resolution_rule, ctx);

    const updatedItems: ActionItem[] = plan!.action_plan.map((i) =>
      i.id === item.id ? { ...i, state: resolved ? ("resolved" as const) : ("in_progress" as const), owner_marked_delivered: true } : i
    );
    updatePlanItems(plan!.id, updatedItems);

    const noteText = note.trim() ? note.trim() : null;
    if (noteText) {
      createDeliveryEvidence({ business_id: businessId, item_id: item.id, note: noteText, photo_data_url: null });
    }

    const before = { health: scoreHealth(assessment!.health_answers, assessment!.stage).total, risk: scoreRisk(assessment!.risk_answers).total };
    const afterHealth = scoreHealth(updatedHealth, assessment!.stage);
    const afterRisk = scoreRisk(updatedRisk);
    const categorySaturation: Record<string, boolean> = {};
    for (const c of afterRisk.byCategory) categorySaturation[c.category] = c.saturated;

    updateAssessmentAnswers(assessment!.id, {
      health_answers: updatedHealth,
      risk_answers: updatedRisk,
      owner_exposure_level: updatedOwner,
      business_health_score: afterHealth.total,
      risk_exposure_score: afterRisk.total,
      critical_exposures: afterRisk.criticalExposures,
      category_saturation: categorySaturation,
      category_totals: afterRisk.categoryTotals,
      undemonstrated_constructs: afterRisk.undemonstratedConstructs,
    });

    setBanner({
      itemId: item.id,
      title: getText(item.content_id, "title", language),
      resolved,
      healthFrom: before.health,
      healthTo: afterHealth.total,
      riskFrom: before.risk,
      riskTo: afterRisk.total,
    });
    setRefreshKey((k) => k + 1);
  }

  return (
    <ScreenScaffold background="flat" safeBottom>
      <ScrollView contentContainerStyle={scrollContent}>
        <FlowBackHeader
          backLabel={t("plan.backToBusiness", language)}
          onBack={() => router.replace(`/business/${businessId}` as any)}
        />
        <View>
          <Text style={typography.screenTitle}>{tf("plan.heading", language, { name: business.name })}</Text>
          <Text style={typography.screenSubtitle}>
            {tf("plan.body", language, { count: plan.action_plan.length })}
          </Text>
          <Text style={styles.progressText}>
            {tf("plan.progressText", language, {
              resolved: resolvedCount,
              total: plan.action_plan.length,
              date: new Date(plan.cycle_started_at).toLocaleDateString(locale),
            })}
          </Text>
        </View>

        {nextItem && (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>{t("plan.yourNextStep", language)}</Text>
            <Text style={styles.nextBody}>
              {tf("plan.nextStepBody", language, {
                count: plan.action_plan.length - resolvedCount,
                ySuffix: plan.action_plan.length - resolvedCount === 1 ? "y" : "ies",
                sSuffix: plan.action_plan.length - resolvedCount === 1 ? "s" : "",
                title: getText(nextItem.content_id, "title", language),
              })}
            </Text>
          </View>
        )}

        {banner && (
          <View style={banner.resolved ? styles.bannerResolved : styles.bannerProgress}>
            <Text style={banner.resolved ? styles.bannerResolvedTitle : styles.bannerProgressTitle}>
              {banner.resolved
                ? tf("plan.justResolved", language, { title: banner.title })
                : tf("plan.progressRecorded", language, { title: banner.title })}
            </Text>
            <Text style={styles.bannerMeta}>
              {tf("plan.bannerMeta", language, {
                healthFrom: banner.healthFrom,
                healthTo: banner.healthTo,
                riskFrom: banner.riskFrom,
                riskTo: banner.riskTo,
              })}
            </Text>
            <Text style={styles.finePrint}>{t("plan.bannerFinePrint", language)}</Text>
          </View>
        )}

        {cycleDue && resolvedCount < plan.action_plan.length && (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>{t("plan.reassessDue", language)}</Text>
            <Text style={styles.warnBody}>
              {tf("plan.reassessDueBody", language, {
                count: plan.action_plan.length - resolvedCount,
                ySuffix: plan.action_plan.length - resolvedCount === 1 ? "y" : "ies",
                sSuffix: plan.action_plan.length - resolvedCount === 1 ? "s" : "",
              })}
            </Text>
          </View>
        )}

        {resolvedCount === plan.action_plan.length && (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>{t("plan.completedTitle", language)}</Text>
            <Text style={styles.doneBody}>
              {cycleDue ? t("plan.completedReassessDue", language) : t("plan.completedNextStep", language)}
            </Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          {plan.action_plan.map((item, idx) => (
            <ActionItemCard
              key={item.id}
              item={item}
              idx={idx}
              isNext={nextItem?.id === item.id}
              stage={assessment.stage}
              language={language}
              locale={locale}
              businessId={businessId}
              onConfirm={confirmItem}
            />
          ))}
        </View>

        {totalOther > 0 && (
          <View style={styles.otherCard}>
            <Text style={styles.otherLabel}>{t("plan.otherActions", language)}</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              {Object.entries(plan.other_actions_counts)
                .filter(([, n]) => n > 0)
                .map(([level, n]) => (
                  <Text key={level} style={styles.otherItem}>{n} {level}</Text>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

function ActionItemCard({
  item,
  idx,
  isNext,
  stage,
  language,
  locale,
  businessId,
  onConfirm,
}: {
  item: ActionItem;
  idx: number;
  isNext: boolean;
  stage: Stage;
  language: ReturnType<typeof useLanguage>["language"];
  locale: string;
  businessId: string;
  onConfirm: (item: ActionItem, answers: Record<string, string>, note: string) => void;
}) {
  const evidence = useMemo(() => listDeliveryEvidenceForItem(businessId, item.id), [businessId, item.id, item.state]);
  const priorityStyle = PRIORITY_STYLE[item.priority_level] ?? PRIORITY_STYLE.Medium;
  const isOnDemand = item.resolution_rule.type !== "CATEGORY_THRESHOLD" && item.resolution_rule.type !== "COUNT_THRESHOLD";
  const [showDetails, setShowDetails] = useState(isNext);

  return (
    <View style={[styles.itemCard, isNext && styles.itemCardNext]}>
      <View style={styles.itemHeaderRow}>
        <View style={styles.itemHeaderLeft}>
          <View style={[styles.priorityChip, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.priorityChipText, { color: priorityStyle.fg }]}>{item.priority_level}</Text>
          </View>
          {isNext && (
            <View style={styles.nextChip}>
              <Text style={styles.nextChipText}>{t("plan.next", language)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemMeta}>#{idx + 1} · {getDimensionName(item.dimension, language)}</Text>
      </View>

      <Text style={styles.itemTitle}>{getText(item.content_id, "title", language)}</Text>

      <Text style={styles.itemActionLead}>
        <Text style={styles.itemDetailLabel}>{t("plan.nextActionLabel", language)}</Text>
        {getText(item.content_id, "action", language)}
      </Text>

      <AppPressable onPress={() => setShowDetails((v) => !v)} style={styles.detailsToggle}>
        <Text style={styles.detailsToggleText}>
          {showDetails ? t("plan.hideDetails", language) : t("plan.showDetails", language)}
        </Text>
      </AppPressable>

      {showDetails ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.itemDetail}>
            <Text style={styles.itemDetailLabel}>{t("plan.findingLabel", language)}</Text>
            {getText(item.content_id, "finding", language)}
          </Text>
          <Text style={styles.itemDetail}>
            <Text style={styles.itemDetailLabel}>{t("plan.whyItMattersLabel", language)}</Text>
            {getText(item.content_id, "consequence", language)}
          </Text>
          {item.content.avoid ? (
            <Text style={styles.itemDetail}>
              <Text style={styles.itemDetailLabel}>{t("plan.avoidLabel", language)}</Text>
              {getText(item.content_id, "avoid", language)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {evidence.length > 0 && (
        <View style={styles.evidenceWrap}>
          <Text style={styles.evidenceLabel}>{t("plan.yourDeliveryNotes", language)}</Text>
          {evidence.map((e) => (
            <View key={e.id} style={styles.evidenceCard}>
              {e.note && <Text style={styles.evidenceNote}>{e.note}</Text>}
              <Text style={styles.evidenceDate}>{new Date(e.created_at).toLocaleDateString(locale)}</Text>
            </View>
          ))}
        </View>
      )}

      {item.state === "resolved" ? (
        <View style={styles.resolvedPill}>
          <Text style={styles.resolvedPillText}>{t("plan.resolved", language)}</Text>
        </View>
      ) : isOnDemand ? (
        <ConfirmForm item={item} stage={stage} language={language} onConfirm={onConfirm} />
      ) : (
        <Text style={styles.finePrint}>{t("plan.onDemandFinePrint", language)}</Text>
      )}
    </View>
  );
}

function ConfirmForm({
  item,
  stage,
  language,
  onConfirm,
}: {
  item: ActionItem;
  stage: Stage;
  language: ReturnType<typeof useLanguage>["language"];
  onConfirm: (item: ActionItem, answers: Record<string, string>, note: string) => void;
}) {
  const fields = useMemo(
    () =>
      item.source_fields
        .map((f) => {
          const info = fieldInfo(f, stage, language);
          return info ? { id: f, text: info.text, levelText: info.levelText } : null;
        })
        .filter((x): x is { id: string; text: string; levelText: ((lvl: Level) => string) | null } => x !== null),
    [item, stage, language]
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  return (
    <View style={styles.confirmForm}>
      <Text style={styles.evidenceLabel}>{getText(item.content_id, "assessment_evidence", language)}</Text>
      {fields.map((f) => (
        <View key={f.id} style={{ gap: 6 }}>
          <Text style={styles.confirmFieldLabel}>{f.text}</Text>
          <View style={styles.confirmOptionsRow}>
            {f.id === "OWN-01"
              ? (["1", "2", "3", "4", "5"] as const).map((lvl) => (
                  <Pressable
                    key={lvl}
                    style={[styles.confirmOption, answers[f.id] === lvl && styles.confirmOptionActive]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [f.id]: lvl }))}
                  >
                    <Text style={[styles.confirmOptionText, answers[f.id] === lvl && styles.confirmOptionTextActive]}>
                      {getText(OWNER_EXPOSURE.field_id, `level_${lvl}`, language)}
                    </Text>
                  </Pressable>
                ))
              : LEVELS.map((lvl) => (
                  <Pressable
                    key={lvl}
                    style={[styles.confirmOption, answers[f.id] === lvl && styles.confirmOptionActive]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [f.id]: lvl }))}
                  >
                    <Text style={[styles.confirmOptionText, answers[f.id] === lvl && styles.confirmOptionTextActive]}>{f.levelText!(lvl)}</Text>
                  </Pressable>
                ))}
          </View>
        </View>
      ))}
      <View style={{ gap: 4 }}>
        <Text style={styles.confirmFieldLabel}>{t("plan.addNoteLabel", language)}</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder={t("plan.notePlaceholder", language)}
          placeholderTextColor="#a3a3a3"
          multiline
        />
      </View>
      <Text style={styles.finePrint}>{t("plan.confirmFinePrint", language)}</Text>
      <Pressable
        style={({ pressed }) => [styles.confirmSubmit, pressed && styles.confirmSubmitPressed]}
        onPress={() => onConfirm(item, answers, note)}
      >
        <Text style={styles.confirmSubmitText}>{t("plan.markAsDelivered", language)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48, gap: 20 },
  title: { fontSize: 20, fontWeight: "600", color: "#171717" },
  body: { marginTop: 4, fontSize: 13, color: "#525252" },
  progressText: { marginTop: 10, fontSize: 14, fontWeight: "700", color: colors.accentDark },
  nextCard: { ...panelSurface(), borderLeftWidth: 4, borderLeftColor: colors.accent, padding: space.card, gap: 6 },
  nextLabel: { fontSize: 11, fontWeight: "700", color: "#737373", textTransform: "uppercase", letterSpacing: 0.4 },
  nextBody: { fontSize: 13, color: "#262626" },
  bannerResolved: { borderRadius: 8, borderWidth: 1, borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", padding: 14, gap: 4 },
  bannerProgress: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fafafa", padding: 14, gap: 4 },
  bannerResolvedTitle: { fontSize: 13, fontWeight: "600", color: "#065f46" },
  bannerProgressTitle: { fontSize: 13, fontWeight: "600", color: "#262626" },
  bannerMeta: { fontSize: 11, color: "#404040" },
  warnCard: { borderRadius: 8, borderWidth: 1, borderColor: "#fde68a", backgroundColor: "#fffbeb", padding: 14, gap: 4 },
  warnTitle: { fontSize: 13, fontWeight: "600", color: "#78350f" },
  warnBody: { fontSize: 12, color: "#92400e" },
  doneCard: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fafafa", padding: 14, gap: 4 },
  doneTitle: { fontSize: 13, fontWeight: "600", color: "#262626" },
  doneBody: { fontSize: 12, color: "#525252" },
  itemCard: { ...panelSurface(), padding: space.card + 4, gap: 10 },
  itemCardNext: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  itemActionLead: { fontSize: 15, color: colors.text, lineHeight: 22 },
  detailsToggle: { alignSelf: "flex-start", paddingVertical: 4 },
  detailsToggleText: { fontSize: 14, fontWeight: "600", color: colors.accentDark },
  itemHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  priorityChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  priorityChipText: { fontSize: 11, fontWeight: "600" },
  nextChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: "#171717" },
  nextChipText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  itemMeta: { fontSize: 11, color: "#a3a3a3" },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#171717" },
  itemDetail: { fontSize: 13, color: "#404040", lineHeight: 18 },
  itemDetailLabel: { fontWeight: "600", color: "#737373" },
  evidenceWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e5e5", paddingTop: 10, gap: 6 },
  evidenceLabel: { fontSize: 11, fontWeight: "600", color: "#737373" },
  evidenceCard: { borderRadius: 8, backgroundColor: "#fafafa", padding: 10 },
  evidenceNote: { fontSize: 13, color: "#404040" },
  evidenceDate: { marginTop: 4, fontSize: 11, color: "#a3a3a3" },
  resolvedPill: { borderRadius: 6, backgroundColor: "#ecfdf5", paddingHorizontal: 12, paddingVertical: 8 },
  resolvedPillText: { fontSize: 13, color: "#065f46" },
  confirmForm: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e5e5", paddingTop: 10, gap: 10 },
  confirmFieldLabel: { fontSize: 13, color: "#262626" },
  confirmOptionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  confirmOption: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  confirmOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  confirmOptionText: { fontSize: 12, color: "#171717" },
  confirmOptionTextActive: { color: "#fff" },
  noteInput: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: "#171717", minHeight: 48, textAlignVertical: "top" },
  confirmSubmit: { alignSelf: "flex-start", borderRadius: radii.md, backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10 },
  confirmSubmitPressed: { opacity: 0.8 },
  confirmSubmitText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  linkText: { fontSize: 13, fontWeight: "600", color: "#525252", textDecorationLine: "underline" },
  otherCard: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 14, gap: 6 },
  otherLabel: { fontSize: 11, fontWeight: "600", color: "#737373", textTransform: "uppercase", letterSpacing: 0.4 },
  otherItem: { fontSize: 13, color: "#404040" },
  finePrint: { fontSize: 11, color: "#a3a3a3" },
});
