// Persistence layer — Node's built-in SQLite (`node:sqlite`, Node >= 22).
//
// Why not Prisma (the Build Plan's original recommendation): Prisma's CLI
// downloads a native query-engine binary from binaries.prisma.sh at
// `generate` time, which this build environment's network policy blocks
// outright (a sandbox-specific restriction, not a statement about Prisma
// itself) — and the Prisma CLI has also just gone through a jarring
// major-version pivot (7 -> 8 restructures the whole command surface around
// a new "Prisma Developer Platform" product), which is exactly the kind of
// churn risk the "cheap to maintain" constraint exists to avoid right now.
// `node:sqlite` ships inside Node itself: zero extra install, zero binary
// download, ever — for this app's shape (a handful of tables, no complex
// migrations) that's a better fit than it first sounds, not a downgrade.
// It's still flagged "experimental" by Node as of this build's Node version;
// revisit if that hasn't graduated by the time this ships. Swapping to
// Postgres for production later means replacing this one file — nothing
// upstream of it (the engine, the API routes) knows or cares how answers are
// stored.

import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import type { Assessment, Intake, Stage, Business, Plan, ActionItem, PriorityLevel, Level, OwnerExposureLevel } from "./types";

const DB_PATH = process.env.MARRAUP_DB_PATH ?? path.join(process.cwd(), "data", "marraup.db");

// Lazy singleton, opened on first actual query rather than at module-import
// time. Why: Next.js's production build ("Collect page data") spawns several
// worker processes that each import this module concurrently just to read
// exported types/functions — with an eager `new DatabaseSync(...)` at the
// top of the file, every worker opened (and tried to initialize schema on)
// the same file at once. On local disk that race was harmless; on a
// network/FUSE-mounted project folder it surfaced as `SQLITE_BUSY: database
// is locked` during the build, before any request ever touched the DB. A
// lazy getter means the connection only opens when a request actually needs
// it, at which point Next.js is serving one request per process/worker
// serially against this module's cache, not racing at import time.
//
// Also deliberately NOT using WAL mode here (dropped, previously set via
// `PRAGMA journal_mode = WAL`): WAL creates extra `-wal`/`-shm` sidecar files
// beside the main db file, which is another thing that doesn't play well
// with a synced/mounted directory. The default rollback journal is slower
// under heavy concurrent write load, but this app has no such load — a
// single local user via the dev server or an internal deployment — so it's
// the safer default here.
let _db: DatabaseSync | null = null;

