# MarraUp

A plain-evidence business health and risk diagnostic, built directly from the frozen MarraUp Methodology v1.0 (see the `MarraUp` Claude project for the full methodology docs — this app implements the Developer Build Specification's Sections 1–4 and 7).

## What's actually working

This is a real, running app, not a mockup — you can go through the whole loop:

1. **`/new`** — create a business (name, owner, free-text sector) and answer the 7 intake questions. Stage (pre-revenue/early/growth/established) is derived from your answers, never selected.
2. **`/assessment/[businessId]`** — the 45 Business Health questions and 20 Risk Exposure fields, with question text that adapts to the derived stage. Risk fields that don't yet apply (per your intake answers) are skipped and marked "not yet demonstrated" rather than asked.
3. **`/results/[businessId]`** — Business Health (0–100, 9 dimensions), Risk Exposure (0–100, 6 categories), Critical Exposures, Category Saturation, Undemonstrated Constructs, Owner Exposure — all computed, not self-rated.
4. **`/plan/[businessId]`** — the Action Plan Engine's output: up to 5 ranked action items (round-robin across 16 dimension buckets, tiered, with the round-0 overflow fix and the fixed 2.0-point Tier 1/2 cutoff both implemented), an Other Actions count, and a "Mark as delivered" flow that re-asks the specific question rather than a generic done toggle.

The engine underneath (`src/lib/action-plan/engine.ts`, `src/lib/resolution.ts`, `src/lib/scoring/`) is unit-tested (`npm test` — 14 tests) against the invariants in the Developer Build Specification, Section 6: the round-robin overflow fix, the fixed points-left cutoff, cluster suppression (MAX not SUM), the resolution engine's five rule types including a mixed field/construct cluster condition, COUNT_THRESHOLD's periodic-reassessment-only behavior, and localization fallback.

`scripts/e2e-smoke.mjs` is a Playwright script that drives the entire flow in a real browser (new business → 63-question assessment → results → plan → confirm an item) end to end — see "Running the smoke test" below.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The dev database is a local SQLite file at `data/marraup.db`, created automatically on first run — nothing else to configure.

```bash
npm test        # the engine's unit test suite (vitest)
npm run build   # production build + typecheck
npm run lint    # eslint
```

### Running the smoke test

```bash
npm run dev &          # or in a separate terminal
node scripts/e2e-smoke.mjs
```

It expects the dev server on port 3311 by default — either run `npm run dev -- -p 3311` first, or edit the `BASE` constant at the top of the script.

## What this build deliberately does NOT include yet

Being upfront about this rather than letting it surface as a surprise:

- **No accounts/auth.** Anyone who opens `/new` can create a business; there's no login, so there's currently no real separation between "your" businesses and anyone else's who uses the same deployment. Build Plan Phase 3. Fine for a single local user right now, not fine to deploy publicly as-is.
- **No translations.** The localization *mechanism* (Section 5 — `src/lib/localization.ts`, English canonical + fallback) is built and tested, but no uz/ru/zh/fr translation rows exist yet — that's Build Plan Phase 0.5, a separate, mostly-people-not-code effort.
- **No progress-saving mid-assessment.** All 45+20+1 questions are one long form, submitted at once. Reasonable for getting the engine right first; a real product would likely save progress as you go.
- **The same-exposure deduplication rule** (Risk Exposure Methodology, Part D — two Risk fields that turn out to describe the same real-world entity, like "largest customer" and "largest expected inflow source," get deduplicated rather than double-counted) is **not implemented**. The specific eligible field pairs weren't part of the canonical content extraction, so this needs a source lookup before it can be built correctly, not a guess. Consequence: Cluster CLU-11, which depends entirely on this mechanic, never fires in this build.
- **Two numeric thresholds were invented, not sourced**, because the methodology states them qualitatively without a number: CLU-08 ("Health high") uses Business Health ≥ 70; CLU-09 ("Risk moderate") uses Risk Exposure < 60. Both are marked `// documented Category A assumption` in `src/lib/action-plan/triggers.ts` and are one-line changes if a real threshold gets decided later.
- **No weekly check-in email, no full reassessment-cycle UI, no assessment history/trend view.** Build Plan Phases 5–6.

## A few implementation choices worth knowing about (all flagged in code comments where they matter)

- **Persistence is `node:sqlite`** (Node's built-in SQLite, Node ≥ 22), not Prisma+Postgres as the Build Plan originally recommended. Reason: Prisma's CLI needed to download a native binary from a host this build environment's network policy blocked, and Prisma's CLI has also just gone through a disruptive v7→v8 redesign — not a great fit for "cheap to maintain" right now. `node:sqlite` is zero-install, zero-download, ships with Node itself. It's still flagged "experimental" by Node — worth a look before a production launch, but solid for this build. Swapping the persistence layer later means replacing `src/lib/db.ts`; nothing else in the app touches SQL directly.
- **Two real bugs were caught and fixed while implementing the pseudocode literally**, beyond the ones already known from this session's methodology work:
  - The Developer Build Specification's `checkResolution` pseudocode compares levels the same direction for every field (`>=`), which is right for Health fields (A=weakest..E=strongest) but backwards for Risk fields and Owner Exposure, where A is *best*. Fixed with a domain-aware comparison in `src/lib/resolution.ts` — flagged inline there.
  - The within-dimension sort for round-robin selection sorted by `rank_key` before tier, which let a Category Saturation flag's rank_key (a category-weight proxy) outrank a same-dimension Critical Exposure — breaking the explicit "0a always ranks ahead of 0b within a shared dimension" guarantee (Profile F). Fixed by sorting tier first — flagged inline in `src/lib/action-plan/engine.ts`.
- **Two Layer 4 clusters (CLU-04, CLU-07) had a dimension name in the source content that didn't match `DIMENSION_ORDER`'s canonical spelling** ("Legal Exposure" vs "Legal & Regulatory Exposure", "Product Exposure" vs "Product & Delivery Exposure") — a transcription inconsistency, normalized in `src/lib/content.ts`.
- **CLU-08 and CLU-09 are "portfolio-level" clusters** with no single home dimension in the source content (their dimension field is a description, not one of the 16 real buckets). Each is assigned dynamically to the dimension of its most severe live constituent at plan-build time — see `resolveClusterDimension` in `src/lib/action-plan/engine.ts`.

## Project layout

```
src/content/            canonical data (45 questions, 20 risk fields, 224 rule library entries) — from the Canonical Content Extraction
src/lib/types.ts         the canonical data model (Developer Build Spec, Section 1)
src/lib/content.ts       loads src/content into the typed model
src/lib/intake.ts        Intake & Stage Determination
src/lib/scoring/         Business Health + Risk Exposure scoring
src/lib/action-plan/     the Action Plan Engine (Section 3) + finding triggers
src/lib/resolution.ts    the resolution engine (Section 4)
src/lib/localization.ts  the localization mechanism (Section 5)
src/lib/db.ts            persistence (node:sqlite)
src/app/                 the Next.js App Router pages + server actions
src/__tests__/           the engine's unit test suite
scripts/e2e-smoke.mjs    a full browser walkthrough (Playwright)
```

## Suggested next steps

In the order the Developer Build Specification's Section 8 lays out: accounts (Phase 3), then progress-saving and a nicer multi-step assessment UI (Phase 4), then reassessment + the check-in email (Phases 5–6), then the translation pass (Phase 0.5, can run in parallel with anything above). The same-exposure dedup rule (above) is worth resolving before relying on Risk Exposure numbers for a business likely to trigger it.
