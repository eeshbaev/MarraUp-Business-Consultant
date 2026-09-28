import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { getBusiness, getLatestAssessment, listAssessments, getLatestPlan, getPlanByAssessment } from "@/lib/db";
import { scoreHealth } from "@/lib/scoring/health";
import { scoreRisk } from "@/lib/scoring/risk";
import { useLanguage } from "@/lib/LanguageContext";
import { useScrollContentStyle } from "@/lib/layout-metrics";
import { t, tf, getDimensionName, LOCALE_BY_LANGUAGE } from "@/lib/ui-copy";
import { colors, panelSurface, radii, space, type as typography } from "@/lib/theme";

export default function ResultsScreen() {
  const { businessId, deliver } = useLocalSearchParams<{ businessId: string; deliver?: string }>();
  const planJustReady = deliver === "plan";
  const { language } = useLanguage();
  // Re-read on focus (not just on first mount) so returning here from the
  // Plan screen after confirming an action item shows the updated scores.
  const [reloadKey, setReloadKey] = useState(0);
  useFocusEffect(useCallback(() => { setReloadKey((k) => k + 1); }, []));

  const business = useMemo(() => getBusiness(businessId), [businessId, reloadKey]);
  const assessment = useMemo(() => getLatestAssessment(businessId), [businessId, reloadKey]);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });

  if (!business || !assessment) {
    return (
      <ScreenScaffold safeBottom>
        <View style={styles.missing}>
          <Text style={typography.screenTitle}>{t("common.notFound", language)}</Text>
          <PrimaryButton label={t("tab.explore", language)} onPress={() => router.push("/(tabs)/explore" as any)} />
        </View>
      </ScreenScaffold>
    );
  }

  const health = scoreHealth(assessment.health_answers, assessment.stage);
  const risk = scoreRisk(assessment.risk_answers);

  const history = listAssessments(businessId);
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const healthDelta = previous ? Math.round((health.total - previous.business_health_score) * 10) / 10 : null;
  const riskDelta = previous ? Math.round((risk.total - previous.risk_exposure_score) * 10) / 10 : null;
  const exposuresResolved = previous ? previous.critical_exposures.filter((e) => !assessment.critical_exposures.includes(e)) : [];
  const exposuresNew = previous ? assessment.critical_exposures.filter((e) => !previous.critical_exposures.includes(e)) : [];
  const currentPlan = getLatestPlan(businessId);
  const locale = LOCALE_BY_LANGUAGE[language];

  return (
    <ScreenScaffold background="flat" safeBottom>
      <ScrollView contentContainerStyle={scrollContent}>
        <FlowBackHeader backLabel={t("tab.explore", language)} onBack={() => router.replace("/(tabs)/explore" as any)} />
        <View>
          <Text style={typography.screenTitle}>{business.name}</Text>
          <Text style={typography.screenSubtitle}>
            {business.sector} · assessed {new Date(assessment.created_at).toLocaleDateString(locale)}
          </Text>
        </View>

        {planJustReady && currentPlan ? (
          <View style={styles.planReadyCard}>
            <Text style={styles.planReadyTitle}>{t("results.planReadyTitle", language)}</Text>
            <Text style={styles.planReadyBody}>{t("results.planReadyBody", language)}</Text>
            <PrimaryButton label={t("results.openActionPlan", language)} onPress={() => router.push(`/plan/${businessId}` as any)} />
          </View>
        ) : null}

        {previous && (
          <View style={styles.sinceCard}>
            <Text style={styles.sinceLabel}>
              {tf("results.sinceLastAssessment", language, { date: new Date(previous.created_at).toLocaleDateString(locale) })}
            </Text>
            {exposuresResolved.length > 0 && (
              <Text style={styles.exposureGood}>
                {tf("results.exposuresResolved", language, {
                  count: exposuresResolved.length,
                  plural: exposuresResolved.length > 1 ? "s" : "",
                  list: exposuresResolved.join(", "),
                })}
              </Text>
            )}
            {exposuresNew.length > 0 && (
              <Text style={styles.exposureBad}>
                {tf("results.exposuresNew", language, {
                  count: exposuresNew.length,
                  plural: exposuresNew.length > 1 ? "s" : "",
                  list: exposuresNew.join(", "),
                })}
              </Text>
            )}
            {healthDelta === 0 && riskDelta === 0 && exposuresResolved.length === 0 && exposuresNew.length === 0 && (
              <Text style={styles.noMovement}>{t("results.noMovement", language)}</Text>
            )}
            <View style={styles.deltaRow}>
              <DeltaLine label={t("results.deltaHealth", language)} from={previous.business_health_score} to={health.total} delta={healthDelta!} goodDirection="up" />
              <DeltaLine label={t("results.deltaRisk", language)} from={previous.risk_exposure_score} to={risk.total} delta={riskDelta!} goodDirection="down" />
            </View>
            <Text style={styles.finePrint}>{t("results.deltaFinePrint", language)}</Text>
          </View>
        )}

        <View style={styles.scoreRow}>
          <ScoreCard label={t("results.health", language)} value={health.total} tone="good" />
          <ScoreCard label={t("results.risk", language)} value={risk.total} tone="bad" />
        </View>

        {assessment.critical_exposures.length > 0 && (
          <View style={styles.warnCardRed}>
            <Text style={styles.warnTitleRed}>{t("results.criticalExposures", language)}</Text>
            <Text style={styles.warnBodyRed}>
              {tf("results.exposureCountBody", language, {
                count: assessment.critical_exposures.length,
                plural: assessment.critical_exposures.length > 1 ? "s" : "",
                list: assessment.critical_exposures.join(", "),
              })}
            </Text>
          </View>
        )}
        {assessment.undemonstrated_constructs.length > 0 && (
          <View style={styles.warnCardAmber}>
            <Text style={styles.warnTitleAmber}>{t("results.notYetDemonstrated", language)}</Text>
            <Text style={styles.warnBodyAmber}>
              {tf("results.notYetDemonstratedBody", language, { list: assessment.undemonstrated_constructs.join(", ") })}
            </Text>
          </View>
        )}

        <Section title={t("results.healthByDimension", language)}>
          {health.byDimension.map((d) => (
            <Bar key={d.dimension} label={getDimensionName(d.dimension, language)} points={d.points} max={d.max} tone="good" />
          ))}
        </Section>

        <Section title={t("results.riskByCategory", language)}>
          {risk.byCategory.map((c) => (
            <View key={c.category}>
              <Bar label={getDimensionName(c.category, language)} points={c.points} max={c.max} tone="bad" />
              {c.saturated && <Text style={styles.saturated}>{t("results.saturated", language)}</Text>}
            </View>
          ))}
        </Section>

        <Section title={t("results.ownerExposure", language)}>
          <Text style={styles.body}>{tf("results.ownerExposureBody", language, { level: assessment.owner_exposure_level })}</Text>
        </Section>

        {history.length > 1 && (
          <Section title={t("results.businessHistory", language)}>
            <Text style={styles.finePrint}>{t("results.historyFinePrint", language)}</Text>
            {history.map((a, i) => {
              const prior = i > 0 ? history[i - 1] : null;
              const plan = getPlanByAssessment(a.id);
              const resolvedSincePlan = plan ? plan.action_plan.filter((it) => it.state === "resolved").length : null;
              const resolvedExposures = prior ? prior.critical_exposures.filter((e) => !a.critical_exposures.includes(e)) : [];
              const newExposures = prior ? a.critical_exposures.filter((e) => !prior.critical_exposures.includes(e)) : [];
              return (
                <View key={a.id} style={styles.historyCard}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyDate}>{new Date(a.created_at).toLocaleDateString(locale)}</Text>
                    <Text style={styles.historyScore}>{tf("results.historyScore", language, { health: a.business_health_score, risk: a.risk_exposure_score })}</Text>
                  </View>
                  {resolvedExposures.length > 0 && (
                    <Text style={styles.exposureGoodSmall}>{tf("results.historyResolved", language, { count: resolvedExposures.length, plural: resolvedExposures.length > 1 ? "s" : "" })}</Text>
                  )}
                  {newExposures.length > 0 && (
                    <Text style={styles.exposureBadSmall}>{tf("results.historyNew", language, { count: newExposures.length, plural: newExposures.length > 1 ? "s" : "" })}</Text>
                  )}
                  {plan && resolvedSincePlan !== null && (
                    <Text style={styles.historyMeta}>{tf("results.historyPlanMeta", language, { resolved: resolvedSincePlan, total: plan.action_plan.length })}</Text>
                  )}
                  {!prior && <Text style={styles.historyMeta}>{t("results.historyFirst", language)}</Text>}
                </View>
              );
            })}
          </Section>
        )}

        {currentPlan && (
          <Text style={styles.finePrint}>
            {tf("results.currentPlanMeta", language, {
              resolved: currentPlan.action_plan.filter((i) => i.state === "resolved").length,
              total: currentPlan.action_plan.length,
              date: new Date(currentPlan.cycle_started_at).toLocaleDateString(locale),
            })}
          </Text>
        )}

        <PrimaryButton label={t("results.viewPlan", language)} onPress={() => router.push(`/plan/${businessId}` as any)} />
      </ScrollView>
    </ScreenScaffold>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function DeltaLine({
  label,
  from,
  to,
  delta,
  goodDirection,
}: {
  label: string;
  from: number;
  to: number;
  delta: number;
  goodDirection: "up" | "down";
}) {
  const isGood = goodDirection === "up" ? delta > 0 : delta < 0;
  const isFlat = delta === 0;
  const color = isFlat ? "#737373" : isGood ? "#047857" : "#b91c1c";
  const sign = delta > 0 ? "+" : "";
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.deltaLabel}>{label}</Text>
      <Text style={[styles.deltaValue, { color }]}>
        {from} → {to} ({sign}{delta})
      </Text>
    </View>
  );
}

