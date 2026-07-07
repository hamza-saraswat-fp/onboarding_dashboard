import { describe, it, expect, afterAll } from "vitest";
import { sql } from "../lib/db";
import { getAccountDetail } from "../lib/queries/account";

// Session 1 is completed with all 9 modules complete and 3 successful jobs.
const SESSION_1 = "00000000-0000-0000-0000-000000000001";
const MISSING = "00000000-0000-0000-0000-0000000000ff";

describe("getAccountDetail", () => {
  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("assembles a seeded account", async () => {
    const account = await getAccountDetail(SESSION_1);
    expect(account).not.toBeNull();
    expect(account?.sessionId).toBe(SESSION_1);
    expect(account?.companyId).toBe("company-1");
    expect(account?.status).toBe("completed");
    expect(account?.progress).toBe(1);
    expect(account?.moduleSelections).toHaveLength(9);
    expect(account?.submitResults).toHaveLength(3);
    expect(account?.submitResults.every((r) => r.status === "success")).toBe(true);
    expect(account?.createdAt).toBeInstanceOf(Date);
    expect(account?.submittedAt).toBeInstanceOf(Date);
    expect(account?.salesforceData).toMatchObject({ salesSegment: "SMB" });
  });

  it("returns null for an unknown id", async () => {
    expect(await getAccountDetail(MISSING)).toBeNull();
  });

  it("returns null for a malformed id without hitting the database", async () => {
    expect(await getAccountDetail("not-a-uuid")).toBeNull();
  });
});