// Adds a column to an already-existing table if it's missing — needed
// because `CREATE TABLE IF NOT EXISTS` does nothing for a table that
// already exists on disk from an earlier schema version. Safe to call on
// every startup: swallows the "duplicate column" error if it's already there.
function ensureColumn(db: DatabaseSync, table: string, column: string, ddlType: string): void {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlType};`);
  } catch {
    // Column already exists — nothing to do.
  }
}

function getDb(): DatabaseSync {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const instance = new DatabaseSync(DB_PATH);
  instance.exec("PRAGMA foreign_keys = ON;");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      sector TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL,
      draft_intake TEXT
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      intake TEXT NOT NULL,
      stage TEXT NOT NULL,
      health_answers TEXT NOT NULL,
      risk_answers TEXT NOT NULL,
      owner_exposure_level INTEGER NOT NULL,
      business_health_score REAL NOT NULL,
      risk_exposure_score REAL NOT NULL,
      critical_exposures TEXT NOT NULL,
      category_saturation TEXT NOT NULL,
      category_totals TEXT NOT NULL,
      undemonstrated_constructs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
      business_id TEXT NOT NULL,
      cycle_started_at TEXT NOT NULL,
      cycle_length_days INTEGER NOT NULL DEFAULT 120,
      action_items TEXT NOT NULL,
      other_actions_counts TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_business ON assessments(business_id);
    CREATE INDEX IF NOT EXISTS idx_plans_business ON plans(business_id);

    -- Single-row local identity, set once at onboarding. No accounts: this is
    -- just "who is using this device" so My Path and the app shell can greet
    -- the person by name and know which country's Market data applies to
    -- them by default. id is always the fixed string "local".
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      country TEXT NOT NULL,
      photo_data_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- My Path / Discover (Methodology v1.0, Stages 0-4). Single-row local
    -- profile again, mirroring user_profile — no accounts, one device. Raw
    -- answer tags + hard exclusions + user_preferences are stored as JSON
    -- so the ranking engine (src/lib/discover/engine.ts) is always re-run
    -- against them rather than caching a stale ranked result.
    CREATE TABLE IF NOT EXISTS discover_answers (
      id TEXT PRIMARY KEY,
      answers_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      hard_exclusions_json TEXT NOT NULL,
      preferences_json TEXT NOT NULL,
      completed_at TEXT,
      direction_explored_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Stage 2: Problems. Free text + the single closed 3-option discovery
    -- field (Part 9) — never scored, never a numeric maturity level.
    CREATE TABLE IF NOT EXISTS discover_problems (
      id TEXT PRIMARY KEY,
      sector_id TEXT NOT NULL,
      sub_sector TEXT,
      description TEXT NOT NULL,
      discovery_method TEXT NOT NULL, -- 'self_observed' | 'observed_others' | 'talked_to_someone'
      attachment_data_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Stage 3: Opportunities (methodology's renamed Stage 3; kept as
    -- OpportunityNote in code per Part 10). No score of any kind.
    CREATE TABLE IF NOT EXISTS discover_opportunities (
      id TEXT PRIMARY KEY,
      problem_id TEXT REFERENCES discover_problems(id) ON DELETE SET NULL,
      sector_id TEXT NOT NULL,
      sub_sector TEXT,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Stage 4: Idea Candidates. Max 3 ACTIVE at a time is enforced in
    -- application code (createIdeaCandidate), not a DB constraint, so
    -- archived candidates can exceed 3 total without conflict.
    CREATE TABLE IF NOT EXISTS discover_idea_candidates (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT REFERENCES discover_opportunities(id) ON DELETE SET NULL,
      sector_id TEXT NOT NULL,
      sub_sector TEXT,
      description TEXT NOT NULL,
      journey_name TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'archived'
      pushed_to_assessment_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Phase 6: Reality Check (Phase 6 Reality Check Methodology v1.0,
    -- FROZEN). One row per assumption a founder examines. History is never
    -- rewritten (Section 9): a revised assumption is a NEW row referencing
    -- the one it followed via previous_check_id, not an update to it.
    CREATE TABLE IF NOT EXISTS reality_checks (
      id TEXT PRIMARY KEY,
      idea_candidate_id TEXT NOT NULL REFERENCES discover_idea_candidates(id) ON DELETE CASCADE,
      previous_check_id TEXT REFERENCES reality_checks(id) ON DELETE SET NULL,
      assumption_category TEXT NOT NULL,
      assumption_text TEXT NOT NULL,
      expected_evidence TEXT NOT NULL,
      activity TEXT,
      observed_result TEXT,
      evidence_state TEXT,
      learning TEXT,
      changed TEXT,
      decision TEXT,
      destination TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reality_checks_idea ON reality_checks(idea_candidate_id);

    -- Phase 7: Experiment (Methodology v1.0, FROZEN). Structurally parallel
    -- to reality_checks. decision_rule + decision_rule_reasoning are locked
    -- at creation and never updated by completeExperiment.
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      idea_candidate_id TEXT NOT NULL REFERENCES discover_idea_candidates(id) ON DELETE CASCADE,
      previous_experiment_id TEXT REFERENCES experiments(id) ON DELETE SET NULL,
      hypothesis TEXT NOT NULL,
      intervention TEXT NOT NULL,
      decision_rule TEXT NOT NULL,
      decision_rule_reasoning TEXT NOT NULL,
      what_happened TEXT,
      important_limitations TEXT,
      interpretation TEXT,
      evidence_state TEXT,
      decision TEXT,
      learning TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_experiments_idea ON experiments(idea_candidate_id);

    -- Phase 8: First Customer (Methodology v1.0, accelerated freeze).
    -- Minimal, non-CRM event record — see Phases 8-11 doc.
    CREATE TABLE IF NOT EXISTS customer_events (
      id TEXT PRIMARY KEY,
      idea_candidate_id TEXT NOT NULL REFERENCES discover_idea_candidates(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      what_happened TEXT NOT NULL,
      what_purchased TEXT,
      event_date TEXT NOT NULL,
      payment_amount REAL,
      learning TEXT,
      evidence TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_customer_events_idea ON customer_events(idea_candidate_id);

    -- Phase 9: Revenue (Methodology v1.0, accelerated freeze). Factual
    -- event only — MarraUp records, never judges viability/profitability.
    CREATE TABLE IF NOT EXISTS revenue_events (
      id TEXT PRIMARY KEY,
      idea_candidate_id TEXT NOT NULL REFERENCES discover_idea_candidates(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      source TEXT NOT NULL,
      recurring INTEGER NOT NULL DEFAULT 0,
      event_date TEXT NOT NULL,
      founder_understanding TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revenue_events_idea ON revenue_events(idea_candidate_id);

    -- Phase 10: Repeatable (Methodology v1.0, accelerated freeze). Founder-
    -- initiated reflection only — never a MarraUp-generated verdict, never
    -- gated on a numeric customer/revenue count.
    CREATE TABLE IF NOT EXISTS repeatable_reflections (
      id TEXT PRIMARY KEY,
      idea_candidate_id TEXT NOT NULL REFERENCES discover_idea_candidates(id) ON DELETE CASCADE,
      reflection_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_repeatable_reflections_idea ON repeatable_reflections(idea_candidate_id);

    -- Business Evaluation Lifecycle v1.0, Addendum A: Delivery Evidence.
    -- Supplementary to a confirmation event, never the confirmation
    -- mechanism itself (see Addendum A's boundary note). Never rewritten.
    CREATE TABLE IF NOT EXISTS delivery_evidence (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL,
      note TEXT,
      photo_data_url TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_delivery_evidence_business ON delivery_evidence(business_id);

    -- Entrepreneur Journey Redesign v2.0, Find & Develop (phase 1). A
    -- Project merges the old Problem/Opportunity/IdeaCandidate chain into
    -- one object, carrying a Find task list, then a Blueprint, then a
    -- Develop task list. Max 3 ACTIVE at a time is enforced in application
    -- code (createProject), same pattern as the old idea-candidate cap.
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL, -- 'market_gap' | 'self'
      market_gap_sector_id TEXT,
      market_gap_text TEXT,
      name TEXT,
      business_model_type TEXT,
      stage TEXT NOT NULL DEFAULT 'finding', -- 'finding' | 'blueprint' | 'developing' | 'testing'
      return_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'archived'
      archived_at TEXT,
      bp_problem TEXT,
      bp_customer TEXT,
      bp_offering TEXT,
      bp_revenue_model TEXT,
      bp_pricing TEXT,
      bp_advantage TEXT,
      bp_location_scope TEXT,
      bp_required_resources TEXT,
      bp_launch_ready_condition TEXT,
      blueprint_completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

    -- Find's 7 fixed tasks (Customer Discovery — Steve Blank / "The Mom
    -- Test"), one row per project per task_key, seeded at project creation.
    CREATE TABLE IF NOT EXISTS project_find_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      task_key TEXT NOT NULL, -- 'define' | 'talk' | 'alternatives' | 'worth_solving' | 'sketch' | 'signal' | 'decide'
      status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'done'
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, task_key)
    );
    CREATE INDEX IF NOT EXISTS idx_find_tasks_project ON project_find_tasks(project_id);

    -- Repeatable dated log entries under Find tasks 'talk' (conversations)
    -- and 'signal' (commitment signals).
    CREATE TABLE IF NOT EXISTS project_find_notes (
      id TEXT PRIMARY KEY,
      find_task_id TEXT NOT NULL REFERENCES project_find_tasks(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_find_notes_task ON project_find_notes(find_task_id);

    -- Develop's 7 categories (MVP build) — user-authored tasks, freeform,
    -- not seeded. updated_at (MAX across a project's rows) drives the
    -- stalled-project detection in journey/stalled.ts.
    CREATE TABLE IF NOT EXISTS project_develop_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      category TEXT NOT NULL, -- 'acquire_setup' | 'build' | 'arrange' | 'hire' | 'register_approve' | 'customer_ready' | 'sell_market'
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_develop_tasks_project ON project_develop_tasks(project_id);

    -- Redesign spec §4 — Test. Deliberately NOT a repoint of the old
    -- assumption-shaped reality_checks table (Phase 6 methodology's shape
    -- doesn't fit "dated freeform entry against 1 of 5 fixed questions");
    -- see the Test implementation plan doc for why this got its own table.
    CREATE TABLE IF NOT EXISTS project_test_entries (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      question TEXT NOT NULL, -- 'reach' | 'interest' | 'usage' | 'response' | 'economics'
      body TEXT NOT NULL,
      is_positive INTEGER NOT NULL DEFAULT 0, -- the "Yes" signal §4.4/§5.1's evidence gate checks for
      logged_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_test_entries_project ON project_test_entries(project_id);

    -- §4.3 — first customer / first payment / first repeat as milestones,
    -- not phases. A pure existence check per event_type, same pattern as
    -- the old hasCustomerEvent / anyCustomerEventExists.
    CREATE TABLE IF NOT EXISTS project_customer_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL, -- 'customer' | 'payment' | 'repeat'
      note TEXT,
      event_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_customer_events_project ON project_customer_events(project_id);

    -- Redesign spec §6 — Revenue's repeating 30-day cycles. Cycle-level
    -- storage only for this phase (open question 3 in the spec doc,
    -- resolved: a finer-grained line-item log is a deferred fast-follow).
    CREATE TABLE IF NOT EXISTS revenue_cycles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      cycle_number INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      closed_at TEXT,
      money_invested REAL,
      revenue REAL,
      expenses REAL,
      net_cash REAL,
      recurring_commitments TEXT,
      new_customers INTEGER,
      total_customers INTEGER,
      repeat_customers INTEGER,
      sales_count INTEGER,
      avg_sale_value REAL,
      notes TEXT,
      review_what_happened TEXT,
      review_what_changed TEXT,
      review_needs_attention TEXT,
      review_next_step TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revenue_cycles_project ON revenue_cycles(project_id);

    -- §7.1 — the two inputs unique to the Stable Business view; the other
    -- five panels are computed on read from revenue_cycles.
    CREATE TABLE IF NOT EXISTS project_operations_notes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ops_notes_project ON project_operations_notes(project_id);

    CREATE TABLE IF NOT EXISTS project_founder_dependence (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      only_i_sell INTEGER NOT NULL DEFAULT 0,
      only_i_deliver INTEGER NOT NULL DEFAULT 0,
      only_i_know_process INTEGER NOT NULL DEFAULT 0,
      process_undocumented INTEGER NOT NULL DEFAULT 0,
      no_backup INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);
  ensureColumn(instance, "discover_idea_candidates", "journey_name", "TEXT");
  ensureColumn(instance, "projects", "test_offering", "TEXT");
  ensureColumn(instance, "projects", "test_customer", "TEXT");
  ensureColumn(instance, "projects", "test_price", "TEXT");
  ensureColumn(instance, "projects", "test_channel", "TEXT");
  // Experiment (§5) — additive columns onto the existing frozen Phase 7
  // table rather than repointing its idea_candidate_id foreign key (SQLite
  // can't alter a FK in place). Old idea_candidate-based rows/functions are
  // untouched; new code filters/inserts on project_id instead.
  ensureColumn(instance, "experiments", "project_id", "TEXT REFERENCES projects(id) ON DELETE CASCADE");
  ensureColumn(instance, "experiments", "weak_point", "TEXT");
  ensureColumn(instance, "experiments", "suggestion_key", "TEXT");
  ensureColumn(instance, "projects", "stable_view_intro_shown_at", "TEXT");
  // experiments.idea_candidate_id is NOT NULL + a foreign key into
  // discover_idea_candidates (old frozen schema, pre-dating Projects).
  // SQLite can't relax a NOT NULL/FK constraint on an existing column
  // in place, so project-scoped Experiments (which have no idea candidate)
  // point at this one inert sentinel row instead of leaving the column
  // null or dangling — cheaper and safer than rebuilding the table.
  instance
    .prepare(
      `INSERT OR IGNORE INTO discover_idea_candidates (id, opportunity_id, sector_id, sub_sector, description, status, created_at, updated_at)
       VALUES ('sentinel_project_experiments', NULL, 'other', NULL, 'Sentinel row for project-scoped Experiments (Journey Redesign v2.0) — not a real idea candidate.', 'archived', '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z')`
    )
    .run();
  _db = instance;
  return _db;
}

export const SENTINEL_IDEA_CANDIDATE_ID = "sentinel_project_experiments";

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- User profile (local identity, set at onboarding) ----------

const PROFILE_ID = "local";

export interface UserProfile {
  display_name: string;
  country: string; // CountryCode from market-copy.ts
  photo_data_url: string | null;
  created_at: string;
  updated_at: string;
}

export function getUserProfile(): UserProfile | null {
  const row = getDb().prepare(`SELECT * FROM user_profile WHERE id = ?`).get(PROFILE_ID) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    display_name: row.display_name as string,
    country: row.country as string,
    photo_data_url: (row.photo_data_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// Onboarding (first save) and later edits both go through this single
// upsert — there is only ever one local profile row.
export function saveUserProfile(input: { display_name: string; country: string; photo_data_url: string | null }): void {
  const now = new Date().toISOString();
  const existing = getDb().prepare(`SELECT id FROM user_profile WHERE id = ?`).get(PROFILE_ID);
  if (existing) {
    getDb()
      .prepare(`UPDATE user_profile SET display_name = ?, country = ?, photo_data_url = ?, updated_at = ? WHERE id = ?`)
      .run(input.display_name, input.country, input.photo_data_url, now, PROFILE_ID);
  } else {
    getDb()
      .prepare(
        `INSERT INTO user_profile (id, display_name, country, photo_data_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(PROFILE_ID, input.display_name, input.country, input.photo_data_url, now, now);
  }
}

// ---------- Business ----------

export function createBusiness(input: { name: string; owner_name: string; sector: string; language?: string }): Business & { id: string } {
  const id = genId("biz");
  getDb().prepare(
    `INSERT INTO businesses (id, name, owner_name, sector, language, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.owner_name, input.sector, input.language ?? "en", new Date().toISOString());
  return { id, name: input.name, owner_name: input.owner_name, sector: input.sector };
}

export function getBusiness(id: string): (Business & { language: string; created_at: string }) | null {
  const row = getDb().prepare(`SELECT * FROM businesses WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    name: row.name as string,
    owner_name: row.owner_name as string,
    sector: row.sector as string,
    language: row.language as string,
    created_at: row.created_at as string,
  };
}

// Intake is collected before the business's first Assessment exists (it has
// to be, since it selects which question variants render) — stored as a
// draft on the business record until the assessment is actually submitted,
// then cleared. Not itself part of any Assessment row (Intake is never
// scored, and is re-collected fresh on every reassessment — Intake & Stage
// Determination, "Re-assessment").
export function saveDraftIntake(businessId: string, intake: Intake): void {
  getDb().prepare(`UPDATE businesses SET draft_intake = ? WHERE id = ?`).run(JSON.stringify(intake), businessId);
}

export function getDraftIntake(businessId: string): Intake | null {
  const row = getDb().prepare(`SELECT draft_intake FROM businesses WHERE id = ?`).get(businessId) as
    | { draft_intake: string | null }
    | undefined;
  if (!row?.draft_intake) return null;
  return JSON.parse(row.draft_intake) as Intake;
}

