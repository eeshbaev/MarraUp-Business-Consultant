// Redesign spec §3.1 — "Resource cross-check (computed, not asked)": compares
// the Blueprint's freeform `Required resources` list against the Develop
// task labels and flags anything with no covering task. Deliberately a
// simple case-insensitive substring match, not NLP — the spec calls this
// "a suggestion, never a blocker," so false negatives/positives are
// low-stakes. Revisit if this proves too naive once real users try it.

export function parseRequiredResources(bpRequiredResources: string | null): string[] {
  if (!bpRequiredResources) return [];
  return bpRequiredResources
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function computeResourceGaps(bpRequiredResources: string | null, developTaskLabels: string[]): string[] {
  const resources = parseRequiredResources(bpRequiredResources);
  if (resources.length === 0) return [];
  const haystack = developTaskLabels.map((l) => l.toLowerCase());
  return resources.filter((resource) => {
    const needle = resource.toLowerCase();
    // A resource is "covered" if any develop task label contains it, or it
    // contains any develop task label (handles "delivery bikes" vs. "bikes").
    return !haystack.some((label) => label.includes(needle) || needle.includes(label));
  });
}