function ScoreCard({ label, value, tone }: { label: string; value: number; tone: "good" | "bad" }) {
  return (
    <View style={[styles.scoreCard, tone === "good" ? styles.scoreCardGood : styles.scoreCardRisk]}>
      <Text style={styles.scoreCardLabel}>{label}</Text>
      <Text style={[styles.scoreCardValue, { color: tone === "good" ? colors.success : colors.danger }]}>
        {value} <Text style={styles.scoreCardSuffix}>/ 100</Text>
      </Text>
    </View>
  );
}

function Bar({ label, points, max, tone }: { label: string; points: number; max: number; tone: "good" | "bad" }) {
  const pct = max > 0 ? Math.min(100, (points / max) * 100) : 0;
  return (
    <View>
      <View style={styles.barHeaderRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barLabel}>{points} / {max}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: tone === "good" ? colors.success : colors.danger }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, padding: space.screenX, justifyContent: "center", gap: 16 },
  planReadyCard: {
    ...panelSurface(),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: space.card + 4,
    gap: 10,
    marginTop: 8,
  },
  planReadyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  planReadyBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  sinceCard: { borderRadius: 10, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fafafa", padding: 14, gap: 6 },
  sinceLabel: { fontSize: 11, fontWeight: "700", color: "#737373", textTransform: "uppercase", letterSpacing: 0.4 },
  exposureGood: { fontSize: 13, color: "#047857" },
  exposureBad: { fontSize: 13, color: "#b91c1c" },
  exposureGoodSmall: { fontSize: 12, color: "#047857" },
  exposureBadSmall: { fontSize: 12, color: "#b91c1c" },
  noMovement: { fontSize: 13, color: "#a3a3a3" },
  deltaRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  deltaLabel: { fontSize: 11, color: "#737373" },
  deltaValue: { marginTop: 2, fontSize: 13, fontWeight: "600" },
  finePrint: { fontSize: 11, color: "#a3a3a3" },
  scoreRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  scoreCard: { flex: 1, ...panelSurface(), padding: space.card + 4, borderLeftWidth: 4 },
  scoreCardGood: { borderLeftColor: colors.success },
  scoreCardRisk: { borderLeftColor: colors.danger },
  scoreCardLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  scoreCardValue: { marginTop: 6, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  scoreCardSuffix: { fontSize: 15, fontWeight: "500", color: colors.textFaint },
  warnCardRed: { borderRadius: 8, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", padding: 14, gap: 4 },
  warnTitleRed: { fontSize: 14, fontWeight: "600", color: "#7f1d1d" },
  warnBodyRed: { fontSize: 13, color: "#991b1b" },
  warnCardAmber: { borderRadius: 8, borderWidth: 1, borderColor: "#fde68a", backgroundColor: "#fffbeb", padding: 14, gap: 4 },
  warnTitleAmber: { fontSize: 14, fontWeight: "600", color: "#78350f" },
  warnBodyAmber: { fontSize: 13, color: "#92400e" },
  section: { gap: 10 },
  sectionLabel: { ...typography.sectionLabel, marginBottom: 4 },
  barHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  barLabel: { fontSize: 12, color: "#525252" },
  barTrack: { marginTop: 6, height: 10, borderRadius: radii.full, backgroundColor: colors.bgMuted, overflow: "hidden" },
  barFill: { height: 10, borderRadius: radii.full },
  saturated: { marginTop: 2, fontSize: 11, color: "#92400e" },
  historyCard: { borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff", padding: 12, gap: 3 },
  historyHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  historyDate: { fontSize: 13, fontWeight: "600", color: "#171717" },
  historyScore: { fontSize: 11, color: "#737373" },
  historyMeta: { fontSize: 11, color: "#525252" },
});
