import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import SectorPicker from "@/components/SectorPicker";
import { ChoiceOptionGroup } from "@/components/ui/ChoiceOptionGroup";
import { GroupedSection } from "@/components/ui/GroupedSection";
import { GroupedTextField } from "@/components/ui/GroupedTextField";
import { GroupedToggleRow } from "@/components/ui/GroupedToggleRow";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useLanguage } from "@/lib/LanguageContext";
import { ti } from "@/lib/intake-copy";
import type { Language, Intake } from "@/lib/types";
import { INTAKE_06_ITEMS } from "@/lib/types";
import { createBusiness, saveDraftIntake } from "@/lib/db";
import { sectorDisplayLabel } from "@/lib/sector-taxonomy";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { colors, panelSurface, space, type as typography } from "@/lib/theme";
import { t, tf } from "@/lib/ui-copy";

const REVENUE_LABELS: Record<Language, { none: string; preferNot: string }> = {
  en: { none: "No revenue", preferNot: "Prefer not to say" },
  uz: { none: "Daromad yo'q", preferNot: "Aytishni istamayman" },
  ru: { none: "Нет выручки", preferNot: "Предпочитаю не указывать" },
  zh: { none: "无营收", preferNot: "不愿透露" },
  fr: { none: "Aucun revenu", preferNot: "Préfère ne pas dire" },
};

function revenueBands(language: Language): [string, string][] {
  const l = REVENUE_LABELS[language];
  return [
    ["none", l.none],
    ["under_10k", "Under $10,000 / 120,000,000 UZS"],
    ["10k_50k", "$10,000 – $50,000 / 120,000,000 – 600,000,000 UZS"],
    ["50k_250k", "$50,000 – $250,000 / 600,000,000 – 3,000,000,000 UZS"],
    ["250k_1m", "$250,000 – $1,000,000 / 3,000,000,000 – 12,000,000,000 UZS"],
    ["over_1m", "Over $1,000,000 / 12,000,000,000 UZS"],
    ["prefer_not_to_say", l.preferNot],
  ];
}

const TIME_OPTIONS: [Intake["time_in_operation"], string][] = [
  ["<6mo", "time_lt6mo"],
  ["6-12mo", "time_6to12mo"],
  ["1-3y", "time_1to3y"],
  ["3-10y", "time_3to10y"],
  [">10y", "time_gt10y"],
];
const PAYMENT_OPTIONS: ["A" | "B" | "C" | "D" | "E", string][] = [
  ["A", "payment_A"],
  ["B", "payment_B"],
  ["C", "payment_C"],
  ["D", "payment_D"],
  ["E", "payment_E"],
];
const PEOPLE_OPTIONS: [string, string][] = [
  ["just_me", "people_justMe"],
  ["2-5", "people_2to5"],
  ["6-20", "people_6to20"],
  ["21-100", "people_21to100"],
  ["100+", "people_100plus"],
];
const CUSTOMER_OPTIONS: [string, string][] = [
  ["none", "cust_none"],
  ["1-5", "cust_1to5"],
  ["6-25", "cust_6to25"],
  ["26-100", "cust_26to100"],
  ["100+", "cust_100plus"],
  ["too_many", "cust_tooMany"],
];
const IN_PLACE_OPTIONS: [string, string][] = [
  ["paying_customers", "in_payingCustomers"],
  ["active_reach", "in_activeReach"],
  ["product_delivered", "in_productDelivered"],
  ["suppliers", "in_suppliers"],
  ["premises", "in_premises"],
  ["systems", "in_systems"],
];
const FUNDING_OPTIONS: [string, string][] = [
  ["own_revenue", "fund_ownRevenue"],
  ["owner_money", "fund_ownerMoney"],
  ["family_friends", "fund_familyFriends"],
  ["external_investment", "fund_externalInvestment"],
  ["borrowing", "fund_borrowing"],
  ["grants", "fund_grants"],
  ["not_yet_funded", "fund_notYetFunded"],
];

