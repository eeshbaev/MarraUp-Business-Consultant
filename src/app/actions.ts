"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE } from "@/lib/language";
import type { Language } from "@/lib/types";
import {
  createBusiness,
  getBusiness,
  saveDraftIntake,
  getDraftIntake,
  saveAssessment,
  savePlan,
  getAssessment,
  getPlanByAssessment,
  updatePlanItems,
  updateAssessmentAnswers,
  deleteBusiness,
  saveUserProfile,
  createDeliveryEvidence,
} from "@/lib/db";
import { COUNTRY_CODES } from "@/lib/market-copy";
import { buildAssessment } from "@/lib/scoring/assessment";
import { buildPlan } from "@/lib/action-plan/engine";
import { scoreHealth } from "@/lib/scoring/health";
import { scoreRisk } from "@/lib/scoring/risk";
import { checkResolution, type ResolutionContext } from "@/lib/resolution";
import { HEALTH_QUESTIONS, RISK_FIELDS } from "@/lib/content";
import type { Intake, Level, OwnerExposureLevel, ActionItem } from "@/lib/types";
import { INTAKE_06_ITEMS } from "@/lib/types";
import { sectorDisplayLabel } from "@/lib/sector-taxonomy";

// Sector/sub-sector: two mandatory dropdowns (sector-taxonomy.ts), not free
// text — combined into a single plain-English string for storage, same shape
// Business.sector / Intake.sector always had.
function readSectorFromForm(formData: FormData): string {
  const groupId = String(formData.get("sector_group") || "");
  const subId = String(formData.get("sector_sub") || "");
  return sectorDisplayLabel(groupId, subId);
}

function readIntakeFromForm(formData: FormData): Intake {
  return {
    time_in_operation: String(formData.get("time_in_operation")) as Intake["time_in_operation"],
    customer_payment_status: String(formData.get("customer_payment_status")) as Level,
    revenue_band: String(formData.get("revenue_band") || "prefer_not_to_say"),
    revenue_currency: (String(formData.get("revenue_currency") || "USD")) as Intake["revenue_currency"],
    people_band: String(formData.get("people_band") || ""),
    customer_base_band: String(formData.get("customer_base_band") || ""),
    currently_in_place: INTAKE_06_ITEMS.filter((item) => formData.get(`in_place__${item}`) === "on"),
    funding_basis: formData.getAll("funding_basis").map(String),
    sector: readSectorFromForm(formData),
    language: "en",
  };
}

export async function createBusinessAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const owner_name = String(formData.get("owner_name") || "").trim();
  const sector = readSectorFromForm(formData);
  if (!name || !owner_name || !sector) {
    throw new Error("Business name, owner name, sector, and sub-sector are all required.");
  }

  const business = createBusiness({ name, owner_name, sector });
  const intake = readIntakeFromForm(formData);
  saveDraftIntake(business.id, intake);

  redirect(`/assessment/${business.id}`);
}

// Starts a reassessment cycle for an EXISTING business — the fix for the
// gap where the only way to get a new assessment was /new, which always
// created a brand-new Business row. This reuses the same business_id: name,
// owner, and sector aren't re-asked (they rarely change), just a fresh
// Intake. submitAssessmentAction then does the rest exactly as it already
// does for a first-time assessment — INSERTs a new assessment row, so the
// business's full history (listAssessments) is never lost or overwritten.
export async function startReassessmentAction(formData: FormData) {
  const businessId = String(formData.get("business_id") || "");
  if (!businessId) throw new Error("Missing business.");
  const business = getBusiness(businessId);
  if (!business) throw new Error("Business not found.");

  // Same fields as a first-time intake, minus name/owner/sector — those
  // belong to the business, not to one cycle, so they aren't re-asked here.
  const intake: Intake = {
    time_in_operation: String(formData.get("time_in_operation")) as Intake["time_in_operation"],
    customer_payment_status: String(formData.get("customer_payment_status")) as Level,
    revenue_band: String(formData.get("revenue_band") || "prefer_not_to_say"),
    revenue_currency: String(formData.get("revenue_currency") || "USD") as Intake["revenue_currency"],
    people_band: String(formData.get("people_band") || ""),
    customer_base_band: String(formData.get("customer_base_band") || ""),
    currently_in_place: INTAKE_06_ITEMS.filter((item) => formData.get(`in_place__${item}`) === "on"),
    funding_basis: formData.getAll("funding_basis").map(String),
    sector: business.sector,
    language: "en",
  };
  saveDraftIntake(businessId, intake);
  redirect(`/assessment/${businessId}?reassess=1`);
}

