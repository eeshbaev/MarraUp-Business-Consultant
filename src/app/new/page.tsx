import { createBusinessAction } from "@/app/actions";
import FlowPage from "@/components/FlowPage";
import { getLanguage } from "@/lib/language";
import { ti } from "@/lib/intake-copy";
import type { Language } from "@/lib/types";
import SectorPicker from "@/components/SectorPicker";

// Revenue bands: the Intake doc (Part G, item 3) explicitly marks the exact
// numeric breakpoints as a low-stakes implementation detail to set when this
// screen is actually built — never scoring, benchmarking metadata only. Two
// currencies, one band list each; a fixed illustrative conversion, not live FX.
// Numeric bands don't need translation (numerals + currency codes read the
// same in all 5 languages); only "No revenue" / "Prefer not to say" do.
const REVENUE_LABELS: Record<Language, { none: string; preferNot: string }> = {
  en: { none: "No revenue", preferNot: "Prefer not to say" },
  uz: { none: "Daromad yo'q", preferNot: "Aytishni istamayman" },
  ru: { none: "Нет выручки", preferNot: "Предпочитаю не указывать" },
  zh: { none: "无营收", preferNot: "不愿透露" },
  fr: { none: "Aucun revenu", preferNot: "Préfère ne pas dire" },
};

function revenueBandsUsd(language: Language) {
  const l = REVENUE_LABELS[language];
  return [
    ["none", l.none],
    ["under_10k", "Under $10,000"],
    ["10k_50k", "$10,000 – $50,000"],
    ["50k_250k", "$50,000 – $250,000"],
    ["250k_1m", "$250,000 – $1,000,000"],
    ["over_1m", "Over $1,000,000"],
    ["prefer_not_to_say", l.preferNot],
  ];
}
function revenueBandsUzs(language: Language) {
  const l = REVENUE_LABELS[language];
  return [
    ["none", l.none],
    ["under_10k", "Under 120,000,000 UZS"],
    ["10k_50k", "120,000,000 – 600,000,000 UZS"],
    ["50k_250k", "600,000,000 – 3,000,000,000 UZS"],
    ["250k_1m", "3,000,000,000 – 12,000,000,000 UZS"],
    ["over_1m", "Over 12,000,000,000 UZS"],
    ["prefer_not_to_say", l.preferNot],
  ];
}

