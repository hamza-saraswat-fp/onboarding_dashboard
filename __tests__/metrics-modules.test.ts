import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "../lib/db";
import { listSessions, listModuleData } from "../lib/queries/sessions";
import { moduleDropOff, avgTimePerModule } from "../lib/metrics/modules";
import type { WizardSession, WizardModuleData } from "../lib/types";

const HOUR_MS = 60 * 60 * 1000;

describe("module funnel metrics (against the seed)", () => {
  let sessions: WizardSession[];
  let moduleData: WizardModuleData[];

  beforeAll(async () => {
    sessions = await listSessions();
    moduleData = await listModuleData();
  });

  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("moduleDropOff reports reached vs completed per module, in sequence order", () => {
    const dropOff = moduleDropOff(sessions, moduleData).map((d) => ({
      moduleKey: d.moduleKey,
      reached: d.reached,
      completed: d.completed,
    }));

    expect(dropOff).toEqual([
      { moduleKey: "generalInfo", reached: 8, completed: 7 },
      { moduleKey: "customers", reached: 7, completed: 5 },
      { moduleKey: "jobs", reached: 5, completed: 5 },
      { moduleKey: "clearpath", reached: 5, completed: 4 },
      { moduleKey: "estimatesInvoices", reached: 4, completed: 4 },
      { moduleKey: "communications", reached: 4, completed: 4 },
      { moduleKey: "customForms", reached: 4, completed: 4 },
      { moduleKey: "userSetup", reached: 4, completed: 4 },
      { moduleKey: "teamsSetup", reached: 4, completed: 4 },
    ]);
  });

  it("moduleDropOff shares are fractions of total sessions", () => {
    const first = moduleDropOff(sessions, moduleData)[0];
    expect(first.reachedShare).toBe(1); // 8 / 8
    expect(first.completedShare).toBe(0.875); // 7 / 8
  });

  it("avgTimePerModule gives approximate dwell from savedAt gaps", () => {
    const dwell = avgTimePerModule(moduleData);
    const byKey = Object.fromEntries(dwell.map((d) => [d.moduleKey, d]));

    // generalInfo is the first saved module in every session, so it has no gap.
    expect(byKey.generalInfo.avgDwellMs).toBeNull();
    expect(byKey.generalInfo.sampleCount).toBe(0);

    // Seed saves are one hour apart, so every later module averages one hour.
    expect(byKey.customers.avgDwellMs).toBe(HOUR_MS);
    expect(byKey.customers.sampleCount).toBe(7);
    expect(byKey.teamsSetup.avgDwellMs).toBe(HOUR_MS);
    expect(byKey.teamsSetup.sampleCount).toBe(4);
  });
});

describe("module funnel metrics (zero input)", () => {
  it("returns empty arrays with no divide-by-zero", () => {
    expect(moduleDropOff([], [])).toEqual([]);
    expect(avgTimePerModule([])).toEqual([]);
  });
});
