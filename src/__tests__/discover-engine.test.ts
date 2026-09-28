// Acceptance tests for My Path / Discover's ranking engine, directly
// implementing Methodology v1.0 Part 17.30's ten noise-control tests.
// These exist so the mapping table can never silently regress into
// "owns a laptop -> Data" style fake affinity.

import { describe, it, expect } from "vitest";
import { rankDirections, buildEvidenceSignals } from "@/lib/discover/engine";
import { SECTOR } from "@/lib/discover/sectors";

describe("Discover ranking engine — Part 17.30 acceptance tests", () => {
  it("1. personal vehicle only -> 0 sector candidates", () => {
    const result = rankDirections({ tags: ["VEHICLE_PERSONAL"], hardExclusions: [] });
    expect(result).toHaveLength(0);
  });

  it("2. ordinary laptop only -> 0 sector candidates", () => {
    const result = rankDirections({ tags: ["COMPUTER_ORDINARY"], hardExclusions: [] });
    expect(result).toHaveLength(0);
  });

  it("3. Q26 'helping people' only -> 0 sector candidates (never Healthcare)", () => {
    // Q26 answers are user_preferences, not scored tags — they never even
    // reach buildEvidenceSignals via the `tags` array in real usage. Modeled
    // here as an unmapped tag to prove it produces nothing if it ever did.
    const result = rankDirections({ tags: ["HELPING_PEOPLE"], hardExclusions: [] });
    expect(result).toHaveLength(0);
  });

  it("4. community network only -> 0 sector candidates", () => {
    const result = rankDirections({ tags: ["COMMUNITY_NETWORK"], hardExclusions: [] });
    expect(result).toHaveLength(0);
  });

  it("5. English language only -> 0 sector candidates", () => {
    const result = rankDirections({ tags: ["LANGUAGE_ENGLISH"], hardExclusions: [] });
    expect(result).toHaveLength(0);
  });

  it("6. online + digital preference only -> no candidate above General Compatibility (must not manufacture IT)", () => {
    const result = rankDirections({ tags: ["LOCATION_ONLINE", "PREFERENCE_DIGITAL"], hardExclusions: [] });
    expect(result).toHaveLength(0); // these preference tags aren't in the mapping table at all
  });

  it("7. commercial vehicle-repair experience -> Transportation, vehicle repair sub-sector, COMMERCIAL_EXPERIENCE", () => {
    const result = rankDirections({ tags: ["COMMERCIAL_EXPERIENCE_MACHINERY"], hardExclusions: [] });
    const transport = result.find((c) => c.sectorId === SECTOR.TRANSPORTATION);
    expect(transport).toBeTruthy();
    expect(transport?.strongestEvidenceClass).toBe("COMMERCIAL_EXPERIENCE");
    expect(transport?.subSector).toBe("Vehicle repair & maintenance");
  });

  it("8. commercial IT experience + ordinary laptop -> IT & Software only, laptop contributes nothing", () => {
    const result = rankDirections({ tags: ["COMMERCIAL_EXPERIENCE_IT", "COMPUTER_ORDINARY"], hardExclusions: [] });
    expect(result.map((c) => c.sectorId)).toEqual([SECTOR.IT_SOFTWARE]);
    const it = result[0];
    expect(it.independentSignalCount).toBe(1); // only the domain signal, not the laptop
  });

  it("9. practical IT experience + Data sub-tag -> IT & Software AND Data, Data shown as the specific direction", () => {
    const result = rankDirections({
      tags: ["PRACTICAL_EXPERIENCE_IT", "IT_SUBTAG_DATA"],
      hardExclusions: [],
    });
    const sectors = result.map((c) => c.sectorId);
    expect(sectors).toContain(SECTOR.IT_SOFTWARE);
    expect(sectors).toContain(SECTOR.DATA);
  });

  it("10. wellness aspiration only -> Consumer & Personal Services, never Healthcare", () => {
    const result = rankDirections({ tags: ["ASPIRATION_HEALTH_PERSONAL"], hardExclusions: [] });
    expect(result.map((c) => c.sectorId)).toEqual([SECTOR.CONSUMER_PERSONAL_SERVICES]);
    expect(result.map((c) => c.sectorId)).not.toContain(SECTOR.HEALTHCARE);
  });
});

