"use server";

// Server actions for the redesigned Entrepreneur Journey — Find & Develop
// (phase 1 of the v2.0 redesign). Kept separate from discover-actions.ts,
// which stays untouched (Discover itself is unchanged by the redesign).

import { redirect } from "next/navigation";
import {
  createProject,
  archiveProject,
  updateFindTask,
  addFindNote,
  writeBlueprint,
  proceedToDevelop,
  confirmReadyForTest,
  addDevelopTask,
  updateDevelopTaskStatus,
  deleteDevelopTask,
  setTestSetup,
  addTestEntry,
  addCustomerMilestoneEvent,
  returnProjectToFind,
  createExperimentForProject,
  completeExperiment,
  moveToRevenue,
  updateCycleFields,
  closeCycleAndOpenNext,
  addOperationsNote,
  upsertFounderDependence,
  markStableViewIntroShown,
  type FindTaskKey,
  type DevelopCategory,
  type TaskStatus,
  type TestQuestion,
  type CustomerMilestoneType,
  type WeakPoint,
  type EvidenceState,
  type RealityCheckDecision,
} from "@/lib/db";

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const source = String(formData.get("source") || "self") as "market_gap" | "self";
  const market_gap_sector_id = String(formData.get("market_gap_sector_id") || "") || null;
  const market_gap_text = String(formData.get("market_gap_text") || "").trim() || null;
  const self_description = String(formData.get("self_description") || "").trim() || null;

  if (source === "market_gap" && !market_gap_text) throw new Error("Pick a market gap to start from.");
  if (source === "self" && !self_description) throw new Error("Describe the problem you want to investigate.");

  const project = createProject({ source, market_gap_sector_id, market_gap_text, self_description });
  redirect(`/my-path/projects/${project.id}/find`);
}

export async function archiveProjectAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  archiveProject(id);
  redirect("/my-path");
}

export async function updateFindTaskAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const taskKey = String(formData.get("task_key") || "") as FindTaskKey;
  const status = String(formData.get("status") || "not_started") as TaskStatus;
  const summary = String(formData.get("summary") ?? "");
  updateFindTask(projectId, taskKey, { status, summary });
  redirect(`/my-path/projects/${projectId}/find`);
}

export async function addFindNoteAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const findTaskId = String(formData.get("find_task_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (body) addFindNote(findTaskId, body);
  redirect(`/my-path/projects/${projectId}/find`);
}

export async function writeBlueprintAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const get = (key: string) => String(formData.get(key) || "").trim();
  writeBlueprint(projectId, {
    name: get("name"),
    bp_problem: get("bp_problem"),
    bp_customer: get("bp_customer"),
    bp_offering: get("bp_offering"),
    bp_revenue_model: get("bp_revenue_model"),
    bp_pricing: get("bp_pricing"),
    bp_advantage: get("bp_advantage"),
    bp_location_scope: get("bp_location_scope"),
    bp_required_resources: get("bp_required_resources"),
    bp_launch_ready_condition: get("bp_launch_ready_condition"),
  });
  redirect(`/my-path/projects/${projectId}/blueprint`);
}

export async function proceedToDevelopAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  proceedToDevelop(projectId);
  redirect(`/my-path/projects/${projectId}/develop`);
}

export async function confirmReadyForTestAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  confirmReadyForTest(projectId);
  redirect(`/my-path/projects/${projectId}/test`);
}

export async function addDevelopTaskAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const category = String(formData.get("category") || "") as DevelopCategory;
  const label = String(formData.get("label") || "").trim();
  if (label) addDevelopTask(projectId, category, label);
  redirect(`/my-path/projects/${projectId}/develop`);
}

export async function updateDevelopTaskStatusAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "not_started") as TaskStatus;
  updateDevelopTaskStatus(id, status);
  redirect(`/my-path/projects/${projectId}/develop`);
}

export async function deleteDevelopTaskAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const id = String(formData.get("id") || "");
  deleteDevelopTask(id);
  redirect(`/my-path/projects/${projectId}/develop`);
}

export async function setTestSetupAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  setTestSetup(projectId, {
    test_offering: String(formData.get("test_offering") || "").trim(),
    test_customer: String(formData.get("test_customer") || "").trim(),
    test_price: String(formData.get("test_price") || "").trim(),
    test_channel: String(formData.get("test_channel") || "").trim(),
    business_model_type: String(formData.get("business_model_type") || "other"),
  });
  redirect(`/my-path/projects/${projectId}/test`);
}

