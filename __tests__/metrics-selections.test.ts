import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "../lib/db";
import { listSessions, listModuleData } from "../lib/queries/sessions";
import { selectionDistribution, selectionCompletionCorrelation } from "../lib/metrics/selections";
import type { SelectionField, SelectionCorrelation } from "../lib/metrics/selections";
import type { WizardSession, WizardModuleData } from "../lib/types";

function optionCounts(dist: SelectionField[], moduleKey: string, field: string): Record<string, number> {
  const f = dist.find((d) => d.moduleKey === moduleKey && d.field === field);
  return Object.fromEntries((f?.options ?? []).map((o) => [o.value, o.count]));
}

function correlation(
  rows: SelectionCorrelation[],
  moduleKey: string,
  field: string,
  value: string,
): SelectionCorrelation | undefined {
  return rows.find((r) => r.moduleKey === moduleKey && r.field === field && r.value === value);
}

describe("selection metrics (against the seed)", () => {
  let sessions: WizardSession[];
  let moduleData: WizardModuleData[];

  beforeAll(async () => {
    sessions = await listSessions();
    moduleData = await listModuleData();
  });

  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("tallies company size with never-chosen options as zero", () => {
    const dist = selectionDistribution(moduleData);
    const sizes = optionCounts(dist, "generalInfo", "companySize");
    // Every generalInfo session picked 11-20; the other known sizes are zero.
    expect(sizes["11-20"]).toBe(8);
    expect(sizes["51+"]).toBe(0);
    expect(sizes["1-2"]).toBe(0);
    expect(Object.keys(sizes)).toHaveLength(7); // all known company sizes present
  });

  it("tallies array selections per element", () => {
    const dist = selectionDistribution(moduleData);

    const customerTypes = optionCounts(dist, "generalInfo", "customerTypes");
    expect(customerTypes).toEqual({ residential: 8, commercial: 0 });

    const workflows = optionCounts(dist, "jobs", "workflows");
    expect(workflows).toEqual({ service_call: 5, installation: 5, default: 0 });

    const tagSets = optionCounts(dist, "customers", "selectedTagSets");
    expect(tagSets).toEqual({ default: 7, residential: 7, commercial: 0, zones: 0 });
  });

  it("correlates selections with completion", () => {
    const rows = selectionCompletionCorrelation(sessions, moduleData);

    // jobs.workflows service_call chosen by 5 sessions, 3 of them completed.
    const serviceCall = correlation(rows, "jobs", "workflows", "service_call");
    expect(serviceCall).toMatchObject({ sessions: 5, completions: 3 });
    expect(serviceCall?.completionRate).toBe(0.6);

    // customerTypes residential chosen by all 8, 3 completed.
    const residential = correlation(rows, "generalInfo", "customerTypes", "residential");
    expect(residential).toMatchObject({ sessions: 8, completions: 3 });
    expect(residential?.completionRate).toBe(0.375);
  });
});

describe("selection metrics (defensive / empty)", () => {
  it("handles empty and malformed formData without throwing", () => {
    expect(selectionCompletionCorrelation([], [])).toEqual([]);

    const malformed: WizardModuleData[] = [
      { sessionId: "s1", moduleKey: "generalInfo", moduleNumber: 0, formData: {}, isComplete: true, savedAt: new Date() },
      // formData shapes that must not throw:
      { sessionId: "s2", moduleKey: "customers", moduleNumber: 1, formData: null as unknown as Record<string, unknown>, isComplete: false, savedAt: new Date() },
    ];
    // Only the known-option fields (all zero) should appear; no throw.
    const dist = selectionDistribution(malformed);
    const tagSets = optionCounts(dist, "customers", "selectedTagSets");
    expect(tagSets).toEqual({ default: 0, residential: 0, commercial: 0, zones: 0 });
  });
});
