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
  startedSessionIds,
  startedCount,
  startRate,
  completionRateOfStarted,
  avgProgressOfStarted,
  timeToCompleteActive,
  importSuccessRate,
  trendPoint,
} from "../lib/metrics/summary";
import type { WizardSession, WizardStatus, WizardModuleData } from "../lib/types";

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

  it("first steps started: every seeded session started, so start rate is 100%", () => {
    const startedIds = startedSessionIds(sessions, moduleData);
    expect(startedCount(sessions, startedIds)).toBe(8);
    expect(startRate(sessions, startedIds)).toBe(1); // every seeded session saved an answer
    // completed / started == 3 / 8; equals the generated-based rate here only
    // because start rate is 100% (the seed has no never-started link).
    expect(completionRateOfStarted(sessions, startedIds)).toBe(0.375);
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

describe("first steps started metrics (inline fixtures)", () => {
  function mkSession(id: string, status: WizardStatus): WizardSession {
    return {
      id,
      companyId: id,
      accessToken: null,
      salesforceData: {},
      currentModule: 0,
      status,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      submittedAt: status === "completed" ? new Date("2026-06-02T00:00:00.000Z") : null,
      expiresAt: new Date("2026-06-15T00:00:00.000Z"),
    };
  }

  function mkModule(sessionId: string, formData: Record<string, unknown>): WizardModuleData {
    return {
      sessionId,
      moduleKey: "generalInfo",
      moduleNumber: 0,
      formData,
      isComplete: false,
      savedAt: new Date("2026-06-01T01:00:00.000Z"),
    };
  }

  it("counts a saved answer, excludes never-started and empty-answer sessions", () => {
    const sessions = [
      mkSession("answered", "in_progress"),
      mkSession("never", "in_progress"),
      mkSession("empty", "in_progress"),
    ];
    const moduleData = [mkModule("answered", { companySize: "1-2" }), mkModule("empty", {})];
    expect(startedSessionIds(sessions, moduleData)).toEqual(new Set(["answered"]));
  });

  it("treats a completed session as started even with no module rows", () => {
    const sessions = [mkSession("done", "completed")];
    const startedIds = startedSessionIds(sessions, []);
    expect(startedIds.has("done")).toBe(true);
    // completions can never exceed started, so the rate stays at most 1.
    expect(completionRateOfStarted(sessions, startedIds)).toBe(1);
  });

  it("computes started count, start rate, and completion rate of started", () => {
    const sessions = [
      mkSession("c1", "completed"),
      mkSession("c2", "completed"),
      mkSession("p1", "in_progress"),
      mkSession("p2", "in_progress"),
      mkSession("never", "in_progress"),
    ];
    const moduleData = [
      mkModule("c1", { companySize: "1-2" }),
      mkModule("c2", { companySize: "3-5" }),
      mkModule("p1", { companySize: "6-10" }),
      mkModule("p2", { companySize: "11-20" }),
    ];
    const startedIds = startedSessionIds(sessions, moduleData);
    expect(startedCount(sessions, startedIds)).toBe(4); // all but "never"
    expect(startRate(sessions, startedIds)).toBe(0.8); // 4 / 5
    expect(completionRateOfStarted(sessions, startedIds)).toBe(0.5); // 2 completed / 4 started
  });

  it("returns zero rates with no divide-by-zero when nobody started", () => {
    expect(startRate([], new Set())).toBe(0);
    expect(completionRateOfStarted([], new Set())).toBe(0);

    const sessions = [mkSession("never", "in_progress")];
    const startedIds = startedSessionIds(sessions, []);
    expect(startedCount(sessions, startedIds)).toBe(0);
    expect(startRate(sessions, startedIds)).toBe(0);
    expect(completionRateOfStarted(sessions, startedIds)).toBe(0);
  });
});

describe("reworked headline metrics", () => {
  function session(id: string, status: WizardStatus, opts: Partial<WizardSession> = {}): WizardSession {
    return {
      id,
      companyId: id,
      accessToken: null,
      salesforceData: {},
      currentModule: 0,
      status,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      submittedAt: null,
      expiresAt: new Date("2026-06-30T00:00:00.000Z"),
      ...opts,
    };
  }
  function moduleRow(sessionId: string, moduleNumber: number, isComplete: boolean, savedAt: string): WizardModuleData {
    return { sessionId, moduleKey: `m${moduleNumber}`, moduleNumber, formData: { a: 1 }, isComplete, savedAt: new Date(savedAt) };
  }
  const HOUR = 60 * 60 * 1000;

  it("avgProgressOfStarted averages completed steps over total steps, for starters only", () => {
    const sessions = [session("c1", "completed"), session("p1", "in_progress"), session("never", "in_progress")];
    const moduleData = [
      moduleRow("c1", 0, true, "2026-06-01T01:00:00.000Z"),
      moduleRow("c1", 1, true, "2026-06-01T02:00:00.000Z"),
      moduleRow("c1", 2, true, "2026-06-01T03:00:00.000Z"),
      moduleRow("p1", 0, true, "2026-06-01T01:00:00.000Z"),
    ];
    const startedIds = startedSessionIds(sessions, moduleData);
    // totalSteps 4: c1 = 3/4, p1 = 1/4, "never" excluded -> mean (0.75 + 0.25) / 2 = 0.5
    expect(avgProgressOfStarted(sessions, moduleData, startedIds, 4)).toBe(0.5);
  });

  it("avgProgressOfStarted is 0 with no starters or no steps", () => {
    const none = [session("never", "in_progress")];
    expect(avgProgressOfStarted(none, [], startedSessionIds(none, []), 9)).toBe(0);
    const one = [session("c1", "completed")];
    expect(avgProgressOfStarted(one, [], startedSessionIds(one, []), 0)).toBe(0);
  });

  it("timeToCompleteActive measures first activity to submission over completed sessions", () => {
    const sessions = [
      session("c1", "completed", { submittedAt: new Date("2026-06-01T05:00:00.000Z") }),
      session("c2", "completed", { submittedAt: new Date("2026-06-01T07:00:00.000Z") }),
      session("p1", "in_progress"),
    ];
    const moduleData = [
      moduleRow("c1", 0, true, "2026-06-01T02:00:00.000Z"), // 02:00 -> 05:00 = 3h
      moduleRow("c2", 0, true, "2026-06-01T01:00:00.000Z"), // 01:00 -> 07:00 = 6h
      moduleRow("p1", 0, false, "2026-06-01T00:30:00.000Z"),
    ];
    expect(timeToCompleteActive(sessions, moduleData)).toEqual({ meanMs: 4.5 * HOUR, medianMs: 4.5 * HOUR });
  });

  it("timeToCompleteActive is null when no completed session has activity", () => {
    const sessions = [session("c1", "completed", { submittedAt: new Date("2026-06-01T05:00:00.000Z") })];
    expect(timeToCompleteActive(sessions, [])).toBeNull(); // completed but no module rows
    expect(timeToCompleteActive([], [])).toBeNull();
  });

  it("importSuccessRate is completed over completed-plus-failed submissions", () => {
    const sessions = [
      session("c1", "completed"),
      session("c2", "completed"),
      session("c3", "completed"),
      session("f1", "submission_failed"),
      session("p1", "in_progress"),
      session("e1", "expired"),
    ];
    expect(importSuccessRate(sessions)).toBe(0.75); // 3 / (3 + 1)
  });

  it("importSuccessRate is null when nothing reached submission", () => {
    expect(importSuccessRate([session("p1", "in_progress")])).toBeNull();
    expect(importSuccessRate([])).toBeNull();
  });

  it("trendPoint reports avg time on the first-activity basis, matching the headline tile", () => {
    const sessions = [
      session("c1", "completed", {
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        submittedAt: new Date("2026-06-01T05:00:00.000Z"),
      }),
      session("p1", "in_progress"),
    ];
    const moduleData = [
      moduleRow("c1", 0, true, "2026-06-01T02:00:00.000Z"), // first activity 02:00 -> submit 05:00 = 3h
      moduleRow("p1", 0, false, "2026-06-01T00:30:00.000Z"),
    ];
    const startedIds = startedSessionIds(sessions, moduleData);
    const point = trendPoint("2026-W22", sessions, moduleData, startedIds);
    // 3h active window, not the 5h createdAt -> submit window the old basis reported.
    expect(point.avgTimeToCompleteMs).toBe(3 * HOUR);
    expect(point.volume).toBe(2);
    expect(point.started).toBe(2);
    expect(point.completions).toBe(1);
    expect(point.completionRate).toBe(0.5);
    expect(point.dropOffRate).toBe(0.5);
  });

  it("trendPoint leaves avg time null when no completed session has activity", () => {
    const sessions = [session("p1", "in_progress"), session("c1", "completed", { submittedAt: new Date("2026-06-01T05:00:00.000Z") })];
    const startedIds = startedSessionIds(sessions, []);
    const point = trendPoint("2026-W22", sessions, [], startedIds);
    expect(point.avgTimeToCompleteMs).toBeNull();
    expect(point.completions).toBe(1);
  });
});
