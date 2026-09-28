import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useLanguage } from "@/lib/LanguageContext";
import { ti } from "@/lib/intake-copy";
import { LOCALE_BY_LANGUAGE, t, tf } from "@/lib/ui-copy";
import type { Intake } from "@/lib/types";
import { INTAKE_06_ITEMS } from "@/lib/types";
import { getBusiness, getLatestAssessment, saveDraftIntake } from "@/lib/db";

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
function revenueBands(language: ReturnType<typeof useLanguage>["language"]): [string, string][] {
  return [
    ["none", t("reassess.revenueNone", language)],
    ["under_10k", "Under $10,000"],
    ["10k_50k", "$10,000 – $50,000"],
    ["50k_250k", "$50,000 – $250,000"],
    ["250k_1m", "$250,000 – $1,000,000"],
    ["over_1m", "Over $1,000,000"],
    ["prefer_not_to_say", t("reassess.revenuePreferNot", language)],
  ];
}

export default function ReassessScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const { language } = useLanguage();

  const business = useMemo(() => getBusiness(businessId), [businessId]);
  const previous = useMemo(() => getLatestAssessment(businessId), [businessId]);
  const defaults = previous ? previous.intake : null;

  const [timeInOperation, setTimeInOperation] = useState<Intake["time_in_operation"] | "">(defaults?.time_in_operation ?? "");
  const [paymentStatus, setPaymentStatus] = useState<"A" | "B" | "C" | "D" | "E" | "">((defaults?.customer_payment_status as any) ?? "");
  const [revenueCurrency, setRevenueCurrency] = useState<"USD" | "UZS">((defaults?.revenue_currency as "USD" | "UZS") ?? "USD");
  const [revenueBand, setRevenueBand] = useState(defaults?.revenue_band ?? "prefer_not_to_say");
  const [peopleBand, setPeopleBand] = useState(defaults?.people_band ?? "");
  const [customerBand, setCustomerBand] = useState(defaults?.customer_base_band ?? "");
  const [inPlace, setInPlace] = useState<Set<string>>(new Set(defaults?.currently_in_place ?? []));
  const [fundingBasis, setFundingBasis] = useState<Set<string>>(new Set(defaults?.funding_basis ?? []));
  const [error, setError] = useState<string | null>(null);

  if (!business) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("common.notFound", language)}</Text>
          <Pressable onPress={() => router.push("/(tabs)/explore" as any)}>
            <Text style={styles.notFoundLink}>{t("tab.explore", language)}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const canSubmit = !!timeInOperation && !!paymentStatus;

  function submit() {
    if (!canSubmit) {
      setError(t("reassess.errorRequired", language));
      return;
    }
    const intake: Intake = {
      time_in_operation: timeInOperation,
      customer_payment_status: paymentStatus,
      revenue_band: revenueBand,
      revenue_currency: revenueCurrency,
      people_band: peopleBand,
      customer_base_band: customerBand,
      currently_in_place: INTAKE_06_ITEMS.filter((item) => inPlace.has(item)),
      funding_basis: Array.from(fundingBasis),
      sector: business!.sector,
      language: "en",
    };
    saveDraftIntake(businessId, intake);
    router.push(`/assessment/${businessId}?reassess=1` as any);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{tf("reassess.heading", language, { name: business.name })}</Text>
        <Text style={styles.subtitle}>
          {tf("reassess.subtitle", language, { name: business.name })}
        </Text>
        {previous && (
          <Text style={styles.previousLine}>
            {tf("reassess.lastAssessed", language, {
              date: new Date(previous.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language]),
              health: previous.business_health_score,
              risk: previous.risk_exposure_score,
            })}
          </Text>
        )}

        <Field label={ti("timeInOperation", language)} hint={ti("timeInOperationHint", language)}>
          <ChipGroup
            options={TIME_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])}
            value={timeInOperation}
            onChange={(v) => setTimeInOperation(v as Intake["time_in_operation"])}
          />
        </Field>

        <Field label={ti("customerPaymentStatus", language)}>
          <ChipGroup
            options={PAYMENT_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])}
            value={paymentStatus}
            onChange={(v) => setPaymentStatus(v as "A" | "B" | "C" | "D" | "E")}
            vertical
          />
        </Field>

        <Field label={ti("revenueLabel", language)}>
          <View style={{ gap: 8 }}>
            <View style={styles.currencyRow}>
              {(["USD", "UZS"] as const).map((c) => (
                <Pressable key={c} style={[styles.chip, revenueCurrency === c && styles.chipActive]} onPress={() => setRevenueCurrency(c)}>
                  <Text style={[styles.chipText, revenueCurrency === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <ChipGroup options={revenueBands(language)} value={revenueBand} onChange={setRevenueBand} vertical />
          </View>
        </Field>

        <Field label={ti("peopleBand", language)} hint={ti("peopleBandHint", language)}>
          <ChipGroup options={PEOPLE_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])} value={peopleBand} onChange={setPeopleBand} />
        </Field>

        <Field label={ti("customerBaseBand", language)}>
          <ChipGroup options={CUSTOMER_OPTIONS.map(([v, k]) => [v, ti(k as any, language)] as [string, string])} value={customerBand} onChange={setCustomerBand} />
        </Field>

        <Field label={ti("inPlaceLabel", language)} hint={ti("inPlaceHint", language)}>
          <View style={{ gap: 8 }}>
            {IN_PLACE_OPTIONS.map(([value, key]) => (
              <CheckRow key={value} label={ti(key as any, language)} checked={inPlace.has(value)} onToggle={() => toggle(inPlace, setInPlace, value)} />
            ))}
          </View>
        </Field>

        <Field label={ti("fundingBasisLabel", language)} hint={ti("fundingBasisHint", language)}>
          <View style={{ gap: 8 }}>
            {FUNDING_OPTIONS.map(([value, key]) => (
              <CheckRow key={value} label={ti(key as any, language)} checked={fundingBasis.has(value)} onToggle={() => toggle(fundingBasis, setFundingBasis, value)} />
            ))}
          </View>
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}
        {!canSubmit && <Text style={styles.helperText}>{t("reassess.errorRequired", language)}</Text>}

        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && canSubmit && styles.submitButtonPressed]}
          onPress={submit}
        >
          <Text style={styles.submitButtonText}>{ti("submit", language)}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      {children}
    </View>
  );
}