export default function NewBusinessScreen() {
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ sector?: string; name?: string; description?: string }>();
  const prefillDescription = typeof params.description === "string" ? params.description : "";

  const [name, setName] = useState(
    typeof params.name === "string" && params.name ? params.name : prefillDescription.slice(0, 80)
  );
  const [ownerName, setOwnerName] = useState("");
  const [sectorGroup, setSectorGroup] = useState(typeof params.sector === "string" ? params.sector : "");
  const [sectorSub, setSectorSub] = useState("");
  const [timeInOperation, setTimeInOperation] = useState<Intake["time_in_operation"] | "">("");
  const [paymentStatus, setPaymentStatus] = useState<"A" | "B" | "C" | "D" | "E" | "">("");
  const [revenueCurrency, setRevenueCurrency] = useState<"USD" | "UZS">("USD");
  const [revenueBand, setRevenueBand] = useState("prefer_not_to_say");
  const [peopleBand, setPeopleBand] = useState("");
  const [customerBand, setCustomerBand] = useState("");
  const [inPlace, setInPlace] = useState<Set<string>>(new Set());
  const [fundingBasis, setFundingBasis] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const trimmedName = name.trim();
  const trimmedOwner = ownerName.trim();
  const missingFields: string[] = [];
  if (!trimmedName) missingFields.push(ti("businessName", language));
  if (!trimmedOwner) missingFields.push(ti("ownerName", language));
  if (!sectorGroup || !sectorSub) missingFields.push(ti("sector", language));
  if (!timeInOperation) missingFields.push(ti("timeInOperation", language));
  if (!paymentStatus) missingFields.push(ti("customerPaymentStatus", language));
  const canSubmit = missingFields.length === 0;

  function submit() {
    if (!canSubmit) {
      setError(t("reassess.errorRequired", language));
      return;
    }
    const sector = sectorDisplayLabel(sectorGroup, sectorSub);
    const business = createBusiness({ name: trimmedName, owner_name: trimmedOwner, sector });
    const intake: Intake = {
      time_in_operation: timeInOperation as Intake["time_in_operation"],
      customer_payment_status: paymentStatus as Intake["customer_payment_status"],
      revenue_band: revenueBand,
      revenue_currency: revenueCurrency,
      people_band: peopleBand,
      customer_base_band: customerBand,
      currently_in_place: INTAKE_06_ITEMS.filter((item) => inPlace.has(item)),
      funding_basis: Array.from(fundingBasis),
      sector,
      language: "en",
    };
    saveDraftIntake(business.id, intake);
    router.push(`/assessment/${business.id}`);
  }

  return (
    <ScreenScaffold background="flat" safeBottom>
      <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
        <FlowBackHeader backLabel={t("tab.explore", language)} onBack={() => router.back()} />
        <Text style={typography.screenTitle}>{ti("pageTitle", language)}</Text>
        <View style={styles.hero}>
          <Text style={styles.heroBody}>{ti("pageSubtitle", language)}</Text>
        </View>

        <GroupedSection title={ti("businessName", language)} form>
          <GroupedTextField value={name} onChangeText={setName} autoCapitalize="words" isLast />
        </GroupedSection>

        <GroupedSection title={ti("ownerName", language)} form>
          <GroupedTextField value={ownerName} onChangeText={setOwnerName} autoCapitalize="words" isLast />
        </GroupedSection>

        <GroupedSection title={ti("sector", language)} footer={ti("sectorHint", language)}>
          <View style={styles.inset}>
            <SectorPicker
              language={language}
              initialGroupId={sectorGroup}
              onChange={(g, s) => {
                setSectorGroup(g);
                setSectorSub(s);
              }}
            />
          </View>
        </GroupedSection>

        <GroupedSection title={ti("timeInOperation", language)} footer={ti("timeInOperationHint", language)}>
          <ChoiceOptionGroup
            options={TIME_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])}
            value={timeInOperation}
            onChange={(v) => setTimeInOperation(v as Intake["time_in_operation"])}
          />
        </GroupedSection>

        <GroupedSection title={ti("customerPaymentStatus", language)}>
          <ChoiceOptionGroup
            layout="stack"
            options={PAYMENT_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])}
            value={paymentStatus}
            onChange={(v) => setPaymentStatus(v as "A" | "B" | "C" | "D" | "E")}
          />
        </GroupedSection>

        <GroupedSection title={ti("revenueLabel", language)}>
          <View style={styles.currencyBlock}>
            <SegmentedControl
              segments={[
                { id: "USD", label: "USD" },
                { id: "UZS", label: "UZS" },
              ]}
              value={revenueCurrency}
              onChange={(id) => setRevenueCurrency(id as "USD" | "UZS")}
            />
          </View>
          <ChoiceOptionGroup options={revenueBands(language)} value={revenueBand} onChange={setRevenueBand} layout="stack" />
        </GroupedSection>

        <GroupedSection title={ti("peopleBand", language)} footer={ti("peopleBandHint", language)}>
          <ChoiceOptionGroup
            options={PEOPLE_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])}
            value={peopleBand}
            onChange={setPeopleBand}
          />
        </GroupedSection>

        <GroupedSection title={ti("customerBaseBand", language)}>
          <ChoiceOptionGroup
            options={CUSTOMER_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])}
            value={customerBand}
            onChange={setCustomerBand}
          />
        </GroupedSection>

        <GroupedSection title={ti("inPlaceLabel", language)} footer={ti("inPlaceHint", language)}>
          {IN_PLACE_OPTIONS.map(([value, key], index) => (
            <GroupedToggleRow
              key={value}
              label={ti(key as any, language)}
              value={inPlace.has(value)}
              onValueChange={() => toggle(inPlace, setInPlace, value)}
              isLast={index === IN_PLACE_OPTIONS.length - 1}
            />
          ))}
        </GroupedSection>

        <GroupedSection title={ti("fundingBasisLabel", language)} footer={ti("fundingBasisHint", language)}>
          {FUNDING_OPTIONS.map(([value, key], index) => (
            <GroupedToggleRow
              key={value}
              label={ti(key as any, language)}
              value={fundingBasis.has(value)}
              onValueChange={() => toggle(fundingBasis, setFundingBasis, value)}
              isLast={index === FUNDING_OPTIONS.length - 1}
            />
          ))}
        </GroupedSection>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!canSubmit ? (
          <Text style={styles.helperText}>{tf("intake.fillToContinue", language, { fields: missingFields.join(", ") })}</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        <PrimaryButton
          label={ti("submit", language)}
          onPress={submit}
          disabled={!canSubmit}
          hint={!canSubmit ? missingFields.slice(0, 2).join(", ") : undefined}
        />
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...panelSurface({ marginTop: 10, marginBottom: 4 }),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: space.card + 4,
  },
  heroBody: { ...typography.screenSubtitle, marginTop: 0, fontSize: 15, lineHeight: 22 },
  inset: { paddingHorizontal: space.card, paddingVertical: 14, gap: 10 },
  currencyBlock: { paddingHorizontal: space.card, paddingTop: 12, paddingBottom: 4 },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  error: { fontSize: 14, color: colors.danger, marginBottom: space.section, paddingHorizontal: 4 },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: space.section,
    paddingHorizontal: 4,
  },
});
