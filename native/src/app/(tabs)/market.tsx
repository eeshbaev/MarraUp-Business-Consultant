import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Alert } from "react-native";
import { ScreenScaffold } from "../../components/ui/ScreenScaffold";
import { router, useLocalSearchParams } from "expo-router";
import { getUserProfile } from "../../lib/db";
import { useLanguage } from "../../lib/LanguageContext";
import { t, tf } from "../../lib/ui-copy";
import type { Language } from "../../lib/types";
import {
  COUNTRY_HAS_DATA,
  countryLabelWithFlag,
  countrySelectOptions,
  UZ_SECTOR_HIGHLIGHTS,
  type CountryCode,
} from "../../lib/market-copy";
import { SECTOR_TAXONOMY, type SectorGroup } from "../../lib/sector-taxonomy";
import { getSectorMarketData, hasUsableData, type SectorMarketData, type Outlook, type MarketSource } from "../../lib/market-research-data";
import { useScrollContentStyle } from "../../lib/layout-metrics";
import { SectorGlyph } from "../../components/visuals/SectorGlyph";
import { projectFindHref, startLaunchProjectFromGap, startLaunchProjectFromIdea } from "../../lib/launch-project";
import { cardSurface, colors, radii, space, type as typography } from "../../lib/theme";
import { ScreenHeader } from "../../components/ScreenHeader";
import { GroupedSection } from "../../components/ui/GroupedSection";
import { ListRow } from "../../components/ui/ListRow";
import { SelectSheet } from "../../components/ui/SelectSheet";

type Signal = "growing" | "mixed" | "stable" | "declining" | "no_data";

function combinedSignal(data: SectorMarketData | undefined): Signal {
  const s = data?.shortTerm.outlook ?? "no_data";
  const l = data?.longTerm.outlook ?? "no_data";
  if (s === "no_data" && l === "no_data") return "no_data";
  const real = [s, l].filter((x) => x !== "no_data");
  if (real.every((x) => x === "growing")) return "growing";
  if (real.every((x) => x === "declining")) return "declining";
  if (real.every((x) => x === "stable")) return "stable";
  if (real.includes("growing") && real.includes("declining")) return "mixed";
  if (real.includes("growing")) return "growing";
  return "declining";
}

const SIGNAL_RANK: Record<Signal, number> = { growing: 0, mixed: 1, stable: 2, declining: 3, no_data: 4 };
const OUTLOOK_DOT: Record<Outlook, string> = {
  growing: "#10b981",
  stable: "#fbbf24",
  declining: "#f43f5e",
  no_data: "#d4d4d4",
};

function outlookLabel(outlook: Outlook, language: Language): string {
  return outlook === "growing"
    ? t("market.outlookGrowing", language)
    : outlook === "stable"
      ? t("market.outlookStable", language)
      : outlook === "declining"
        ? t("market.outlookDeclining", language)
        : t("market.outlookNoData", language);
}
function outlookArrow(outlook: Outlook): string {
  return outlook === "growing" ? "↑" : outlook === "stable" ? "→" : outlook === "declining" ? "↓" : "–";
}

function OutlookBadge({ outlook, language, compact }: { outlook: Outlook; language: Language; compact?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: outlookBadgeBg(outlook) }]}>
      <Text style={[styles.badgeText, { color: outlookBadgeFg(outlook) }]}>
        {outlookArrow(outlook)}
        {!compact ? ` ${outlookLabel(outlook, language)}` : ""}
      </Text>
    </View>
  );
}
function outlookBadgeBg(o: Outlook) {
  return o === "growing" ? "#ecfdf5" : o === "stable" ? "#fffbeb" : o === "declining" ? "#fff1f2" : "#f5f5f5";
}
function outlookBadgeFg(o: Outlook) {
  return o === "growing" ? "#047857" : o === "stable" ? "#b45309" : o === "declining" ? "#be123c" : "#a3a3a3";
}

function shortenSummary(summary: string): string {
  const clean = summary.trim();
  const match = clean.match(/^.*?[.!?](?=\s|$)/);
  if (match && match[0].length >= 20) return match[0];
  return clean;
}

