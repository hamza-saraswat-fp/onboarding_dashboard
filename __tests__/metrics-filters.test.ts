import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "../lib/db";
import { listSessions } from "../lib/queries/sessions";
import { filterByDateRange, bucketByWeek, bucketByMonth, groupByDimension } from "../lib/metrics/filters";
import type { WizardSession } from "../lib/types";

describe("filter and segmentation helpers (against the seed)", () => {
  let sessions: WizardSession[];

  beforeAll(async () => {
    sessions = await listSessions();
  });

  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("filterByDateRange keeps sessions created within the range, inclusive", () => {
    const from = new Date("2026-06-01T00:00:00Z");
    const to = new Date("2026-06-03T23:59:59Z");
    const filtered = filterByDateRange(sessions, from, to);
    expect(filtered).toHaveLength(3); // created Jun 1, 2, 3
    expect(filtered.every((s) => s.createdAt >= from && s.createdAt <= to)).toBe(true);
  });

  it("bucketByWeek groups by ISO week in chronological order", () => {
    const weeks = bucketByWeek(sessions).map((b) => ({ key: b.key, count: b.sessions.length }));
    expect(weeks).toEqual([
      { key: "2026-04-27", count: 1 }, // S7 (May 1)
      { key: "2026-06-01", count: 3 }, // S1, S2, S3
      { key: "2026-06-08", count: 4 }, // S4, S5, S6, S8
    ]);
  });

  it("bucketByMonth groups by calendar month", () => {
    const months = bucketByMonth(sessions).map((b) => ({ key: b.key, count: b.sessions.length }));
    expect(months).toEqual([
      { key: "2026-05", count: 1 },
      { key: "2026-06", count: 7 },
    ]);
  });

  it("groupByDimension buckets by a Salesforce dimension", () => {
    const bySegment = groupByDimension(sessions, "salesSegment");
    const counts = Object.fromEntries(Object.entries(bySegment).map(([k, v]) => [k, v.length]));
    expect(counts).toEqual({ SMB: 4, "Mid-Market": 2, Enterprise: 2 });
  });
});

describe("segmentation helpers (defensive)", () => {
  it("puts sessions with a missing dimension under Unspecified", () => {
    const base = {
      currentModule: 0,
      status: "in_progress" as const,
      createdAt: new Date("2026-06-01T00:00:00Z"),
      submittedAt: null,
      expiresAt: new Date("2026-06-15T00:00:00Z"),
    };
    const sessions: WizardSession[] = [
      { id: "a", companyId: "c-a", salesforceData: { industry: "HVAC" }, ...base },
      { id: "b", companyId: "c-b", salesforceData: {}, ...base },
    ];
    const byIndustry = groupByDimension(sessions, "industry");
    const counts = Object.fromEntries(Object.entries(byIndustry).map(([k, v]) => [k, v.length]));
    expect(counts).toEqual({ HVAC: 1, Unspecified: 1 });
  });
});
