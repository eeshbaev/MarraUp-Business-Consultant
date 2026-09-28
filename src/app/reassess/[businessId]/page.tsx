import { getBusiness, getLatestAssessment } from "@/lib/db";
import { notFound } from "next/navigation";
import { startReassessmentAction } from "@/app/actions";
import FlowPage from "@/components/FlowPage";
import { getLanguage } from "@/lib/language";
import { ti } from "@/lib/intake-copy";
import { LOCALE_BY_LANGUAGE } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

// The fix for "there's no way to reassess the same business" — this reuses
// the existing business_id (name/owner/sector aren't re-asked; those belong
// to the business, not to one cycle) and collects a fresh Intake, same
// fields as first-time /new. submitAssessmentAction (unchanged) then adds a
// new assessment row to this business's existing history rather than
// creating a new Business.
export default async function ReassessPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = getBusiness(businessId);
  if (!business) notFound();
  const language = await getLanguage();
  const previous = getLatestAssessment(businessId);

  return (
    <FlowPage>
      <form action={startReassessmentAction} className="space-y-10">
        <input type="hidden" name="business_id" value={businessId} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reassess — {business.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            A fresh look at where things stand now. This adds to {business.name}&apos;s history — it doesn&apos;t erase your
            last assessment, and you&apos;ll see how things have moved once you&apos;re done.
          </p>
          {previous && (
            <p className="mt-2 text-xs text-neutral-500">
              Last assessed {new Date(previous.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language])} — Health {previous.business_health_score}/100,
              Risk {previous.risk_exposure_score}/100.
            </p>
          )}
        </div>

        <ReassessIntakeFields language={language} defaults={previous ? previous.intake : null} />

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

function ReassessIntakeFields({
  language,
  defaults,
}: {
  language: Language;
  defaults: { time_in_operation: string; customer_payment_status: string; revenue_band: string; revenue_currency: string; people_band: string; customer_base_band: string } | null;
}) {
  const bandsUsd = [
    ["none", "No revenue"],
    ["under_10k", "Under $10,000"],
    ["10k_50k", "$10,000 – $50,000"],
    ["50k_250k", "$50,000 – $250,000"],
    ["250k_1m", "$250,000 – $1,000,000"],
    ["over_1m", "Over $1,000,000"],
    ["prefer_not_to_say", "Prefer not to say"],
  ];

  return (
    <section className="space-y-5">
      <Field label={ti("timeInOperation", language)} hint={ti("timeInOperationHint", language)}>
        <select name="time_in_operation" required className={inputClass} defaultValue={defaults?.time_in_operation ?? ""}>
          <option value="" disabled>{ti("selectOne", language)}</option>
          <option value="<6mo">{ti("time_lt6mo", language)}</option>
          <option value="6-12mo">{ti("time_6to12mo", language)}</option>
          <option value="1-3y">{ti("time_1to3y", language)}</option>
          <option value="3-10y">{ti("time_3to10y", language)}</option>
          <option value=">10y">{ti("time_gt10y", language)}</option>
        </select>
      </Field>

      <Field label={ti("customerPaymentStatus", language)}>
        <select name="customer_payment_status" required className={inputClass} defaultValue={defaults?.customer_payment_status ?? ""}>
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
          <select name="revenue_currency" className={`${inputClass} w-28`} defaultValue={defaults?.revenue_currency ?? "USD"}>
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
          </select>
          <select name="revenue_band" className={inputClass} defaultValue={defaults?.revenue_band ?? "prefer_not_to_say"}>
            {bandsUsd.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field label={ti("peopleBand", language)} hint={ti("peopleBandHint", language)}>
        <select name="people_band" className={inputClass} defaultValue={defaults?.people_band ?? ""}>
          <option value="" disabled>{ti("selectOne", language)}</option>
          <option value="just_me">{ti("people_justMe", language)}</option>
          <option value="2-5">{ti("people_2to5", language)}</option>
          <option value="6-20">{ti("people_6to20", language)}</option>
          <option value="21-100">{ti("people_21to100", language)}</option>
          <option value="100+">{ti("people_100plus", language)}</option>
        </select>
      </Field>

      <Field label={ti("customerBaseBand", language)}>
        <select name="customer_base_band" className={inputClass} defaultValue={defaults?.customer_base_band ?? ""}>
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
  );
}