// Cascades to assessments and plans via the ON DELETE CASCADE foreign keys
// declared on those tables above (foreign_keys is ON for this connection).
export function deleteBusiness(id: string): void {
  getDb().prepare(`DELETE FROM businesses WHERE id = ?`).run(id);
}

export function listBusinesses(): (Business & { created_at: string })[] {
  const rows = getDb().prepare(`SELECT * FROM businesses ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    owner_name: row.owner_name as string,
    sector: row.sector as string,
    created_at: row.created_at as string,
  }));
}

// ---------- Assessment ----------

export function saveAssessment(a: Assessment): void {
  getDb().prepare(
    `INSERT INTO assessments (
      id, business_id, created_at, intake, stage, health_answers, risk_answers,
      owner_exposure_level, business_health_score, risk_exposure_score,
      critical_exposures, category_saturation, category_totals, undemonstrated_constructs
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    a.id,
    a.business_id,
    a.created_at,
    JSON.stringify(a.intake),
    JSON.stringify(a.stage),
    JSON.stringify(a.health_answers),
    JSON.stringify(a.risk_answers),
    a.owner_exposure_level,
    a.business_health_score,
    a.risk_exposure_score,
    JSON.stringify(a.critical_exposures),
    JSON.stringify(a.category_saturation),
    JSON.stringify(a.category_totals),
    JSON.stringify(a.undemonstrated_constructs)
  );
}

function rowToAssessment(row: Record<string, unknown>): Assessment {
  return {
    id: row.id as string,
    business_id: row.business_id as string,
    created_at: row.created_at as string,
    intake: JSON.parse(row.intake as string) as Intake,
    stage: JSON.parse(row.stage as string) as Stage,
    health_answers: JSON.parse(row.health_answers as string) as Record<string, Level>,
    risk_answers: JSON.parse(row.risk_answers as string) as Record<string, Level | "UNPROVEN">,
    owner_exposure_level: row.owner_exposure_level as OwnerExposureLevel,
    business_health_score: row.business_health_score as number,
    risk_exposure_score: row.risk_exposure_score as number,
    critical_exposures: JSON.parse(row.critical_exposures as string) as string[],
    category_saturation: JSON.parse(row.category_saturation as string) as Record<string, boolean>,
    category_totals: JSON.parse(row.category_totals as string) as Record<string, number>,
    undemonstrated_constructs: JSON.parse(row.undemonstrated_constructs as string) as string[],
  };
}

// Used by confirm_item() to persist a re-answered field back onto the
// existing assessment row immediately (Section 4) — this is an update to the
// same assessment, not a new one; a real reassessment creates a new row via
// saveAssessment instead.
//
// Also persists the recomputed derived fields (scores, critical exposures,
// saturation) so a confirmed item's effect is visible everywhere that reads
// the assessment, not just in the health/risk answer maps — the Action Plan
// Engine doc's "score reflects it immediately" promise, made real.
export function updateAssessmentAnswers(
  id: string,
  fields: {
    health_answers: Record<string, Level>;
    risk_answers: Record<string, Level | "UNPROVEN">;
    owner_exposure_level: OwnerExposureLevel;
    business_health_score: number;
    risk_exposure_score: number;
    critical_exposures: string[];
    category_saturation: Record<string, boolean>;
    category_totals: Record<string, number>;
    undemonstrated_constructs: string[];
  }
): void {
  getDb()
    .prepare(
      `UPDATE assessments SET health_answers = ?, risk_answers = ?, owner_exposure_level = ?,
       business_health_score = ?, risk_exposure_score = ?, critical_exposures = ?,
       category_saturation = ?, category_totals = ?, undemonstrated_constructs = ? WHERE id = ?`
    )
    .run(
      JSON.stringify(fields.health_answers),
      JSON.stringify(fields.risk_answers),
      fields.owner_exposure_level,
      fields.business_health_score,
      fields.risk_exposure_score,
      JSON.stringify(fields.critical_exposures),
      JSON.stringify(fields.category_saturation),
      JSON.stringify(fields.category_totals),
      JSON.stringify(fields.undemonstrated_constructs),
      id
    );
}

export function getAssessment(id: string): Assessment | null {
  const row = getDb().prepare(`SELECT * FROM assessments WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToAssessment(row) : null;
}

export function getLatestAssessment(businessId: string): Assessment | null {
  const row = getDb()
    .prepare(`SELECT * FROM assessments WHERE business_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(businessId) as Record<string, unknown> | undefined;
  return row ? rowToAssessment(row) : null;
}

export function listAssessments(businessId: string): Assessment[] {
  const rows = getDb()
    .prepare(`SELECT * FROM assessments WHERE business_id = ? ORDER BY created_at ASC`)
    .all(businessId) as Record<string, unknown>[];
  return rows.map(rowToAssessment);
}

// ---------- Plan ----------

export function savePlan(businessId: string, assessmentId: string, plan: Pick<Plan, "action_plan" | "other_actions_counts">): string {
  const id = genId("plan");
  getDb().prepare(
    `INSERT INTO plans (id, assessment_id, business_id, cycle_started_at, cycle_length_days, action_items, other_actions_counts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, assessmentId, businessId, new Date().toISOString(), 120, JSON.stringify(plan.action_plan), JSON.stringify(plan.other_actions_counts));
  return id;
}

function rowToPlan(row: Record<string, unknown>): Plan {
  return {
    id: row.id as string,
    business_id: row.business_id as string,
    assessment_id: row.assessment_id as string,
    cycle_started_at: row.cycle_started_at as string,
    cycle_length_days: 120,
    action_plan: JSON.parse(row.action_items as string) as ActionItem[],
    other_actions_counts: JSON.parse(row.other_actions_counts as string) as Record<PriorityLevel, number>,
    full_order: [], // never persisted — internal only (Section 7 UI contract)
  };
}

export function getPlanByAssessment(assessmentId: string): Plan | null {
  const row = getDb().prepare(`SELECT * FROM plans WHERE assessment_id = ?`).get(assessmentId) as Record<string, unknown> | undefined;
  return row ? rowToPlan(row) : null;
}

export function getLatestPlan(businessId: string): Plan | null {
  const row = getDb()
    .prepare(`SELECT * FROM plans WHERE business_id = ? ORDER BY cycle_started_at DESC LIMIT 1`)
    .get(businessId) as Record<string, unknown> | undefined;
  return row ? rowToPlan(row) : null;
}

export function updatePlanItems(planId: string, items: ActionItem[]): void {
  getDb().prepare(`UPDATE plans SET action_items = ? WHERE id = ?`).run(JSON.stringify(items), planId);
}

export function getPlanById(planId: string): Plan | null {
  const row = getDb().prepare(`SELECT * FROM plans WHERE id = ?`).get(planId) as Record<string, unknown> | undefined;
  return row ? rowToPlan(row) : null;
}

// ---------- My Path / Discover (Stages 0-4) ----------

const DISCOVER_ID = "local";

export interface DiscoverAnswersRecord {
  answers: Record<string, string[]>; // questionId -> selected option ids (incl. follow-up/Q8B ids)
  tags: string[]; // flattened scored tags derived from `answers`
  hardExclusions: string[]; // Q27 sector ids
  preferences: string[]; // Q26 tags — stored, never used in ranking
  completed_at: string | null;
  direction_explored_at: string | null;
}

export function getDiscoverAnswers(): DiscoverAnswersRecord | null {
  const row = getDb().prepare(`SELECT * FROM discover_answers WHERE id = ?`).get(DISCOVER_ID) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    answers: JSON.parse(row.answers_json as string),
    tags: JSON.parse(row.tags_json as string),
    hardExclusions: JSON.parse(row.hard_exclusions_json as string),
    preferences: JSON.parse(row.preferences_json as string),
    completed_at: (row.completed_at as string | null) ?? null,
    direction_explored_at: (row.direction_explored_at as string | null) ?? null,
  };
}

// Milestone: "first direction explored" (Part 13) — recorded the first time
// the user actually opens a shown direction's detail (not merely when
// directions are computed/shown), via the /my-path/explore redirect action.
export function markDirectionExplored(): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE discover_answers SET direction_explored_at = COALESCE(direction_explored_at, ?), updated_at = ? WHERE id = ?`)
    .run(now, now, DISCOVER_ID);
}

export function saveDiscoverAnswers(input: {
  answers: Record<string, string[]>;
  tags: string[];
  hardExclusions: string[];
  preferences: string[];
  completed: boolean;
}): void {
  const now = new Date().toISOString();
  const existing = getDb().prepare(`SELECT id FROM discover_answers WHERE id = ?`).get(DISCOVER_ID);
  const payload = [
    JSON.stringify(input.answers),
    JSON.stringify(input.tags),
    JSON.stringify(input.hardExclusions),
    JSON.stringify(input.preferences),
    input.completed ? now : null,
  ];
  if (existing) {
    getDb()
      .prepare(
        `UPDATE discover_answers SET answers_json = ?, tags_json = ?, hard_exclusions_json = ?, preferences_json = ?, completed_at = COALESCE(?, completed_at), updated_at = ? WHERE id = ?`
      )
      .run(...payload, now, DISCOVER_ID);
  } else {
    getDb()
      .prepare(
        `INSERT INTO discover_answers (id, answers_json, tags_json, hard_exclusions_json, preferences_json, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(DISCOVER_ID, ...payload, now, now);
  }
}

export function clearDiscoverAnswers(): void {
  getDb().prepare(`DELETE FROM discover_answers WHERE id = ?`).run(DISCOVER_ID);
}

// ---------- Problems (Stage 2) ----------

export type DiscoveryMethod = "self_observed" | "observed_others" | "talked_to_someone";

export interface Problem {
  id: string;
  sector_id: string;
  sub_sector: string | null;
  description: string;
  discovery_method: DiscoveryMethod;
  attachment_data_url: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProblem(row: Record<string, unknown>): Problem {
  return {
    id: row.id as string,
    sector_id: row.sector_id as string,
    sub_sector: (row.sub_sector as string | null) ?? null,
    description: row.description as string,
    discovery_method: row.discovery_method as DiscoveryMethod,
    attachment_data_url: (row.attachment_data_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function listProblems(): Problem[] {
  const rows = getDb().prepare(`SELECT * FROM discover_problems ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map(rowToProblem);
}

export function createProblem(input: {
  sector_id: string;
  sub_sector: string | null;
  description: string;
  discovery_method: DiscoveryMethod;
  attachment_data_url: string | null;
}): Problem {
  const id = genId("problem");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO discover_problems (id, sector_id, sub_sector, description, discovery_method, attachment_data_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.sector_id, input.sub_sector, input.description, input.discovery_method, input.attachment_data_url, now, now);
  return { id, created_at: now, updated_at: now, ...input };
}

export function getProblem(id: string): Problem | null {
  const row = getDb().prepare(`SELECT * FROM discover_problems WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToProblem(row) : null;
}

export function updateProblem(
  id: string,
  input: { sector_id: string; sub_sector: string | null; description: string; discovery_method: DiscoveryMethod }
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE discover_problems SET sector_id = ?, sub_sector = ?, description = ?, discovery_method = ?, updated_at = ? WHERE id = ?`)
    .run(input.sector_id, input.sub_sector, input.description, input.discovery_method, now, id);
}

export function deleteProblem(id: string): void {
  // Unlinks (does not delete) derived Opportunities/Idea Candidates — Part 9.
  getDb().prepare(`UPDATE discover_opportunities SET problem_id = NULL WHERE problem_id = ?`).run(id);
  getDb().prepare(`DELETE FROM discover_problems WHERE id = ?`).run(id);
}

// ---------- Opportunities (Stage 3) ----------

export interface OpportunityNote {
  id: string;
  problem_id: string | null;
  sector_id: string;
  sub_sector: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

function rowToOpportunity(row: Record<string, unknown>): OpportunityNote {
  return {
    id: row.id as string,
    problem_id: (row.problem_id as string | null) ?? null,
    sector_id: row.sector_id as string,
    sub_sector: (row.sub_sector as string | null) ?? null,
    description: row.description as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function listOpportunities(): OpportunityNote[] {
  const rows = getDb().prepare(`SELECT * FROM discover_opportunities ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map(rowToOpportunity);
}

export function createOpportunity(input: {
  problem_id: string | null;
  sector_id: string;
  sub_sector: string | null;
  description: string;
}): OpportunityNote {
  const id = genId("opportunity");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO discover_opportunities (id, problem_id, sector_id, sub_sector, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.problem_id, input.sector_id, input.sub_sector, input.description, now, now);
  return { id, created_at: now, updated_at: now, ...input };
}

export function getOpportunity(id: string): OpportunityNote | null {
  const row = getDb().prepare(`SELECT * FROM discover_opportunities WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToOpportunity(row) : null;
}

export function updateOpportunity(id: string, input: { sector_id: string; sub_sector: string | null; description: string }): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE discover_opportunities SET sector_id = ?, sub_sector = ?, description = ?, updated_at = ? WHERE id = ?`)
    .run(input.sector_id, input.sub_sector, input.description, now, id);
}

export function deleteOpportunity(id: string): void {
  getDb().prepare(`UPDATE discover_idea_candidates SET opportunity_id = NULL WHERE opportunity_id = ?`).run(id);
  getDb().prepare(`DELETE FROM discover_opportunities WHERE id = ?`).run(id);
}

// ---------- Idea Candidates (Stage 4) ----------

export type IdeaCandidateStatus = "active" | "archived";

export interface IdeaCandidate {
  id: string;
  opportunity_id: string | null;
  sector_id: string;
  sub_sector: string | null;
  description: string;
  /** The name the founder gave this entrepreneur journey at its "Begin this journey" moment — the naming beat, not a system-generated label. Falls back to a slice of the description when absent (older records, or a skipped name). */
  journey_name: string | null;
  status: IdeaCandidateStatus;
  pushed_to_assessment_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToIdeaCandidate(row: Record<string, unknown>): IdeaCandidate {
  return {
    id: row.id as string,
    opportunity_id: (row.opportunity_id as string | null) ?? null,
    sector_id: row.sector_id as string,
    sub_sector: (row.sub_sector as string | null) ?? null,
    description: row.description as string,
    journey_name: (row.journey_name as string | null) ?? null,
    status: row.status as IdeaCandidateStatus,
    pushed_to_assessment_at: (row.pushed_to_assessment_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/** journey_name if the founder set one, else an honest fallback derived from the idea description. Never fabricated content — just a shorter view of what they already wrote. */
export function journeyDisplayName(idea: Pick<IdeaCandidate, "journey_name" | "description">): string {
  if (idea.journey_name && idea.journey_name.trim()) return idea.journey_name.trim();
  const text = idea.description.trim();
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

/** Product Architecture v1.0 Part 6 — lets "next best action" know the user has already handed an idea to Business Assessment, so it stops offering Discover-side next steps. */
export function markIdeaPushedToAssessment(id: string): void {
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE discover_idea_candidates SET pushed_to_assessment_at = ?, updated_at = ? WHERE id = ?`).run(now, now, id);
}

export function anyIdeaPushedToAssessment(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM discover_idea_candidates WHERE pushed_to_assessment_at IS NOT NULL`).get() as { n: number };
  return row.n > 0;
}

// App-wide existence checks for the journey tracker (Product Architecture
// v1.0 Parts 5-6) — same aggregation level as anyIdeaPushedToAssessment:
// any idea, any row, "reached" not "completed". The tracker on /my-path is
// a single global tracker, not scoped to one idea candidate.
export function anyRealityCheckExists(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM reality_checks`).get() as { n: number };
  return row.n > 0;
}

export function anyExperimentExists(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM experiments`).get() as { n: number };
  return row.n > 0;
}

export function anyCustomerEventExists(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM customer_events`).get() as { n: number };
  return row.n > 0;
}

export function anyRevenueEventExists(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM revenue_events`).get() as { n: number };
  return row.n > 0;
}

export function anyRepeatableReflectionExists(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM repeatable_reflections`).get() as { n: number };
  return row.n > 0;
}

export function listIdeaCandidates(): IdeaCandidate[] {
  const rows = getDb().prepare(`SELECT * FROM discover_idea_candidates ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map(rowToIdeaCandidate);
}

export const MAX_ACTIVE_IDEA_CANDIDATES = 3; // Part 10 — a deliberate v1 focus constraint.

export function countActiveIdeaCandidates(): number {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM discover_idea_candidates WHERE status = 'active'`).get() as { n: number };
  return row.n;
}

export function createIdeaCandidate(input: {
  opportunity_id: string | null;
  sector_id: string;
  sub_sector: string | null;
  description: string;
  journey_name?: string | null;
}): IdeaCandidate {
  if (countActiveIdeaCandidates() >= MAX_ACTIVE_IDEA_CANDIDATES) {
    throw new Error("You already have 3 active idea candidates. Archive one to add another.");
  }
  const id = genId("idea");
  const now = new Date().toISOString();
  const journey_name = input.journey_name?.trim() || null;
  getDb()
    .prepare(
      `INSERT INTO discover_idea_candidates (id, opportunity_id, sector_id, sub_sector, description, journey_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
    .run(id, input.opportunity_id, input.sector_id, input.sub_sector, input.description, journey_name, now, now);
  return {
    id,
    opportunity_id: input.opportunity_id,
    sector_id: input.sector_id,
    sub_sector: input.sub_sector,
    description: input.description,
    journey_name,
    status: "active",
    pushed_to_assessment_at: null,
    created_at: now,
    updated_at: now,
  };
}

export function getIdeaCandidate(id: string): IdeaCandidate | null {
  const row = getDb().prepare(`SELECT * FROM discover_idea_candidates WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToIdeaCandidate(row) : null;
}

export function updateIdeaCandidate(
  id: string,
  input: { sector_id: string; sub_sector: string | null; description: string; journey_name?: string | null }
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE discover_idea_candidates SET sector_id = ?, sub_sector = ?, description = ?, journey_name = ?, updated_at = ? WHERE id = ?`)
    .run(input.sector_id, input.sub_sector, input.description, input.journey_name?.trim() || null, now, id);
}

export function unarchiveIdeaCandidate(id: string): void {
  // Re-activating still respects the 3-active cap — enforced here, not just on create.
  if (countActiveIdeaCandidates() >= MAX_ACTIVE_IDEA_CANDIDATES) {
    throw new Error("You already have 3 active idea candidates. Archive one first.");
  }
  getDb().prepare(`UPDATE discover_idea_candidates SET status = 'active', updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
}

export function archiveIdeaCandidate(id: string): void {
  getDb().prepare(`UPDATE discover_idea_candidates SET status = 'archived', updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
}

export function deleteIdeaCandidate(id: string): void {
  getDb().prepare(`DELETE FROM discover_idea_candidates WHERE id = ?`).run(id);
}

// ---------- Reality Check (Phase 6, Methodology v1.0 FROZEN) ----------

export type AssumptionCategory =
  | "demand"
  | "customer_access"
  | "solution_fit"
  | "willingness_to_pay"
  | "price"
  | "capability_delivery"
  | "something_else";

export type EvidenceState = "supported" | "challenged" | "unclear";
export type RealityCheckDecision = "continue" | "change" | "stop";
export type RealityCheckDestination = "idea" | "opportunity" | "problem";

export interface RealityCheck {
  id: string;
  idea_candidate_id: string;
  previous_check_id: string | null;
  assumption_category: AssumptionCategory;
  assumption_text: string;
  expected_evidence: string;
  activity: string | null;
  observed_result: string | null;
  evidence_state: EvidenceState | null;
  learning: string | null;
  changed: string | null;
  decision: RealityCheckDecision | null;
  destination: RealityCheckDestination | null;
  created_at: string;
  updated_at: string;
}

function rowToRealityCheck(row: Record<string, unknown>): RealityCheck {
  return {
    id: row.id as string,
    idea_candidate_id: row.idea_candidate_id as string,
    previous_check_id: (row.previous_check_id as string | null) ?? null,
    assumption_category: row.assumption_category as AssumptionCategory,
    assumption_text: row.assumption_text as string,
    expected_evidence: row.expected_evidence as string,
    activity: (row.activity as string | null) ?? null,
    observed_result: (row.observed_result as string | null) ?? null,
    evidence_state: (row.evidence_state as EvidenceState | null) ?? null,
    learning: (row.learning as string | null) ?? null,
    changed: (row.changed as string | null) ?? null,
    decision: (row.decision as RealityCheckDecision | null) ?? null,
    destination: (row.destination as RealityCheckDestination | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/** Step 1 of the loop (Sections 4-5): the assumption + what would count as
 * evidence, recorded BEFORE the founder goes and checks reality. Creating
 * this row is what "starting" a Reality Check means — it can be left
 * incomplete indefinitely (Section 10, recommended not gated). */
export function createRealityCheck(input: {
  idea_candidate_id: string;
  previous_check_id?: string | null;
  assumption_category: AssumptionCategory;
  assumption_text: string;
  expected_evidence: string;
}): RealityCheck {
  const id = genId("rc");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO reality_checks (id, idea_candidate_id, previous_check_id, assumption_category, assumption_text, expected_evidence, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.idea_candidate_id, input.previous_check_id ?? null, input.assumption_category, input.assumption_text, input.expected_evidence, now, now);
  return {
    id,
    idea_candidate_id: input.idea_candidate_id,
    previous_check_id: input.previous_check_id ?? null,
    assumption_category: input.assumption_category,
    assumption_text: input.assumption_text,
    expected_evidence: input.expected_evidence,
    activity: null,
    observed_result: null,
    evidence_state: null,
    learning: null,
    changed: null,
    decision: null,
    destination: null,
    created_at: now,
    updated_at: now,
  };
}

/** Steps 2-4 of the loop (Sections 6-7): recording what happened, once the
 * founder has actually gone and checked reality. Destination is only ever
 * set when decision is "change" or "stop" (Section 7) — never on "continue". */
export function completeRealityCheck(
  id: string,
  input: {
    activity: string;
    observed_result: string;
    evidence_state: EvidenceState;
    learning: string;
    changed: string | null;
    decision: RealityCheckDecision;
    destination: RealityCheckDestination | null;
  }
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE reality_checks SET activity = ?, observed_result = ?, evidence_state = ?, learning = ?, changed = ?, decision = ?, destination = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.activity,
      input.observed_result,
      input.evidence_state,
      input.learning,
      input.changed,
      input.decision,
      input.decision === "continue" ? null : input.destination,
      now,
      id
    );
}

export function getRealityCheck(id: string): RealityCheck | null {
  const row = getDb().prepare(`SELECT * FROM reality_checks WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToRealityCheck(row) : null;
}

/** Full history for one idea, oldest first — never overwritten (Section 9),
 * so this is a genuine timeline of how the founder's thinking evolved. */
export function listRealityChecksForIdea(idea_candidate_id: string): RealityCheck[] {
  const rows = getDb()
    .prepare(`SELECT * FROM reality_checks WHERE idea_candidate_id = ? ORDER BY created_at ASC`)
    .all(idea_candidate_id) as Record<string, unknown>[];
  return rows.map(rowToRealityCheck);
}

export function deleteRealityCheck(id: string): void {
  getDb().prepare(`DELETE FROM reality_checks WHERE id = ?`).run(id);
}

// ---------- Experiment (Phase 7, Methodology v1.0 FROZEN) ----------

export interface Experiment {
  id: string;
  idea_candidate_id: string;
  previous_experiment_id: string | null;
  hypothesis: string;
  intervention: string;
  decision_rule: string;
  decision_rule_reasoning: string;
  what_happened: string | null;
  important_limitations: string | null;
  interpretation: string | null;
  evidence_state: EvidenceState | null;
  decision: RealityCheckDecision | null;
  learning: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExperiment(row: Record<string, unknown>): Experiment {
  return {
    id: row.id as string,
    idea_candidate_id: row.idea_candidate_id as string,
    previous_experiment_id: (row.previous_experiment_id as string | null) ?? null,
    hypothesis: row.hypothesis as string,
    intervention: row.intervention as string,
    decision_rule: row.decision_rule as string,
    decision_rule_reasoning: row.decision_rule_reasoning as string,
    what_happened: (row.what_happened as string | null) ?? null,
    important_limitations: (row.important_limitations as string | null) ?? null,
    interpretation: (row.interpretation as string | null) ?? null,
    evidence_state: (row.evidence_state as EvidenceState | null) ?? null,
    decision: (row.decision as RealityCheckDecision | null) ?? null,
    learning: (row.learning as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/** Step 1 (hypothesis + intervention + locked decision rule) — creating this
 * row is "starting" an Experiment. decision_rule and decision_rule_reasoning
 * are never editable after this call (Phase 7 Methodology v1.0, immutability). */
export function createExperiment(input: {
  idea_candidate_id: string;
  previous_experiment_id?: string | null;
  hypothesis: string;
  intervention: string;
  decision_rule: string;
  decision_rule_reasoning: string;
}): Experiment {
  const id = genId("exp");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO experiments (id, idea_candidate_id, previous_experiment_id, hypothesis, intervention, decision_rule, decision_rule_reasoning, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.idea_candidate_id, input.previous_experiment_id ?? null, input.hypothesis, input.intervention, input.decision_rule, input.decision_rule_reasoning, now, now);
  return {
    id,
    idea_candidate_id: input.idea_candidate_id,
    previous_experiment_id: input.previous_experiment_id ?? null,
    hypothesis: input.hypothesis,
    intervention: input.intervention,
    decision_rule: input.decision_rule,
    decision_rule_reasoning: input.decision_rule_reasoning,
    what_happened: null,
    important_limitations: null,
    interpretation: null,
    evidence_state: null,
    decision: null,
    learning: null,
    created_at: now,
    updated_at: now,
  };
}

export function completeExperiment(
  id: string,
  input: {
    what_happened: string;
    important_limitations: string | null;
    interpretation: string;
    evidence_state: EvidenceState;
    decision: RealityCheckDecision;
    learning: string;
  }
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE experiments SET what_happened = ?, important_limitations = ?, interpretation = ?, evidence_state = ?, decision = ?, learning = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(input.what_happened, input.important_limitations, input.interpretation, input.evidence_state, input.decision, input.learning, now, id);
}

export function getExperiment(id: string): Experiment | null {
  const row = getDb().prepare(`SELECT * FROM experiments WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToExperiment(row) : null;
}

export function listExperimentsForIdea(idea_candidate_id: string): Experiment[] {
  const rows = getDb().prepare(`SELECT * FROM experiments WHERE idea_candidate_id = ? ORDER BY created_at ASC`).all(idea_candidate_id) as Record<string, unknown>[];
  return rows.map(rowToExperiment);
}

// ---------- First Customer (Phase 8, Methodology v1.0 accelerated freeze) ----------

export type CustomerEventType = "real_user" | "paying_customer" | "both";

export interface CustomerEvent {
  id: string;
  idea_candidate_id: string;
  event_type: CustomerEventType;
  what_happened: string;
  what_purchased: string | null;
  event_date: string;
  payment_amount: number | null;
  learning: string | null;
  evidence: string | null;
  created_at: string;
}

function rowToCustomerEvent(row: Record<string, unknown>): CustomerEvent {
  return {
    id: row.id as string,
    idea_candidate_id: row.idea_candidate_id as string,
    event_type: row.event_type as CustomerEventType,
    what_happened: row.what_happened as string,
    what_purchased: (row.what_purchased as string | null) ?? null,
    event_date: row.event_date as string,
    payment_amount: (row.payment_amount as number | null) ?? null,
    learning: (row.learning as string | null) ?? null,
    evidence: (row.evidence as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export function createCustomerEvent(input: {
  idea_candidate_id: string;
  event_type: CustomerEventType;
  what_happened: string;
  what_purchased: string | null;
  event_date: string;
  payment_amount: number | null;
  learning: string | null;
  evidence: string | null;
}): CustomerEvent {
  const id = genId("cust");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO customer_events (id, idea_candidate_id, event_type, what_happened, what_purchased, event_date, payment_amount, learning, evidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.idea_candidate_id, input.event_type, input.what_happened, input.what_purchased, input.event_date, input.payment_amount, input.learning, input.evidence, now);
  return { id, created_at: now, ...input };
}

export function listCustomerEventsForIdea(idea_candidate_id: string): CustomerEvent[] {
  const rows = getDb().prepare(`SELECT * FROM customer_events WHERE idea_candidate_id = ? ORDER BY event_date ASC`).all(idea_candidate_id) as Record<string, unknown>[];
  return rows.map(rowToCustomerEvent);
}

// ---------- Revenue (Phase 9, Methodology v1.0 accelerated freeze) ----------

export interface RevenueEvent {
  id: string;
  idea_candidate_id: string;
  amount: number;
  source: string;
  recurring: boolean;
  event_date: string;
  founder_understanding: string | null;
  created_at: string;
}

function rowToRevenueEvent(row: Record<string, unknown>): RevenueEvent {
  return {
    id: row.id as string,
    idea_candidate_id: row.idea_candidate_id as string,
    amount: row.amount as number,
    source: row.source as string,
    recurring: Boolean(row.recurring),
    event_date: row.event_date as string,
    founder_understanding: (row.founder_understanding as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export function createRevenueEvent(input: {
  idea_candidate_id: string;
  amount: number;
  source: string;
  recurring: boolean;
  event_date: string;
  founder_understanding: string | null;
}): RevenueEvent {
  const id = genId("rev");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO revenue_events (id, idea_candidate_id, amount, source, recurring, event_date, founder_understanding, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.idea_candidate_id, input.amount, input.source, input.recurring ? 1 : 0, input.event_date, input.founder_understanding, now);
  return { id, created_at: now, ...input };
}

export function listRevenueEventsForIdea(idea_candidate_id: string): RevenueEvent[] {
  const rows = getDb().prepare(`SELECT * FROM revenue_events WHERE idea_candidate_id = ? ORDER BY event_date ASC`).all(idea_candidate_id) as Record<string, unknown>[];
  return rows.map(rowToRevenueEvent);
}

// ---------- Repeatable reflection (Phase 10, Methodology v1.0 accelerated freeze) ----------
// Founder-initiated only. Never a MarraUp-generated verdict, never gated on
// a numeric customer/revenue count (explicit frozen rule).

export interface RepeatableReflection {
  id: string;
  idea_candidate_id: string;
  reflection_text: string;
  created_at: string;
}

export function createRepeatableReflection(idea_candidate_id: string, reflection_text: string): RepeatableReflection {
  const id = genId("rep");
  const now = new Date().toISOString();
  getDb()
    .prepare(`INSERT INTO repeatable_reflections (id, idea_candidate_id, reflection_text, created_at) VALUES (?, ?, ?, ?)`)
    .run(id, idea_candidate_id, reflection_text, now);
  return { id, idea_candidate_id, reflection_text, created_at: now };
}

export function listRepeatableReflectionsForIdea(idea_candidate_id: string): RepeatableReflection[] {
  const rows = getDb()
    .prepare(`SELECT * FROM repeatable_reflections WHERE idea_candidate_id = ? ORDER BY created_at ASC`)
    .all(idea_candidate_id) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    idea_candidate_id: row.idea_candidate_id as string,
    reflection_text: row.reflection_text as string,
    created_at: row.created_at as string,
  }));
}

// ---------- Delivery Evidence (Business Evaluation Lifecycle v1.0, Addendum A) ----------
// Supplementary to a confirmation event, never the confirmation mechanism
// itself. Optional note/photo, never verified or scored by MarraUp.

export interface DeliveryEvidence {
  id: string;
  business_id: string;
  item_id: string;
  note: string | null;
  photo_data_url: string | null;
  created_at: string;
}

export function createDeliveryEvidence(input: { business_id: string; item_id: string; note: string | null; photo_data_url: string | null }): void {
  if (!input.note && !input.photo_data_url) return; // both optional — nothing to store
  const id = genId("dev");
  const now = new Date().toISOString();
  getDb()
    .prepare(`INSERT INTO delivery_evidence (id, business_id, item_id, note, photo_data_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, input.business_id, input.item_id, input.note, input.photo_data_url, now);
}

export function listDeliveryEvidenceForItem(business_id: string, item_id: string): DeliveryEvidence[] {
  const rows = getDb()
    .prepare(`SELECT * FROM delivery_evidence WHERE business_id = ? AND item_id = ? ORDER BY created_at ASC`)
    .all(business_id, item_id) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    business_id: row.business_id as string,
    item_id: row.item_id as string,
    note: (row.note as string | null) ?? null,
    photo_data_url: (row.photo_data_url as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}


// ---------- Entrepreneur Journey Redesign v2.0 — Find & Develop (phase 1) ----------
// See "MarraUp Entrepreneur Journey - Redesign Spec v2.0" §2, §3, §9 and the
// companion "Find & Develop — Implementation Plan" doc in the MarraUp
// Claude Project for the full design this section implements.

export type ProjectSource = "market_gap" | "self";
export type ProjectStage = "finding" | "blueprint" | "developing" | "testing" | "revenue";
export type FindTaskKey = "define" | "talk" | "alternatives" | "worth_solving" | "sketch" | "signal" | "decide";
export type DevelopCategory = "acquire_setup" | "build" | "arrange" | "hire" | "register_approve" | "customer_ready" | "sell_market";
export type TaskStatus = "not_started" | "in_progress" | "done";

export const FIND_TASK_KEYS: FindTaskKey[] = ["define", "talk", "alternatives", "worth_solving", "sketch", "signal", "decide"];
export const DEVELOP_CATEGORIES: DevelopCategory[] = [
  "acquire_setup",
  "build",
  "arrange",
  "hire",
  "register_approve",
  "customer_ready",
  "sell_market",
];

export interface Project {
  id: string;
  source: ProjectSource;
  market_gap_sector_id: string | null;
  market_gap_text: string | null;
  name: string | null;
  business_model_type: string | null;
  stage: ProjectStage;
  return_count: number;
  status: "active" | "archived";
  archived_at: string | null;
  bp_problem: string | null;
  bp_customer: string | null;
  bp_offering: string | null;
  bp_revenue_model: string | null;
  bp_pricing: string | null;
  bp_advantage: string | null;
  bp_location_scope: string | null;
  bp_required_resources: string | null;
  bp_launch_ready_condition: string | null;
  blueprint_completed_at: string | null;
  stable_view_intro_shown_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FindTask {
  id: string;
  project_id: string;
  task_key: FindTaskKey;
  status: TaskStatus;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface FindNote {
  id: string;
  find_task_id: string;
  body: string;
  logged_at: string;
  created_at: string;
}

export interface DevelopTask {
  id: string;
  project_id: string;
  category: DevelopCategory;
  label: string;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    source: row.source as ProjectSource,
    market_gap_sector_id: (row.market_gap_sector_id as string | null) ?? null,
    market_gap_text: (row.market_gap_text as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    business_model_type: (row.business_model_type as string | null) ?? null,
    stage: row.stage as ProjectStage,
    return_count: row.return_count as number,
    status: row.status as "active" | "archived",
    archived_at: (row.archived_at as string | null) ?? null,
    bp_problem: (row.bp_problem as string | null) ?? null,
    bp_customer: (row.bp_customer as string | null) ?? null,
    bp_offering: (row.bp_offering as string | null) ?? null,
    bp_revenue_model: (row.bp_revenue_model as string | null) ?? null,
    bp_pricing: (row.bp_pricing as string | null) ?? null,
    bp_advantage: (row.bp_advantage as string | null) ?? null,
    bp_location_scope: (row.bp_location_scope as string | null) ?? null,
    bp_required_resources: (row.bp_required_resources as string | null) ?? null,
    bp_launch_ready_condition: (row.bp_launch_ready_condition as string | null) ?? null,
    blueprint_completed_at: (row.blueprint_completed_at as string | null) ?? null,
    stable_view_intro_shown_at: (row.stable_view_intro_shown_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToFindTask(row: Record<string, unknown>): FindTask {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    task_key: row.task_key as FindTaskKey,
    status: row.status as TaskStatus,
    summary: (row.summary as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToDevelopTask(row: Record<string, unknown>): DevelopTask {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    category: row.category as DevelopCategory,
    label: row.label as string,
    status: row.status as TaskStatus,
    sort_order: row.sort_order as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export const MAX_ACTIVE_PROJECTS = 3; // Redesign spec §2.1 — same cap as the old idea-candidate limit.

export function countActiveProjects(): number {
  const row = getDb().prepare(`SELECT COUNT(*) as n FROM projects WHERE status = 'active'`).get() as { n: number };
  return row.n;
}

export function listActiveProjects(): Project[] {
  const rows = getDb().prepare(`SELECT * FROM projects WHERE status = 'active' ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map(rowToProject);
}

export function getProject(id: string): Project | null {
  const row = getDb().prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToProject(row) : null;
}

export function createProject(input: {
  source: ProjectSource;
  market_gap_sector_id?: string | null;
  market_gap_text?: string | null;
  self_description?: string | null;
}): Project {
  if (countActiveProjects() >= MAX_ACTIVE_PROJECTS) {
    throw new Error("You already have 3 active projects. Archive one to start another.");
  }
  const id = genId("proj");
  const now = new Date().toISOString();
  const defineSummary = input.source === "market_gap" ? (input.market_gap_text ?? null) : (input.self_description ?? null);

  getDb()
    .prepare(
      `INSERT INTO projects (id, source, market_gap_sector_id, market_gap_text, stage, return_count, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'finding', 0, 'active', ?, ?)`
    )
    .run(id, input.source, input.market_gap_sector_id ?? null, input.market_gap_text ?? null, now, now);

  const insertTask = getDb().prepare(
    `INSERT INTO project_find_tasks (id, project_id, task_key, status, summary, created_at, updated_at) VALUES (?, ?, ?, 'not_started', ?, ?, ?)`
  );
  for (const key of FIND_TASK_KEYS) {
    insertTask.run(genId("ftask"), id, key, key === "define" ? defineSummary : null, now, now);
  }

  return getProject(id)!;
}

export function archiveProject(id: string): void {
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE projects SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?`).run(now, now, id);
}

export function writeBlueprint(
  projectId: string,
  fields: {
    name: string;
    bp_problem: string;
    bp_customer: string;
    bp_offering: string;
    bp_revenue_model: string;
    bp_pricing: string;
    bp_advantage: string;
    bp_location_scope: string;
    bp_required_resources: string;
    bp_launch_ready_condition: string;
  }
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE projects SET name = ?, bp_problem = ?, bp_customer = ?, bp_offering = ?, bp_revenue_model = ?, bp_pricing = ?,
         bp_advantage = ?, bp_location_scope = ?, bp_required_resources = ?, bp_launch_ready_condition = ?,
         blueprint_completed_at = COALESCE(blueprint_completed_at, ?), stage = CASE WHEN stage = 'finding' THEN 'blueprint' ELSE stage END,
         updated_at = ?
       WHERE id = ?`
    )
    .run(
      fields.name,
      fields.bp_problem,
      fields.bp_customer,
      fields.bp_offering,
      fields.bp_revenue_model,
      fields.bp_pricing,
      fields.bp_advantage,
      fields.bp_location_scope,
      fields.bp_required_resources,
      fields.bp_launch_ready_condition,
      now,
      now,
      projectId
    );
}

export function proceedToDevelop(projectId: string): void {
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE projects SET stage = 'developing', updated_at = ? WHERE id = ?`).run(now, projectId);
}

export function confirmReadyForTest(projectId: string): void {
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE projects SET stage = 'testing', updated_at = ? WHERE id = ?`).run(now, projectId);
}

// ---------- Find tasks & notes ----------

export function listFindTasks(projectId: string): FindTask[] {
  const rows = getDb()
    .prepare(`SELECT * FROM project_find_tasks WHERE project_id = ?`)
    .all(projectId) as Record<string, unknown>[];
  const tasks = rows.map(rowToFindTask);
  // Always return in the fixed §2.2 order, regardless of insertion order.
  return FIND_TASK_KEYS.map((key) => tasks.find((t) => t.task_key === key)).filter((t): t is FindTask => !!t);
}

export function updateFindTask(projectId: string, taskKey: FindTaskKey, input: { status?: TaskStatus; summary?: string }): void {
  const now = new Date().toISOString();
  const existing = getDb()
    .prepare(`SELECT * FROM project_find_tasks WHERE project_id = ? AND task_key = ?`)
    .get(projectId, taskKey) as Record<string, unknown> | undefined;
  if (!existing) return;
  const status = input.status ?? (existing.status as TaskStatus);
  const summary = input.summary !== undefined ? input.summary : (existing.summary as string | null);
  getDb()
    .prepare(`UPDATE project_find_tasks SET status = ?, summary = ?, updated_at = ? WHERE id = ?`)
    .run(status, summary, now, existing.id as string);
  getDb().prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`).run(now, projectId);
}

export function addFindNote(findTaskId: string, body: string): FindNote {
  const id = genId("fnote");
  const now = new Date().toISOString();
  getDb()
    .prepare(`INSERT INTO project_find_notes (id, find_task_id, body, logged_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, findTaskId, body, now, now);
  return { id, find_task_id: findTaskId, body, logged_at: now, created_at: now };
}

export function listFindNotes(findTaskId: string): FindNote[] {
  const rows = getDb()
    .prepare(`SELECT * FROM project_find_notes WHERE find_task_id = ? ORDER BY logged_at DESC`)
    .all(findTaskId) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    find_task_id: row.find_task_id as string,
    body: row.body as string,
    logged_at: row.logged_at as string,
    created_at: row.created_at as string,
  }));
}

// ---------- Develop tasks ----------

export function listDevelopTasks(projectId: string): DevelopTask[] {
  const rows = getDb()
    .prepare(`SELECT * FROM project_develop_tasks WHERE project_id = ? ORDER BY category ASC, sort_order ASC, created_at ASC`)
    .all(projectId) as Record<string, unknown>[];
  return rows.map(rowToDevelopTask);
}

export function addDevelopTask(projectId: string, category: DevelopCategory, label: string): DevelopTask {
  const id = genId("dtask");
  const now = new Date().toISOString();
  const maxOrderRow = getDb()
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) as m FROM project_develop_tasks WHERE project_id = ? AND category = ?`)
    .get(projectId, category) as { m: number };
  const sortOrder = maxOrderRow.m + 1;
  getDb()
    .prepare(
      `INSERT INTO project_develop_tasks (id, project_id, category, label, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'not_started', ?, ?, ?)`
    )
    .run(id, projectId, category, label, sortOrder, now, now);
  getDb().prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`).run(now, projectId);
  return { id, project_id: projectId, category, label, status: "not_started", sort_order: sortOrder, created_at: now, updated_at: now };
}

export function updateDevelopTaskStatus(id: string, status: TaskStatus): void {
  const now = new Date().toISOString();
  const task = getDb().prepare(`SELECT project_id FROM project_develop_tasks WHERE id = ?`).get(id) as { project_id: string } | undefined;
  getDb().prepare(`UPDATE project_develop_tasks SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, id);
  if (task) getDb().prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`).run(now, task.project_id);
}

export function deleteDevelopTask(id: string): void {
  getDb().prepare(`DELETE FROM project_develop_tasks WHERE id = ?`).run(id);
}

// ---------- Entrepreneur Journey Redesign v2.0 — Test (§4) ----------

export type TestQuestion = "reach" | "interest" | "usage" | "response" | "economics";
export const TEST_QUESTIONS: TestQuestion[] = ["reach", "interest", "usage", "response", "economics"];

export interface TestEntry {
  id: string;
  project_id: string;
  question: TestQuestion;
  body: string;
  is_positive: boolean;
  logged_at: string;
  created_at: string;
}

export type CustomerMilestoneType = "customer" | "payment" | "repeat";

export interface CustomerMilestoneEvent {
  id: string;
  project_id: string;
  event_type: CustomerMilestoneType;
  note: string | null;
  event_date: string;
  created_at: string;
}

function rowToTestEntry(row: Record<string, unknown>): TestEntry {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    question: row.question as TestQuestion,
    body: row.body as string,
    is_positive: !!row.is_positive,
    logged_at: row.logged_at as string,
    created_at: row.created_at as string,
  };
}

export function setTestSetup(
  projectId: string,
  input: { test_offering: string; test_customer: string; test_price: string; test_channel: string; business_model_type: string }
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE projects SET test_offering = ?, test_customer = ?, test_price = ?, test_channel = ?, business_model_type = ?, updated_at = ? WHERE id = ?`
    )
    .run(input.test_offering, input.test_customer, input.test_price, input.test_channel, input.business_model_type, now, projectId);
}

export function addTestEntry(projectId: string, question: TestQuestion, body: string, isPositive: boolean): TestEntry {
  const id = genId("test");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO project_test_entries (id, project_id, question, body, is_positive, logged_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, projectId, question, body, isPositive ? 1 : 0, now, now);
  getDb().prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`).run(now, projectId);
  return { id, project_id: projectId, question, body, is_positive: isPositive, logged_at: now, created_at: now };
}

export function listTestEntries(projectId: string): TestEntry[] {
  const rows = getDb()
    .prepare(`SELECT * FROM project_test_entries WHERE project_id = ? ORDER BY logged_at DESC`)
    .all(projectId) as Record<string, unknown>[];
  return rows.map(rowToTestEntry);
}

export function addCustomerMilestoneEvent(projectId: string, eventType: CustomerMilestoneType, note: string | null): CustomerMilestoneEvent {
  const id = genId("cme");
  const now = new Date().toISOString();
  getDb()
    .prepare(`INSERT INTO project_customer_events (id, project_id, event_type, note, event_date, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, projectId, eventType, note, now, now);
  return { id, project_id: projectId, event_type: eventType, note, event_date: now, created_at: now };
}

export function listCustomerMilestoneEvents(projectId: string): CustomerMilestoneEvent[] {
  const rows = getDb()
    .prepare(`SELECT * FROM project_customer_events WHERE project_id = ? ORDER BY event_date DESC`)
    .all(projectId) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    project_id: row.project_id as string,
    event_type: row.event_type as CustomerMilestoneType,
    note: (row.note as string | null) ?? null,
    event_date: row.event_date as string,
    created_at: row.created_at as string,
  }));
}

// §4.5 "Back to Find" — reopens Find's task list on the same Project;
// prior Find answers stay (never recreated), stage flips back, and
// return_count increments so the UI can say "second pass at this problem."
export function returnProjectToFind(projectId: string): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE projects SET stage = 'finding', return_count = return_count + 1, updated_at = ? WHERE id = ?`)
    .run(now, projectId);
}

// ---------- Entrepreneur Journey Redesign v2.0 — Experiment (§5) ----------
// Project-scoped Experiments reuse the frozen Phase 7 fields/table
// (Experiment interface, completeExperiment, EvidenceState,
// RealityCheckDecision all already defined above) via the new project_id /
// weak_point / suggestion_key columns.

export interface ProjectExperiment extends Experiment {
  project_id: string;
  weak_point: WeakPoint | null;
  suggestion_key: string | null;
}

export type WeakPoint = "reach" | "interest" | "usage" | "response" | "economics";

function rowToProjectExperiment(row: Record<string, unknown>): ProjectExperiment {
  return {
    ...rowToExperiment(row),
    project_id: row.project_id as string,
    weak_point: (row.weak_point as WeakPoint | null) ?? null,
    suggestion_key: (row.suggestion_key as string | null) ?? null,
  };
}

export function createExperimentForProject(input: {
  project_id: string;
  hypothesis: string;
  intervention: string;
  decision_rule: string;
  decision_rule_reasoning: string;
  weak_point: WeakPoint | null;
  suggestion_key: string | null;
}): ProjectExperiment {
  const id = genId("exp");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO experiments (id, idea_candidate_id, project_id, weak_point, suggestion_key, hypothesis, intervention, decision_rule, decision_rule_reasoning, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      SENTINEL_IDEA_CANDIDATE_ID,
      input.project_id,
      input.weak_point,
      input.suggestion_key,
      input.hypothesis,
      input.intervention,
      input.decision_rule,
      input.decision_rule_reasoning,
      now,
      now
    );
  const now2 = new Date().toISOString();
  getDb().prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`).run(now2, input.project_id);
  return {
    id,
    idea_candidate_id: SENTINEL_IDEA_CANDIDATE_ID,
    project_id: input.project_id,
    previous_experiment_id: null,
    weak_point: input.weak_point,
    suggestion_key: input.suggestion_key,
    hypothesis: input.hypothesis,
    intervention: input.intervention,
    decision_rule: input.decision_rule,
    decision_rule_reasoning: input.decision_rule_reasoning,
    what_happened: null,
    important_limitations: null,
    interpretation: null,
    evidence_state: null,
    decision: null,
    learning: null,
    created_at: now,
    updated_at: now,
  };
}

export function listExperimentsForProject(project_id: string): ProjectExperiment[] {
  const rows = getDb()
    .prepare(`SELECT * FROM experiments WHERE project_id = ? ORDER BY created_at DESC`)
    .all(project_id) as Record<string, unknown>[];
  return rows.map(rowToProjectExperiment);
}

export function getProjectExperiment(id: string): ProjectExperiment | null {
  const row = getDb().prepare(`SELECT * FROM experiments WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToProjectExperiment(row) : null;
}

export function moveToRevenue(projectId: string): void {
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE projects SET stage = 'revenue', updated_at = ? WHERE id = ?`).run(now, projectId);
}

// ---------- Entrepreneur Journey Redesign v2.0 — Revenue (§6) ----------

export interface RevenueCycle {
  id: string;
  project_id: string;
  cycle_number: number;
  started_at: string;
  closed_at: string | null;
  money_invested: number | null;
  revenue: number | null;
  expenses: number | null;
  net_cash: number | null;
  recurring_commitments: string | null;
  new_customers: number | null;
  total_customers: number | null;
  repeat_customers: number | null;
  sales_count: number | null;
  avg_sale_value: number | null;
  notes: string | null;
  review_what_happened: string | null;
  review_what_changed: string | null;
  review_needs_attention: string | null;
  review_next_step: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRevenueCycle(row: Record<string, unknown>): RevenueCycle {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    cycle_number: row.cycle_number as number,
    started_at: row.started_at as string,
    closed_at: (row.closed_at as string | null) ?? null,
    money_invested: (row.money_invested as number | null) ?? null,
    revenue: (row.revenue as number | null) ?? null,
    expenses: (row.expenses as number | null) ?? null,
    net_cash: (row.net_cash as number | null) ?? null,
    recurring_commitments: (row.recurring_commitments as string | null) ?? null,
    new_customers: (row.new_customers as number | null) ?? null,
    total_customers: (row.total_customers as number | null) ?? null,
    repeat_customers: (row.repeat_customers as number | null) ?? null,
    sales_count: (row.sales_count as number | null) ?? null,
    avg_sale_value: (row.avg_sale_value as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    review_what_happened: (row.review_what_happened as string | null) ?? null,
    review_what_changed: (row.review_what_changed as string | null) ?? null,
    review_needs_attention: (row.review_needs_attention as string | null) ?? null,
    review_next_step: (row.review_next_step as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function createFirstCycle(projectId: string): RevenueCycle {
  const id = genId("cycle");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO revenue_cycles (id, project_id, cycle_number, started_at, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?)`
    )
    .run(id, projectId, now, now, now);
  return getRevenueCycleById(id)!;
}

export function getRevenueCycleById(id: string): RevenueCycle | null {
  const row = getDb().prepare(`SELECT * FROM revenue_cycles WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? rowToRevenueCycle(row) : null;
}

export function getCurrentCycle(projectId: string): RevenueCycle {
  const row = getDb()
    .prepare(`SELECT * FROM revenue_cycles WHERE project_id = ? AND closed_at IS NULL ORDER BY cycle_number DESC LIMIT 1`)
    .get(projectId) as Record<string, unknown> | undefined;
  if (row) return rowToRevenueCycle(row);
  return createFirstCycle(projectId);
}

export function getPreviousCycle(projectId: string, beforeCycleNumber: number): RevenueCycle | null {
  const row = getDb()
    .prepare(`SELECT * FROM revenue_cycles WHERE project_id = ? AND cycle_number = ? AND closed_at IS NOT NULL`)
    .get(projectId, beforeCycleNumber - 1) as Record<string, unknown> | undefined;
  return row ? rowToRevenueCycle(row) : null;
}

export function updateCycleFields(
  cycleId: string,
  fields: Partial<
    Pick<
      RevenueCycle,
      "money_invested" | "revenue" | "expenses" | "recurring_commitments" | "new_customers" | "total_customers" | "repeat_customers" | "sales_count" | "avg_sale_value" | "notes"
    >
  >
): void {
  const now = new Date().toISOString();
  const cur = getRevenueCycleById(cycleId);
  if (!cur) return;
  const merged = { ...cur, ...fields };
  getDb()
    .prepare(
      `UPDATE revenue_cycles SET money_invested = ?, revenue = ?, expenses = ?, recurring_commitments = ?, new_customers = ?, total_customers = ?, repeat_customers = ?, sales_count = ?, avg_sale_value = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      merged.money_invested,
      merged.revenue,
      merged.expenses,
      merged.recurring_commitments,
      merged.new_customers,
      merged.total_customers,
      merged.repeat_customers,
      merged.sales_count,
      merged.avg_sale_value,
      merged.notes,
      now,
      cycleId
    );
  getDb().prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`).run(now, cur.project_id);
}

export function closeCycleAndOpenNext(
  cycleId: string,
  review: { review_what_happened: string; review_what_changed: string; review_needs_attention: string; review_next_step: string }
): RevenueCycle {
  const now = new Date().toISOString();
  const cur = getRevenueCycleById(cycleId)!;
  const netCash = (cur.revenue ?? 0) - (cur.expenses ?? 0);
  getDb()
    .prepare(
      `UPDATE revenue_cycles SET closed_at = ?, net_cash = ?, review_what_happened = ?, review_what_changed = ?, review_needs_attention = ?, review_next_step = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(now, netCash, review.review_what_happened, review.review_what_changed, review.review_needs_attention, review.review_next_step, now, cycleId);

  const nextId = genId("cycle");
  getDb()
    .prepare(`INSERT INTO revenue_cycles (id, project_id, cycle_number, started_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(nextId, cur.project_id, cur.cycle_number + 1, now, now, now);
  return getRevenueCycleById(nextId)!;
}

export function listClosedCycles(projectId: string): RevenueCycle[] {
  const rows = getDb()
    .prepare(`SELECT * FROM revenue_cycles WHERE project_id = ? AND closed_at IS NOT NULL ORDER BY cycle_number DESC`)
    .all(projectId) as Record<string, unknown>[];
  return rows.map(rowToRevenueCycle);
}

// ---------- Stable Business view (§7) — Operations notes & Founder Dependence ----------

export interface OperationsNote {
  id: string;
  project_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export function addOperationsNote(projectId: string, body: string): OperationsNote {
  const id = genId("opnote");
  const now = new Date().toISOString();
  getDb()
    .prepare(`INSERT INTO project_operations_notes (id, project_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, projectId, body, now, now);
  return { id, project_id: projectId, body, created_at: now, updated_at: now };
}

export function listOperationsNotes(projectId: string): OperationsNote[] {
  const rows = getDb()
    .prepare(`SELECT * FROM project_operations_notes WHERE project_id = ? ORDER BY created_at DESC`)
    .all(projectId) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    project_id: row.project_id as string,
    body: row.body as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

export interface FounderDependence {
  project_id: string;
  only_i_sell: boolean;
  only_i_deliver: boolean;
  only_i_know_process: boolean;
  process_undocumented: boolean;
  no_backup: boolean;
  updated_at: string;
}

export function getFounderDependence(projectId: string): FounderDependence | null {
  const row = getDb().prepare(`SELECT * FROM project_founder_dependence WHERE project_id = ?`).get(projectId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    project_id: row.project_id as string,
    only_i_sell: !!row.only_i_sell,
    only_i_deliver: !!row.only_i_deliver,
    only_i_know_process: !!row.only_i_know_process,
    process_undocumented: !!row.process_undocumented,
    no_backup: !!row.no_backup,
    updated_at: row.updated_at as string,
  };
}

export function upsertFounderDependence(
  projectId: string,
  fields: { only_i_sell: boolean; only_i_deliver: boolean; only_i_know_process: boolean; process_undocumented: boolean; no_backup: boolean }
): void {
  const now = new Date().toISOString();
  const existing = getDb().prepare(`SELECT project_id FROM project_founder_dependence WHERE project_id = ?`).get(projectId);
  if (existing) {
    getDb()
      .prepare(
        `UPDATE project_founder_dependence SET only_i_sell = ?, only_i_deliver = ?, only_i_know_process = ?, process_undocumented = ?, no_backup = ?, updated_at = ? WHERE project_id = ?`
      )
      .run(fields.only_i_sell ? 1 : 0, fields.only_i_deliver ? 1 : 0, fields.only_i_know_process ? 1 : 0, fields.process_undocumented ? 1 : 0, fields.no_backup ? 1 : 0, now, projectId);
  } else {
    getDb()
      .prepare(
        `INSERT INTO project_founder_dependence (id, project_id, only_i_sell, only_i_deliver, only_i_know_process, process_undocumented, no_backup, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(genId("fdep"), projectId, fields.only_i_sell ? 1 : 0, fields.only_i_deliver ? 1 : 0, fields.only_i_know_process ? 1 : 0, fields.process_undocumented ? 1 : 0, fields.no_backup ? 1 : 0, now);
  }
}

export function markStableViewIntroShown(projectId: string): void {
  const row = getDb().prepare(`SELECT stable_view_intro_shown_at FROM projects WHERE id = ?`).get(projectId) as { stable_view_intro_shown_at: string | null } | undefined;
  if (row && row.stable_view_intro_shown_at) return;
  getDb().prepare(`UPDATE projects SET stable_view_intro_shown_at = ? WHERE id = ?`).run(new Date().toISOString(), projectId);
}
