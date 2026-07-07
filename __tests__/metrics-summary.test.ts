import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "../lib/db";
import { listSessions, listModuleData } from "../lib/queries/sessions";
import {
  totalLinks,
  totalCompletions,
  completionRate,
  avgProgress,
  timeToComplete,
  lifecycleBreakdown,
} from "../lib/metrics/summary";
import type { WizardSession, WizardModuleData } from "../lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("summary metrics (against the seed)", () => {
  let sessions: WizardSession[];
  let moduleData: WizardModuleData[];

  beforeAll(async () => {
    sessions = await listSessions();
    moduleData = await listModuleData();
  });

  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("totals and completion rate", () => {
    expect(totalLinks(sessions)).toBe(8);
    expect(totalCompletions(sessions)).toBe(3);
    expect(completionRate(sessions)).toBe(0.375); // 3 / 8
  });

  it("average progress is the mean of per-session completed fractions", () => {
    // 100,100,100,75,50,0,50,100 percent -> mean 0.71875
    expect(avgProgress(sessions, moduleData)).toBe(0.71875);
  });

  it("time to complete is mean and median over completed sessions", () => {
    // completed deltas: 1, 2, 3 days -> mean 2 days, median 2 days
    expect(timeToComplete(sessions)).toEqual({ meanMs: 2 * DAY_MS, medianMs: 2 * DAY_MS });
  });

  it("lifecycle breakdown counts every status", () => {
    expect(lifecycleBreakdown(sessions)).toEqual({
      in_progress: 3,
      completed: 3,
      expired: 1,
      submission_failed: 1,
    });
  });
});

describe("summary metrics (zero input)", () => {
  it("returns zeros and null with no divide-by-zero", () => {
    expect(totalLinks([])).toBe(0);
    expect(totalCompletions([])).toBe(0);
    expect(completionRate([])).toBe(0);
    expect(avgProgress([], [])).toBe(0);
    expect(timeToComplete([])).toBeNull();
    expect(lifecycleBreakdown([])).toEqual({
      in_progress: 0,
      completed: 0,
      expired: 0,
      submission_failed: 0,
    });
  });
});
