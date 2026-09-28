// My Path / Discover — assembles "Why this appeared" text from a
// direction's actual supporting signals. Per Methodology v1.0 Part 8: a
// fixed phrase library keyed to tag combinations, never generated at
// runtime by a model.

import type { DirectionCandidate } from "./engine";

const CLASS_PHRASES: Record<string, string> = {
  COMMERCIAL_EXPERIENCE: "You have earned income from this type of work, or operated a business in this area",
  PRACTICAL_EXPERIENCE: "You have practical, hands-on experience in this area",
  SPECIFIC_ACCESS: "You have direct access to what this kind of work typically requires",
  FORMAL_KNOWLEDGE: "You have formal education or training in this area",
  SELF_ASSESSED_ABILITY: "You believe you have ability in this area",
  ASPIRATION: "You told us this is an area you're interested in exploring",
};

const ACCESS_HINTS: { match: RegExp; phrase: string }[] = [
  { match: /workshop/i, phrase: "and you have access to workshop space" },
  { match: /vehicle repair/i, phrase: "and you have practical experience repairing vehicles" },
  { match: /land/i, phrase: "and you have access to land" },
  { match: /kitchen/i, phrase: "and you have access to a kitchen / food-production space" },
  { match: /warehouse|storage/i, phrase: "and you have access to storage/warehouse space" },
  { match: /vehicle|truck|van/i, phrase: "and you have access to a suitable vehicle" },
];

/** Builds a short, honest sentence from a direction's strongest and supporting evidence — never invented, never scored. */
export function explainDirection(candidate: DirectionCandidate): string {
  const base = CLASS_PHRASES[candidate.strongestEvidenceClass] ?? "There is some evidence in your answers pointing here";
  const sentences = [base + "."];

  const extraHints = new Set<string>();
  for (const sig of candidate.supportingSignals) {
    if (sig.evidenceClass === candidate.strongestEvidenceClass) continue; // already covered by base
    for (const hint of ACCESS_HINTS) {
      if (sig.subSector && hint.match.test(sig.subSector)) extraHints.add(hint.phrase);
    }
  }
  if (extraHints.size > 0) {
    sentences.push(`You also ${Array.from(extraHints).join(", ")}.`.replace("also and ", "also "));
  }
  return sentences.join(" ");
}

export function directionDisplayName(sectorLabel: string, subSector?: string): string {
  return subSector ? `${sectorLabel} → ${subSector}` : sectorLabel;
}