export default async function NewBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; name?: string }>;
}) {
  const language = await getLanguage();
  const bandsUsd = revenueBandsUsd(language);
  const bandsUzs = revenueBandsUzs(language);
  // Deep link from Market's "Assess a business in this sector" card action,
  // or from My Path's "Push to Business Assessment" on an Idea Candidate
  // (which also prefills a starting name — the user's own idea text, never
  // AI-generated, and always editable here before saving).
  const { sector: initialSector, name: initialName } = await searchParams;

  return (
    <FlowPage>
    <form action={createBusinessAction} className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{ti("pageTitle", language)}</h1>
        <p className="mt-1 text-sm text-neutral-600">{ti("pageSubtitle", language)}</p>
      </div>

      <section className="space-y-4">
        <Field label={ti("businessName", language)}>
          <input name="name" required defaultValue={initialName ?? ""} className={inputClass} />
        </Field>
        <Field label={ti("ownerName", language)}>
          <input name="owner_name" required className={inputClass} />
        </Field>
        <Field label={ti("sector", language)} hint={ti("sectorHint", language)}>
          <SectorPicker language={language} initialGroupId={initialSector} />
        </Field>
      </section>

      <section className="space-y-5 border-t border-neutral-200 pt-6">
        <Field label={ti("timeInOperation", language)} hint={ti("timeInOperationHint", language)}>
          <select name="time_in_operation" required className={inputClass} defaultValue="">
            <option value="" disabled>{ti("selectOne", language)}</option>
            <option value="<6mo">{ti("time_lt6mo", language)}</option>
            <option value="6-12mo">{ti("time_6to12mo", language)}</option>
            <option value="1-3y">{ti("time_1to3y", language)}</option>
            <option value="3-10y">{ti("time_3to10y", language)}</option>
            <option value=">10y">{ti("time_gt10y", language)}</option>
          </select>
        </Field>

        <Field label={ti("customerPaymentStatus", language)}>
          <select name="customer_payment_status" required className={inputClass} defaultValue="">
            <option value="" disabled>{ti("selectOne", language)}</option>
            <option value="A">{ti("payment_A", language)}</option>
            <option value="B">{ti("payment_B", language)}</option>
            <option value="C">{ti("payment_C", language)}</option>
            <option value="D">{ti("payment_D", language)}</option>
            <option value="E">{ti("payment_E", language)}</option>
          </select>
        </Field>

        <Field label={ti("revenueLabel", language)}>
          <div className="flex gap-2">
            <select name="revenue_currency" className={`${inputClass} w-28`} defaultValue="USD">
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </select>
            <select name="revenue_band" className={inputClass} defaultValue="prefer_not_to_say">
              {bandsUsd.map(([value, labelUsd], i) => (
                <option key={value} value={value}>
                  {labelUsd} {value !== "prefer_not_to_say" ? `/ ${bandsUzs[i][1]}` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label={ti("peopleBand", language)} hint={ti("peopleBandHint", language)}>
          <select name="people_band" className={inputClass} defaultValue="">
            <option value="" disabled>{ti("selectOne", language)}</option>
            <option value="just_me">{ti("people_justMe", language)}</option>
            <option value="2-5">{ti("people_2to5", language)}</option>
            <option value="6-20">{ti("people_6to20", language)}</option>
            <option value="21-100">{ti("people_21to100", language)}</option>
            <option value="100+">{ti("people_100plus", language)}</option>
          </select>
        </Field>

        <Field label={ti("customerBaseBand", language)}>
          <select name="customer_base_band" className={inputClass} defaultValue="">
            <option value="" disabled>{ti("selectOne", language)}</option>
            <option value="none">{ti("cust_none", language)}</option>
            <option value="1-5">{ti("cust_1to5", language)}</option>
            <option value="6-25">{ti("cust_6to25", language)}</option>
            <option value="26-100">{ti("cust_26to100", language)}</option>
            <option value="100+">{ti("cust_100plus", language)}</option>
            <option value="too_many">{ti("cust_tooMany", language)}</option>
          </select>
        </Field>

        <Field label={ti("inPlaceLabel", language)} hint={ti("inPlaceHint", language)}>
          <div className="space-y-2">
            {[
              ["paying_customers", ti("in_payingCustomers", language)],
              ["active_reach", ti("in_activeReach", language)],
              ["product_delivered", ti("in_productDelivered", language)],
              ["suppliers", ti("in_suppliers", language)],
              ["premises", ti("in_premises", language)],
              ["systems", ti("in_systems", language)],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={`in_place__${value}`} />
                {label}
              </label>
            ))}
          </div>
        </Field>

        <Field label={ti("fundingBasisLabel", language)} hint={ti("fundingBasisHint", language)}>
          <div className="space-y-2">
            {[
              ["own_revenue", ti("fund_ownRevenue", language)],
              ["owner_money", ti("fund_ownerMoney", language)],
              ["family_friends", ti("fund_familyFriends", language)],
              ["external_investment", ti("fund_externalInvestment", language)],
              ["borrowing", ti("fund_borrowing", language)],
              ["grants", ti("fund_grants", language)],
              ["not_yet_funded", ti("fund_notYetFunded", language)],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="funding_basis" value={value} />
                {label}
              </label>
            ))}
          </div>
        </Field>
      </section>

      <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
        {ti("submit", language)}
      </button>
    </form>
    </FlowPage>
  );
}

const inputClass = "block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      {children}
    </label>
  );
}