function SourcesLine({ sources, language }: { sources: MarketSource[]; language: Language }) {
  if (sources.length === 0) return null;
  return (
    <Text style={styles.sourcesText}>
      {t("market.sourcesHeading", language)}:{" "}
      {sources.map((s, i) => (
        <Text key={i}>
          {i > 0 ? " · " : ""}
          {s.url ? (
            <Text style={styles.sourceLink} onPress={() => Linking.openURL(s.url)}>
              {s.publisher}
            </Text>
          ) : (
            s.publisher
          )}
          {s.date ? ` (${s.date})` : ""}
        </Text>
      ))}
    </Text>
  );
}

function HorizonStrip({
  shortTerm,
  longTerm,
  language,
}: {
  shortTerm: { outlook: Outlook; evidenceDate: string; summary: string };
  longTerm: { outlook: Outlook; evidenceDate: string; summary: string };
  language: Language;
}) {
  if (shortTerm.outlook === "no_data" && longTerm.outlook === "no_data") return null;
  const steps = [
    { label: t("market.shortTermLabel", language), data: shortTerm },
    { label: t("market.longTermLabel", language), data: longTerm },
  ];
  return (
    <View style={{ gap: 8 }}>
      {steps.map((s) => (
        <View key={s.label} style={styles.horizonRow}>
          <View style={[styles.dot, { backgroundColor: OUTLOOK_DOT[s.data.outlook] }]} />
          <View style={{ flex: 1 }}>
            <View style={styles.horizonHeadRow}>
              <Text style={styles.horizonLabel}>{s.label}</Text>
              <OutlookBadge outlook={s.data.outlook} language={language} />
              {s.data.evidenceDate && s.data.outlook !== "no_data" && (
                <Text style={styles.horizonAsOf}>
                  {t("market.asOfLabel", language)} {s.data.evidenceDate}
                </Text>
              )}
            </View>
            {s.data.outlook !== "no_data" && s.data.summary ? (
              <Text style={styles.horizonSummary}>{shortenSummary(s.data.summary)}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function launchProject(language: Language, create: () => { id: string }) {
  try {
    const project = create();
    router.push(projectFindHref(project.id) as any);
  } catch (e) {
    Alert.alert(t("newProject.title", language), e instanceof Error ? e.message : String(e));
  }
}

function ResearchSectorCard({
  group,
  data,
  language,
  open,
  onToggle,
  country,
}: {
  group: SectorGroup;
  data: SectorMarketData | undefined;
  language: Language;
  open: boolean;
  onToggle: () => void;
  country: CountryCode;
}) {
  const usable = hasUsableData(data);
  const highlight = country === "uz" ? UZ_SECTOR_HIGHLIGHTS[group.id] : undefined;

  function startFromGapText(text: string) {
    launchProject(language, () => startLaunchProjectFromGap(group.id, text));
  }

  function startFromIdea(text: string) {
    launchProject(language, () => startLaunchProjectFromIdea(text));
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} style={styles.cardHead}>
        <View style={styles.cardHeadRow}>
          <SectorGlyph groupId={group.id} size={40} />
          <Text style={[styles.cardTitle, styles.cardTitleWithGlyph]}>{group.name[language] || group.name.en}</Text>
          <Text style={[styles.chevron, open && styles.chevronOpen]}>{"▾"}</Text>
        </View>
        <View style={styles.cardBadgeRow}>
          <Text style={styles.badgeLabel}>{t("market.shortTermLabel", language)}</Text>
          <OutlookBadge outlook={data?.shortTerm.outlook ?? "no_data"} language={language} compact />
          <Text style={styles.dotSep}>{"·"}</Text>
          <Text style={styles.badgeLabel}>{t("market.longTermLabel", language)}</Text>
          <OutlookBadge outlook={data?.longTerm.outlook ?? "no_data"} language={language} compact />
        </View>
      </Pressable>

      {open && (
        <View style={styles.cardBody}>
          {highlight && (
            <View style={styles.highlightBox}>
              <Text style={styles.highlightHeading}>{t("market.keyFiguresHeading", language)}</Text>
              <Text style={styles.highlightMain}>{highlight.headline[language] || highlight.headline.en}</Text>
              <Text style={styles.highlightDetail}>{highlight.detail[language] || highlight.detail.en}</Text>
              <Text style={styles.highlightBarrier}>{highlight.barrier[language] || highlight.barrier.en}</Text>
            </View>
          )}

          {!usable || !data ? (
            <Text style={styles.noData}>{t("market.noSectorData", language)}</Text>
          ) : (
            <>
              <HorizonStrip shortTerm={data.shortTerm} longTerm={data.longTerm} language={language} />

              {data.gaps && data.gaps.length > 0 && (
                <View style={styles.gapsBox}>
                  <Text style={styles.gapsHeading}>{t("market.significantGaps", language)}</Text>
                  <View style={{ gap: 10, marginTop: 6 }}>
                    {data.gaps.map((gap, i) => (
                      <View key={i}>
                        <View style={styles.gapRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.gapSub}>{gap.subSector}</Text>
                            <Text style={styles.gapDesc}>{gap.description}</Text>
                          </View>
                          <Pressable onPress={() => startFromGapText(`${gap.subSector}: ${gap.description}`)}>
                            <Text style={styles.gapCta}>{t("market.startProjectCta", language)}</Text>
                          </Pressable>
                        </View>
                        <SourcesLine sources={gap.sources} language={language} />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {(!data.gaps || data.gaps.length === 0) && data.noGapReason && (
                <View style={styles.noGapBox}>
                  <Text style={styles.noGapHeading}>{t("market.noGapFound", language)}</Text>
                  <Text style={styles.noGapNote}>{data.noGapReason.note}</Text>
                  {data.noGapReason.sources && <SourcesLine sources={data.noGapReason.sources} language={language} />}
                </View>
              )}

              {(data.risks.length > 0 || data.opportunities.length > 0) && (
                <View style={styles.oppRiskGrid}>
                  {data.opportunities.length > 0 && (
                    <View style={styles.oppCol}>
                      <Text style={styles.oppHeading}>{t("market.whyItCouldWork", language)}</Text>
                      <View style={{ gap: 4, marginTop: 4 }}>
                        {data.opportunities.map((o, i) => (
                          <View key={i} style={styles.oppRow}>
                            <Text style={styles.oppText}>+ {o}</Text>
                            <Pressable onPress={() => startFromIdea(o)}>
                              <Text style={styles.smallCta}>{t("market.startIdeaCta", language)}</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {data.risks.length > 0 && (
                    <View style={styles.oppCol}>
                      <Text style={styles.riskHeading}>{t("market.whatCouldGoWrong", language)}</Text>
                      <View style={{ gap: 4, marginTop: 4 }}>
                        {data.risks.map((r, i) => (
                          <View key={i} style={styles.oppRow}>
                            <Text style={styles.oppText}>{"–"} {r}</Text>
                            <Pressable onPress={() => startFromIdea(r)}>
                              <Text style={styles.smallCta}>{t("market.startIdeaCta", language)}</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <SourcesLine sources={data.sources} language={language} />
              <Text style={styles.italicNote}>{t("market.researchEnglishNote", language)}</Text>
            </>
          )}

          <Pressable style={styles.assessCta} onPress={() => router.push(`/new/intro?sector=${group.id}`)}>
            <Text style={styles.assessCtaText}>{t("market.assessCta", language)}</Text>
            <Text style={styles.assessCtaText}>{"→"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function MarketScreen() {
  const { language } = useLanguage();
  const { sector: sectorParam } = useLocalSearchParams<{ sector?: string }>();
  const profileCountry = getUserProfile()?.country as CountryCode | undefined;
  const initialSector = typeof sectorParam === "string" ? sectorParam : undefined;
  const [country, setCountry] = useState<CountryCode | "">(() => (initialSector && profileCountry ? profileCountry : ""));
  const [groupId, setGroupId] = useState<string | null>(() => (initialSector ? initialSector : null));
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [sectorSheetOpen, setSectorSheetOpen] = useState(false);

  const countryOptions = useMemo(() => countrySelectOptions(language), [language]);

  const sectorOptions = useMemo(
    () => [
      { value: "", label: t("market.sectorAll", language) },
      ...SECTOR_TAXONOMY.map((g) => ({ value: g.id, label: g.name[language] || g.name.en })),
    ],
    [language]
  );

  const filtersReady = country !== "" && groupId !== null;
  const hasData = country !== "" && COUNTRY_HAS_DATA[country];
  const sectorLabel =
    groupId === null
      ? t("market.selectSector", language)
      : groupId === ""
        ? t("market.sectorAll", language)
        : SECTOR_TAXONOMY.find((g) => g.id === groupId)?.name[language];
  const countryDisplay = country ? countryLabelWithFlag(country, language) : t("market.selectCountry", language);

  const groups = useMemo(() => {
    if (!filtersReady) return [];
    let list = SECTOR_TAXONOMY;
    if (groupId) list = list.filter((g) => g.id === groupId);
    if (!hasData) return list;
    return list
      .map((g, i) => ({ g, i, rank: SIGNAL_RANK[combinedSignal(getSectorMarketData(country, g.id))] }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .map((x) => x.g);
  }, [groupId, country, hasData, filtersReady]);

  const scrollContent = useScrollContentStyle("tab");

  return (
    <ScreenScaffold>
      <ScrollView contentContainerStyle={scrollContent}>
        <ScreenHeader title={t("header.market.title", language)} subtitle={t("header.market.subtitle", language)} />

        <GroupedSection>
          <ListRow title={t("market.countryLabel", language)} value={countryDisplay} onPress={() => setCountrySheetOpen(true)} />
          <ListRow
            title={t("market.sectorLabel", language)}
            value={sectorLabel ?? t("market.selectSector", language)}
            onPress={() => setSectorSheetOpen(true)}
            isLast
          />
        </GroupedSection>

        {!filtersReady ? (
          <View style={styles.filtersPrompt}>
            <Text style={styles.filtersPromptText}>{t("market.filtersPrompt", language)}</Text>
          </View>
        ) : !hasData ? (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonHeading}>{t("market.comingSoonHeading", language)}</Text>
            <Text style={styles.comingSoonBody}>{t("market.comingSoonBody", language)}</Text>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionHeading}>{t("market.opportunityHeading", language)}</Text>
              <Text style={styles.sectionCount}>{tf("market.sectorsCount", language, { n: groups.length })}</Text>
            </View>
            {groups.length === 0 ? (
              <Text style={styles.noMatch}>{t("market.noSectorMatch", language)}</Text>
            ) : (
              <View style={{ gap: 12, marginTop: 8 }}>
                {groups.map((g) => (
                  <ResearchSectorCard
                    key={g.id}
                    group={g}
                    data={getSectorMarketData(country, g.id)}
                    language={language}
                    open={expandedGroupId === g.id}
                    onToggle={() => setExpandedGroupId((cur) => (cur === g.id ? null : g.id))}
                    country={country}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <SelectSheet
        visible={countrySheetOpen}
        title={t("market.countryLabel", language)}
        options={countryOptions}
        selectedValue={country || undefined}
        onSelect={(code) => {
          setCountry(code as CountryCode);
          setExpandedGroupId(null);
        }}
        onClose={() => setCountrySheetOpen(false)}
        closeLabel={t("common.cancel", language)}
        searchPlaceholder={t("common.search", language)}
        emptyLabel={t("common.noMatches", language)}
      />
      <SelectSheet
        visible={sectorSheetOpen}
        title={t("market.sectorLabel", language)}
        options={sectorOptions}
        selectedValue={groupId === null ? undefined : groupId}
        onSelect={(id) => {
          setGroupId(id);
          setExpandedGroupId(null);
        }}
        onClose={() => setSectorSheetOpen(false)}
        closeLabel={t("common.cancel", language)}
        searchPlaceholder={t("common.search", language)}
        emptyLabel={t("common.noMatches", language)}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  filtersPrompt: {
    marginTop: space.section - 8,
    ...cardSurface(),
    padding: space.section,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  filtersPromptText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, textAlign: "center" },
  comingSoon: {
    marginTop: space.section - 8,
    ...cardSurface(),
    padding: space.section,
    alignItems: "center",
  },
  comingSoonHeading: typography.cardTitle,
  comingSoonBody: { ...typography.cardBody, textAlign: "center" },
  sectionHeadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 },
  sectionHeading: typography.sectionLabel,
  sectionCount: { fontSize: 13, color: colors.textFaint, fontWeight: "500" },
  noMatch: {
    marginTop: 10,
    ...cardSurface(),
    padding: space.card,
    fontSize: 15,
    color: colors.textMuted,
  },

  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    backgroundColor: colors.bgElevated,
    overflow: "hidden",
  },
  cardHead: { padding: 16, gap: 6 },
  cardHeadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 },
  cardTitleWithGlyph: { flex: 1, minWidth: 0 },
  chevron: { fontSize: 14, color: "#a3a3a3" },
  chevronOpen: { transform: [{ rotate: "180deg" }] },
  cardBadgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  badgeLabel: { fontSize: 11, fontWeight: "500", color: "#a3a3a3" },
  dotSep: { color: "#d4d4d4", marginHorizontal: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600" },

  cardBody: { borderTopWidth: 1, borderTopColor: "#f5f5f5", backgroundColor: "#fafafa", padding: 16, gap: 12 },
  highlightBox: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, backgroundColor: "#fff", padding: 12 },
  highlightHeading: { fontSize: 11, fontWeight: "600", color: "#737373", textTransform: "uppercase", letterSpacing: 0.5 },
  highlightMain: { fontSize: 14, fontWeight: "600", color: "#171717", marginTop: 4 },
  highlightDetail: { fontSize: 13, color: "#525252", marginTop: 2 },
  highlightBarrier: { fontSize: 11, color: "#a3a3a3", marginTop: 4 },
  noData: { fontSize: 14, color: "#a3a3a3" },

  horizonRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, backgroundColor: "#fff", padding: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  horizonHeadRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 6 },
  horizonLabel: { fontSize: 11, fontWeight: "500", color: "#a3a3a3", textTransform: "uppercase" },
  horizonAsOf: { fontSize: 11, color: "#a3a3a3" },
  horizonSummary: { fontSize: 13, color: "#525252", marginTop: 2, lineHeight: 18 },

  gapsBox: { borderWidth: 1, borderColor: colors.accentSoftBorder, borderRadius: radii.sm, backgroundColor: colors.accentSoft, padding: 12 },
  gapsHeading: { fontSize: 11, fontWeight: "600", color: colors.accentDark, textTransform: "uppercase", letterSpacing: 0.5 },
  gapRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  gapSub: { fontSize: 14, fontWeight: "600", color: "#312e81" },
  gapDesc: { fontSize: 13, color: "#262626", marginTop: 2 },
  gapCta: { fontSize: 11, fontWeight: "600", color: colors.accentDark, textDecorationLine: "underline" },

  noGapBox: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, backgroundColor: "#fafafa", padding: 12 },
  noGapHeading: { fontSize: 11, fontWeight: "600", color: "#737373", textTransform: "uppercase" },
  noGapNote: { fontSize: 13, color: "#404040", marginTop: 4 },

  oppRiskGrid: { gap: 12 },
  oppCol: {},
  oppHeading: { fontSize: 11, fontWeight: "600", color: "#047857", textTransform: "uppercase" },
  riskHeading: { fontSize: 11, fontWeight: "600", color: "#be123c", textTransform: "uppercase" },
  oppRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  oppText: { fontSize: 13, color: "#404040", flex: 1 },
  smallCta: { fontSize: 11, fontWeight: "500", color: "#a3a3a3", textDecorationLine: "underline" },

  sourcesText: { fontSize: 11, color: "#a3a3a3", lineHeight: 16 },
  sourceLink: { textDecorationLine: "underline", color: "#737373" },
  italicNote: { fontSize: 11, fontStyle: "italic", color: "#d4d4d4" },

  assessCta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assessCtaText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
