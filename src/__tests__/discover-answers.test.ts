import { describe, it, expect } from "vitest";
import { flattenAnswers, questionFlow } from "@/lib/discover/answers";
import { rankDirections } from "@/lib/discover/engine";
import { SECTOR } from "@/lib/discover/sectors";

describe("Discover answers -> tags flattening", () => {
  it("flattens a simple single-select answer into its tag", () => {
    const { tags } = flattenAnswers({ q2_time: ["full"] });
    expect(tags).toEqual(["TIME_FULL"]);
  });

  it("Q26 answers go to preferences, never tags", () => {
    const { tags, preferences } = flattenAnswers({ q26_priorities: ["helping_people", "low_cost"] });
    expect(tags).toEqual([]);
    expect(preferences).toEqual(["HELPING_PEOPLE", "LOW_STARTING_COSTS"]);
  });

  it("Q7 vehicle follow-up answers flatten correctly and feed the engine", () => {
    const { tags } = flattenAnswers({
      q7_resources: ["vehicle"],
      q7_vehicle_type: ["truck"],
    });
    expect(tags).toContain("VEHICLE_TRUCK");
    const result = rankDirections({ tags, hardExclusions: [] });
    expect(result.map((c) => c.sectorId)).toContain(SECTOR.TRANSPORTATION);
  });

  it("Q8B only enters the flow when 'customers' selected in Q8A", () => {
    const withCustomers = questionFlow({ q8a_networks: ["customers"] });
    expect(withCustomers.some((q) => q.id === "q8b_customer_type")).toBe(true);

    const withoutCustomers = questionFlow({ q8a_networks: ["family_business"] });
    expect(withoutCustomers.some((q) => q.id === "q8b_customer_type")).toBe(false);
  });

  it("end-to-end: commercial machinery experience + workshop access -> Transportation, Commercial experience, 2 independent signals", () => {
    const { tags } = flattenAnswers({
      q13_machinery: ["commercial", "sub_vehicle_repair"],
      q7_resources: ["workshop"],
    });
    const result = rankDirections({ tags, hardExclusions: [] });
    const transport = result.find((c) => c.sectorId === SECTOR.TRANSPORTATION);
    expect(transport?.strongestEvidenceClass).toBe("COMMERCIAL_EXPERIENCE");
    expect(transport?.independentSignalCount).toBeGreaterThanOrEqual(2);
  });
});