export async function submitAssessmentAction(formData: FormData) {
  const businessId = String(formData.get("business_id"));
  const intake = getDraftIntake(businessId);
  if (!intake) throw new Error("No draft intake found for this business — start over from the intro form.");

  const health_answers: Record<string, Level> = {};
  for (const q of HEALTH_QUESTIONS) {
    const v = formData.get(`health__${q.question_id}`);
    if (v) health_answers[q.question_id] = String(v) as Level;
  }

  const risk_answers: Record<string, Level> = {};
  for (const f of RISK_FIELDS) {
    const v = formData.get(`risk__${f.field_id}`);
    if (v) risk_answers[f.field_id] = String(v) as Level;
  }

  const owner_exposure_level = Number(formData.get("owner_exposure_level") || 1) as OwnerExposureLevel;

  const assessment = buildAssessment({
    id: `asmt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    business_id: businessId,
    intake,
    raw_health_answers: health_answers,
    raw_risk_answers: risk_answers,
    owner_exposure_level,
  });

  saveAssessment(assessment);
  const plan = buildPlan(assessment);
  savePlan(businessId, assessment.id, { action_plan: plan.action_plan, other_actions_counts: plan.other_actions_counts });

  redirect(`/results/${businessId}`);
}

function contextFromAssessment(healthAnswers: Record<string, Level>, riskAnswers: Record<string, Level | "UNPROVEN">, ownerLevel: number): ResolutionContext {
  // Recompute the derived facts a resolution check needs (category totals,
  // live Critical Exposures, saturated categories) from the current answers
  // via the same canonical scoring engine Results/Plan use — never a
  // hand-rolled second copy of the category weights, and never a stale value.
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

// "Mark as delivered" / confirm_item(): re-asks the specific field(s) this
// action item's resolution_rule depends on, merges the new answer(s) into
// the business's stored assessment, and checks resolution — never a generic
// "done" toggle (UI contract, Section 7).
export async function confirmActionItemAction(formData: FormData) {
  const assessmentId = String(formData.get("assessment_id"));
  const itemId = String(formData.get("item_id"));
  const businessId = String(formData.get("business_id"));

  const assessment = getAssessment(assessmentId);
  const plan = getPlanByAssessment(assessmentId);
  if (!assessment || !plan) throw new Error("Assessment or plan not found.");

  const item = plan.action_plan.find((i) => i.id === itemId);
  if (!item) throw new Error("Action item not found in this plan.");

  if (item.resolution_rule.type === "CATEGORY_THRESHOLD" || item.resolution_rule.type === "COUNT_THRESHOLD") {
    throw new Error("This item resolves only at the next full reassessment — there is no on-demand control for it.");
  }

  // Merge any re-answered fields the confirm form submitted.
  const updatedHealth = { ...assessment.health_answers };
  const updatedRisk = { ...assessment.risk_answers };
  let updatedOwner = assessment.owner_exposure_level;

  for (const f of item.source_fields) {
    const v = formData.get(`answer__${f}`);
    if (!v) continue;
    if (f === "OWN-01") updatedOwner = Number(v) as OwnerExposureLevel;
    else if (HEALTH_QUESTIONS.some((q) => q.question_id === f)) updatedHealth[f] = String(v) as Level;
    else updatedRisk[f] = String(v) as Level;
  }

  const ctx = contextFromAssessment(updatedHealth, updatedRisk, updatedOwner);
  const resolved = checkResolution(item.resolution_rule, ctx);

  const updatedItems: ActionItem[] = plan.action_plan.map((i) =>
    i.id === itemId ? { ...i, state: resolved ? ("resolved" as const) : ("in_progress" as const), owner_marked_delivered: true } : i
  );
  updatePlanItems(plan.id, updatedItems);

  // Addendum A (Business Evaluation Lifecycle v1.0): an optional note/photo
  // the owner attaches to their own delivery record. This is NOT the
  // resolution mechanism — re-answering the underlying question above is —
  // it's just the founder's own memory of what they actually did.
  const note = formData.get("note");
  const photo = formData.get("photo");
  const noteText = note && String(note).trim() ? String(note).trim() : null;
  let photoDataUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const bytes = Buffer.from(await photo.arrayBuffer()).toString("base64");
    photoDataUrl = `data:${photo.type || "image/jpeg"};base64,${bytes}`;
  }
  if (noteText || photoDataUrl) {
    createDeliveryEvidence({ business_id: businessId, item_id: itemId, note: noteText, photo_data_url: photoDataUrl });
  }

  // The Action Plan Engine doc's "score reflects it immediately" promise —
  // recompute the real totals from the merged answers via the canonical
  // scoring engine (never a fabricated or estimated delta), and persist them
  // so the change is visible everywhere the assessment is read, not just here.
  const before = { health: scoreHealth(assessment.health_answers, assessment.stage).total, risk: scoreRisk(assessment.risk_answers).total };
  const afterHealth = scoreHealth(updatedHealth, assessment.stage);
  const afterRisk = scoreRisk(updatedRisk);
  const categorySaturation: Record<string, boolean> = {};
  for (const c of afterRisk.byCategory) categorySaturation[c.category] = c.saturated;

  updateAssessmentAnswers(assessment.id, {
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

  // Pass the real, computed delta through to the Plan page as a one-time
  // banner — never re-derived from guesswork there, just carried along.
  const params = new URLSearchParams({
    resolvedItem: itemId,
    itemState: resolved ? "resolved" : "in_progress",
    healthFrom: String(before.health),
    healthTo: String(afterHealth.total),
    riskFrom: String(before.risk),
    riskTo: String(afterRisk.total),
  });
  redirect(`/plan/${businessId}?${params.toString()}`);
}

// Profile > My business > Delete. There's no account system in v1 (Build
// Decisions Log — no accounts/auth yet), so "delete my account" maps onto
// deleting this business's own data; the confirmation is handled client-side
// before this ever submits (see DeleteBusinessButton).
export async function deleteBusinessAction(formData: FormData) {
  const businessId = String(formData.get("business_id"));
  deleteBusiness(businessId);
  redirect("/profile");
}

// Settings > Language picker. A plain cookie — no accounts to attach a
// per-user preference to yet (see deleteBusinessAction's note above).
const VALID_LANGUAGES: Language[] = ["en", "uz", "ru", "zh", "fr"];

// Onboarding (first launch) and its later edit from Profile. Name + country
// are required; photo is optional and arrives already downscaled to a small
// data: URL by the client (OnboardingForm) before this ever runs — the
// server just stores whatever it's given, it doesn't re-process images.
export async function saveProfileAction(formData: FormData) {
  const display_name = String(formData.get("display_name") || "").trim();
  const country = String(formData.get("country") || "");
  const photo_data_url = String(formData.get("photo_data_url") || "").trim() || null;

  if (!display_name) throw new Error("Name is required.");
  if (!COUNTRY_CODES.includes(country as (typeof COUNTRY_CODES)[number])) throw new Error("A valid country is required.");

  saveUserProfile({ display_name, country, photo_data_url });

  const returnTo = String(formData.get("return_to") || "/explore");
  redirect(returnTo);
}

export async function setLanguageAction(formData: FormData) {
  const lang = String(formData.get("language"));
  if (!VALID_LANGUAGES.includes(lang as Language)) throw new Error("Unsupported language.");
  const store = await cookies();
  store.set(LANGUAGE_COOKIE, lang, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  const returnTo = String(formData.get("return_to") || "/profile/settings");
  redirect(returnTo);
}
