// Intake & Stage Determination — ported from that doc's Part D pseudocode exactly.

import type { Intake, Stage, Level } from "./types";

export function deriveStage(customerPaymentStatus: Level): Stage {
  const revenue_status: Stage["revenue_status"] =
    customerPaymentStatus === "A" || customerPaymentStatus === "B" ? "PRE_REVENUE" : "REVENUE_GENERATING";
  const evidence_maturity: Stage["evidence_maturity"] =
    customerPaymentStatus === "A" || customerPaymentStatus === "B" || customerPaymentStatus === "C"
      ? "EMERGING"
      : "ESTABLISHED";
  const stage_label: Stage["stage_label"] = (
    {
      A: "PRE_REVENUE",
      B: "EARLY_STAGE",
      C: "EARLY_STAGE",
      D: "GROWTH_STAGE",
      E: "ESTABLISHED",
    } as const
  )[customerPaymentStatus];
  return { revenue_status, evidence_maturity, stage_label };
}

// INTAKE-06 checklist -> Risk block routing (Risk Exposure Methodology v1.3, Part D)
const UNPROVEN_MAP: Record<string, string> = {
  "CON-01": "paying_customers",
  "CON-02": "active_reach",
  "CON-03": "product_delivered",
  "CON-04": "paying_customers", // "a market not yet sold into" follows the same checklist item as CON-01
};
const PROSPECTIVE_MAP: Record<string, string> = {
  "PRD-R-01": "product_delivered",
  "DEP-03": "suppliers",
  "DEP-04": "premises",
  "DEP-02": "systems",
};

export function isUnproven(fieldId: string, currentlyInPlace: string[]): boolean {
  const item = UNPROVEN_MAP[fieldId];
  if (!item) return false;
  return !currentlyInPlace.includes(item);
}

export function isProspectiveA(fieldId: string, currentlyInPlace: string[]): boolean {
  const item = PROSPECTIVE_MAP[fieldId];
  if (!item) return false;
  return !currentlyInPlace.includes(item);
}

export interface ConsistencyFlag {
  check: number;
  message: string;
}

// Part D — consistency checks. Surfaced to the respondent for self-correction;
// never silently overridden, never routed to a human reviewer (no admin in v1).
export function consistencyChecks(intake: Intake): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];
  const cps = intake.customer_payment_status;

  if (cps === "A" && intake.currently_in_place.includes("paying_customers")) {
    flags.push({
      check: 1,
      message:
        "You indicated no customer has paid the business, but also that you currently have paying customers. Which is correct?",
    });
  }
  if ((cps === "A" || cps === "B") && intake.revenue_band !== "none" && intake.revenue_band !== "prefer_not_to_say") {
    flags.push({
      check: 2,
      message:
        "You indicated customers have not paid on an ongoing basis, but reported revenue for the last twelve months. Was that revenue from customers, or from another source such as grants or investment?",
    });
  }
  if ((cps === "D" || cps === "E") && (intake.time_in_operation === "<6mo" || intake.time_in_operation === "6-12mo")) {
    flags.push({
      check: 3,
      message:
        "You indicated customers have paid for more than a year, but the business has been operating for less than a year. Which is correct?",
    });
  }
  if ((cps === "C" || cps === "D" || cps === "E") && intake.customer_base_band === "none") {
    flags.push({
      check: 4,
      message: "You indicated ongoing customer payments, but no current customers. Has the business recently lost its customer base?",
    });
  }
  return flags;
}
