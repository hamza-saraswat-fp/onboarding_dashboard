import { describe, it, expect, afterAll } from "vitest";
import { sql } from "../lib/db";
import { listSessions, getSession, listModuleData, listImportJobs } from "../lib/queries/sessions";
import { SEED_COUNTS } from "../db/seed";

// Known seed identifiers (see db/seed.ts). Session 1 is a completed session
// with all 9 modules and 3 import jobs.
const SESSION_1 = "00000000-0000-0000-0000-000000000001";
const MISSING = "00000000-0000-0000-0000-0000000000ff";

describe("session queries", () => {
  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("listSessions returns every seeded session", async () => {
    const sessions = await listSessions();
    expect(sessions).toHaveLength(SEED_COUNTS.sessions);
  });

  it("getSession returns a fully mapped row", async () => {
    const session = await getSession(SESSION_1);
    expect(session).not.toBeNull();
    expect(session?.id).toBe(SESSION_1);
    expect(session?.companyId).toBe("company-1");
    expect(session?.status).toBe("completed");
    expect(session?.currentModule).toBe(8);
    expect(session?.salesforceData).toMatchObject({ sales_segment: "SMB", industry: "HVAC" });
    expect(session?.createdAt).toBeInstanceOf(Date);
    expect(session?.submittedAt).toBeInstanceOf(Date);
    expect(session?.expiresAt).toBeInstanceOf(Date);
  });

  it("getSession returns null for an unknown id", async () => {
    expect(await getSession(MISSING)).toBeNull();
  });

  it("listModuleData returns all rows, or filters by session", async () => {
    const all = await listModuleData();
    expect(all).toHaveLength(SEED_COUNTS.moduleData);

    const forSession1 = await listModuleData([SESSION_1]);
    expect(forSession1).toHaveLength(9);
    expect(forSession1.every((m) => m.sessionId === SESSION_1)).toBe(true);
    const generalInfo = forSession1.find((m) => m.moduleKey === "generalInfo");
    expect(generalInfo?.isComplete).toBe(true);
    expect(generalInfo?.savedAt).toBeInstanceOf(Date);
  });

  it("listImportJobs returns all rows, or filters by session", async () => {
    const all = await listImportJobs();
    expect(all).toHaveLength(SEED_COUNTS.importJobs);

    const forSession1 = await listImportJobs([SESSION_1]);
    expect(forSession1).toHaveLength(3);
    expect(forSession1.every((j) => j.sessionId === SESSION_1)).toBe(true);
    expect(forSession1.every((j) => j.status === "success")).toBe(true);
  });
});