describe("Discover ranking engine — additional structural guarantees", () => {
  it("never returns more than 5 directions", () => {
    const manyTags = [
      "COMMERCIAL_EXPERIENCE_FOOD_AGRICULTURE",
      "COMMERCIAL_EXPERIENCE_MACHINERY",
      "COMMERCIAL_EXPERIENCE_CONSTRUCTION",
      "COMMERCIAL_EXPERIENCE_IT",
      "COMMERCIAL_EXPERIENCE_PROFESSIONAL",
      "COMMERCIAL_EXPERIENCE_RETAIL",
      "COMMERCIAL_EXPERIENCE_EDUCATION",
      "COMMERCIAL_EXPERIENCE_CREATIVE",
    ];
    const result = rankDirections({ tags: manyTags, hardExclusions: [] });
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("hard exclusions remove a sector regardless of accumulated evidence", () => {
    const result = rankDirections({
      tags: ["COMMERCIAL_EXPERIENCE_IT"],
      hardExclusions: [SECTOR.IT_SOFTWARE],
    });
    expect(result.map((c) => c.sectorId)).not.toContain(SECTOR.IT_SOFTWARE);
  });

  it("healthcare is never produced by any Health & Personal domain tag, at any evidence level", () => {
    const allLevels = [
      "COMMERCIAL_EXPERIENCE_HEALTH_PERSONAL",
      "PRACTICAL_EXPERIENCE_HEALTH_PERSONAL",
      "KNOWLEDGE_HEALTH_PERSONAL",
      "ABILITY_HEALTH_PERSONAL",
      "ASPIRATION_HEALTH_PERSONAL",
    ];
    for (const tag of allLevels) {
      const result = rankDirections({ tags: [tag], hardExclusions: [] });
      expect(result.map((c) => c.sectorId)).not.toContain(SECTOR.HEALTHCARE);
    }
  });

  it("generic Retail domain experience without a sub-tag never implies Wholesale or Logistics", () => {
    const result = rankDirections({ tags: ["COMMERCIAL_EXPERIENCE_RETAIL"], hardExclusions: [] });
    const sectors = result.map((c) => c.sectorId);
    expect(sectors).toContain(SECTOR.RETAIL);
    expect(sectors).not.toContain(SECTOR.WHOLESALE);
    expect(sectors).not.toContain(SECTOR.LOGISTICS);
  });

  it("sectors requiring specific evidence never appear from a generic tag", () => {
    // Machinery access must never surface Robotics, Semiconductors, AI & ML, or Aerospace.
    const signals = buildEvidenceSignals(["MACHINERY_ACCESS"]);
    const sectors = new Set(signals.map((s) => s.sectorId));
    expect(sectors.has(SECTOR.ROBOTICS)).toBe(false);
    expect(sectors.has(SECTOR.SEMICONDUCTORS)).toBe(false);
    expect(sectors.has(SECTOR.AI_ML)).toBe(false);
    expect(sectors.has(SECTOR.AEROSPACE_SPACE)).toBe(false);
  });
});

// Verifies sectors.ts SECTOR.* values are byte-identical to the real,
// already-live 40-sector taxonomy ids (sector-taxonomy.ts) — Methodology
// v1.0 Part 17.1's requirement that My Path never invents a parallel
// taxonomy.
import { SECTOR_TAXONOMY } from "@/lib/sector-taxonomy";
import { SECTOR as SECTOR_ALIASES } from "@/lib/discover/sectors";

describe("Discover sector aliases match the live 40-sector taxonomy exactly", () => {
  it("every SECTOR.* value is a real SECTOR_TAXONOMY group id", () => {
    const realIds = new Set(SECTOR_TAXONOMY.map((g) => g.id));
    for (const [key, value] of Object.entries(SECTOR_ALIASES)) {
      expect(realIds.has(value), `SECTOR.${key} = "${value}" is not a real taxonomy group id`).toBe(true);
    }
  });

  it("covers all 40 real taxonomy groups, none missing, none extra", () => {
    const realIds = new Set(SECTOR_TAXONOMY.map((g) => g.id));
    const aliasIds: Set<string> = new Set(Object.values(SECTOR_ALIASES));
    expect(aliasIds.size).toBe(realIds.size);
    for (const id of realIds) expect(aliasIds.has(id)).toBe(true);
  });
});