export async function addTestEntryAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const question = String(formData.get("question") || "") as TestQuestion;
  const body = String(formData.get("body") || "").trim();
  const isPositive = formData.get("is_positive") === "on";
  if (body) addTestEntry(projectId, question, body, isPositive);
  redirect(`/my-path/projects/${projectId}/test`);
}

export async function addCustomerMilestoneAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const eventType = String(formData.get("event_type") || "") as CustomerMilestoneType;
  const note = String(formData.get("note") || "").trim() || null;
  addCustomerMilestoneEvent(projectId, eventType, note);
  redirect(`/my-path/projects/${projectId}/test`);
}

export async function returnToFindAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  returnProjectToFind(projectId);
  redirect(`/my-path/projects/${projectId}/find`);
}

export async function createExperimentAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const weak_point = (String(formData.get("weak_point") || "") || null) as WeakPoint | null;
  const suggestion_key = String(formData.get("suggestion_key") || "") || null;
  const hypothesis = String(formData.get("hypothesis") || "").trim();
  const intervention = String(formData.get("intervention") || "").trim();
  const decision_rule = String(formData.get("decision_rule") || "").trim();
  const decision_rule_reasoning = String(formData.get("decision_rule_reasoning") || "").trim();
  createExperimentForProject({ project_id: projectId, hypothesis, intervention, decision_rule, decision_rule_reasoning, weak_point, suggestion_key });
  redirect(`/my-path/projects/${projectId}/experiment`);
}

export async function completeExperimentAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const id = String(formData.get("id") || "");
  completeExperiment(id, {
    what_happened: String(formData.get("what_happened") || "").trim(),
    important_limitations: String(formData.get("important_limitations") || "").trim() || null,
    interpretation: String(formData.get("interpretation") || "").trim(),
    evidence_state: String(formData.get("evidence_state") || "unclear") as EvidenceState,
    decision: String(formData.get("decision") || "continue") as RealityCheckDecision,
    learning: String(formData.get("learning") || "").trim(),
  });
  redirect(`/my-path/projects/${projectId}/experiment`);
}

export async function moveToRevenueAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  moveToRevenue(projectId);
  redirect(`/my-path/projects/${projectId}/revenue`);
}

export async function updateCycleFieldsAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const cycleId = String(formData.get("cycle_id") || "");
  updateCycleFields(cycleId, {
    money_invested: numOrNull(formData.get("money_invested")),
    revenue: numOrNull(formData.get("revenue")),
    expenses: numOrNull(formData.get("expenses")),
    recurring_commitments: String(formData.get("recurring_commitments") || "").trim() || null,
    new_customers: numOrNull(formData.get("new_customers")),
    total_customers: numOrNull(formData.get("total_customers")),
    repeat_customers: numOrNull(formData.get("repeat_customers")),
    sales_count: numOrNull(formData.get("sales_count")),
    avg_sale_value: numOrNull(formData.get("avg_sale_value")),
    notes: String(formData.get("notes") || "").trim() || null,
  });
  redirect(`/my-path/projects/${projectId}/revenue`);
}

export async function closeCycleAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const cycleId = String(formData.get("cycle_id") || "");
  closeCycleAndOpenNext(cycleId, {
    review_what_happened: String(formData.get("review_what_happened") || "").trim(),
    review_what_changed: String(formData.get("review_what_changed") || "").trim(),
    review_needs_attention: String(formData.get("review_needs_attention") || "").trim(),
    review_next_step: String(formData.get("review_next_step") || "").trim(),
  });
  redirect(`/my-path/projects/${projectId}/revenue`);
}

export async function addOperationsNoteAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (body) addOperationsNote(projectId, body);
  redirect(`/my-path/projects/${projectId}/stable`);
}

export async function saveFounderDependenceAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  upsertFounderDependence(projectId, {
    only_i_sell: formData.get("only_i_sell") === "on",
    only_i_deliver: formData.get("only_i_deliver") === "on",
    only_i_know_process: formData.get("only_i_know_process") === "on",
    process_undocumented: formData.get("process_undocumented") === "on",
    no_backup: formData.get("no_backup") === "on",
  });
  redirect(`/my-path/projects/${projectId}/stable`);
}

export async function markStableViewIntroShownAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("project_id") || "");
  markStableViewIntroShown(projectId);
  redirect(`/my-path/projects/${projectId}/stable`);
}
