// My Path / Discover — deterministic ranking engine.
// Implements Methodology v1.0 Part 8 (lexicographic hierarchy) and Part
// 17.31-17.32 (normalized evidence records, mechanical algorithm). No ML,
// no model inference, no numeric score of any kind reaches the caller.

import { MAPPING_BY_TAG } from "./mapping";
import { evidenceClassRank, type EvidenceClass } from "./tags";
import type { SectorId } from "./sectors";

export interface EvidenceSignal {
  signalId: string;
  sectorId: SectorId;
  subSector?: string;
  evidenceClass: EvidenceClass;
  independenceGroup: string;
  sourceTag: string;
}

export interface DiscoverAnswers {
  /** Every scored tag the user's answers produced, e.g. from Chapters B/C/D. */
  tags: string[];
  /** Q27 hard-exclusion sector ids. */
  hardExclusions: SectorId[];
  /** Q26 answers — stored, never used in ranking. Passed through untouched. */
  userPreferences?: string[];
}

export interface DirectionCandidate {
  sectorId: SectorId;
  subSector?: string;
  strongestEvidenceClass: EvidenceClass;
  independentSignalCount: number;
  supportingSignals: EvidenceSignal[];
}

/** Step: generate normalized evidence records from raw answer tags (Part 17.31). */
export function buildEvidenceSignals(tags: string[]): EvidenceSignal[] {
  const signals: EvidenceSignal[] = [];
  let n = 0;
  for (const tag of tags) {
    const rows = MAPPING_BY_TAG.get(tag);
    if (!rows) continue; // untagged answer (preferences, generic access, etc.) — produces nothing, by design
    for (const row of rows) {
      signals.push({
        signalId: `${row.id}#${n++}`,
        sectorId: row.sectorId,
        subSector: row.subSector,
        evidenceClass: row.evidenceClass,
        independenceGroup: row.independenceGroup,
        sourceTag: tag,
      });
    }
  }
  return signals;
}

/** Group signals by sector, computing each sector's strongest class, best sub-sector, and independent signal count (Part 8 Steps 2-4). */
function buildCandidates(signals: EvidenceSignal[], hardExclusions: Set<SectorId>): DirectionCandidate[] {
  const bySector = new Map<SectorId, EvidenceSignal[]>();
  for (const s of signals) {
    if (hardExclusions.has(s.sectorId)) continue; // Step 1 — eligibility, applied before anything else
    const list = bySector.get(s.sectorId) ?? [];
    list.push(s);
    bySector.set(s.sectorId, list);
  }

  const candidates: DirectionCandidate[] = [];
  for (const [sectorId, sigs] of bySector) {
    const strongestRank = Math.min(...sigs.map((s) => evidenceClassRank(s.evidenceClass)));
    const strongest = sigs.filter((s) => evidenceClassRank(s.evidenceClass) === strongestRank);
    const strongestEvidenceClass = strongest[0].evidenceClass;

    // Specificity (Step 3): prefer a sub-sector-carrying signal, among the strongest-class signals only.
    const withSubSector = strongest.filter((s) => !!s.subSector);
    const bestSubSector = withSubSector.length > 0 ? withSubSector[0].subSector : undefined;

    // Independent signal count (Step 4): dedupe by independenceGroup so one
    // underlying fact that produced several mapping rows counts once.
    const independentGroups = new Set(sigs.map((s) => s.independenceGroup));

    candidates.push({
      sectorId,
      subSector: bestSubSector,
      strongestEvidenceClass,
      independentSignalCount: independentGroups.size,
      supportingSignals: sigs,
    });
  }
  return candidates;
}

/** Full Part 8 lexicographic ordering: class -> specificity -> signal count -> alphabetical sectorId. */
function compareCandidates(a: DirectionCandidate, b: DirectionCandidate): number {
  const classDiff = evidenceClassRank(a.strongestEvidenceClass) - evidenceClassRank(b.strongestEvidenceClass);
  if (classDiff !== 0) return classDiff;

  const aHasSub = a.subSector ? 0 : 1;
  const bHasSub = b.subSector ? 0 : 1;
  if (aHasSub !== bHasSub) return aHasSub - bHasSub;

  if (a.independentSignalCount !== b.independentSignalCount) {
    return b.independentSignalCount - a.independentSignalCount; // more signals first
  }

  return a.sectorId.localeCompare(b.sectorId); // Step 5, fixed tie-break
}

const MAX_DIRECTIONS = 5;
// Aspiration-only candidates are included only to fill remaining slots, and
// only for domains the user actually expressed interest in (Part 8 output
// cap) — never manufactured. Ranking above already guarantees stronger
// classes sort first; this constant just documents the rule.
const ASPIRATION_CLASS: EvidenceClass = "ASPIRATION";

/**
 * The full pipeline (Part 17.32): evidence -> eligibility -> grouping ->
 * lexicographic ordering -> top 5. Returns fewer than 5 when fewer than 5
 * sectors have any real evidence — by design (Part 8, Part 14).
 */
export function rankDirections(answers: DiscoverAnswers): DirectionCandidate[] {
  const signals = buildEvidenceSignals(answers.tags);
  const hardExclusions = new Set(answers.hardExclusions);
  const candidates = buildCandidates(signals, hardExclusions);
  candidates.sort(compareCandidates);
  return candidates.slice(0, MAX_DIRECTIONS);
}

export { ASPIRATION_CLASS };