function ChipGroup({ options, value, onChange, vertical }: { options: [string, string][]; value: string; onChange: (v: string) => void; vertical?: boolean }) {
  return (
    <View style={vertical ? { gap: 8 } : styles.chipRow}>
      {options.map(([v, label]) => (
        <Pressable key={v} style={[styles.chip, value === v && styles.chipActive, vertical && styles.chipFull]} onPress={() => onChange(v)}>
          <Text style={[styles.chipText, value === v && styles.chipTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <Switch value={checked} onValueChange={onToggle} />
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48, gap: 4 },
  title: { fontSize: 20, fontWeight: "600", color: "#171717" },
  notFoundLink: { marginTop: 12, fontSize: 14, fontWeight: "500", color: "#171717", textDecorationLine: "underline" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#737373" },
  previousLine: { marginTop: 8, fontSize: 12, color: "#a3a3a3" },
  field: { marginTop: 16, gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#262626" },
  fieldHint: { fontSize: 12, color: "#737373" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  currencyRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff" },
  chipFull: { alignSelf: "flex-start" },
  chipActive: { backgroundColor: "#171717", borderColor: "#171717" },
  chipText: { fontSize: 13, color: "#171717", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkLabel: { flex: 1, fontSize: 13, color: "#404040" },
  error: { marginTop: 16, fontSize: 13, color: "#b91c1c" },
  helperText: { marginTop: 16, fontSize: 12, color: "#737373" },
  submitButton: { marginTop: 12, borderRadius: 8, backgroundColor: "#171717", paddingVertical: 14, alignItems: "center" },
  submitButtonPressed: { opacity: 0.8 },
  submitButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
