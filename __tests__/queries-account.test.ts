import { describe, it, expect, afterAll } from "vitest";
import { sql } from "../lib/db";
import {
  getAccountDetail,
  salesforceAccountIdFrom,
  salesforceAccountUrl,
} from "../lib/queries/account";

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

describe("salesforceAccountIdFrom", () => {
  it("reads a well-formed 18-char Account id from the blob", () => {
    expect(salesforceAccountIdFrom({ accountId: "001U100000wLXneIAG" })).toBe("001U100000wLXneIAG");
  });

  it("accepts the 15-char form", () => {
    expect(salesforceAccountIdFrom({ accountId: "001U100000wLXne" })).toBe("001U100000wLXne");
  });

  it("returns null when the key is absent (every live row today)", () => {
    expect(salesforceAccountIdFrom({ companyName: "B&B Glass Repair Plus, LLC" })).toBeNull();
  });

  it("rejects a value that is not a Salesforce Account id", () => {
    expect(salesforceAccountIdFrom({ accountId: "192695" })).toBeNull();
    expect(salesforceAccountIdFrom({ accountId: "003U100000wLXneIAG" })).toBeNull(); // Contact, not Account
    expect(salesforceAccountIdFrom({ accountId: 12345 })).toBeNull();
  });
});

describe("salesforceAccountUrl", () => {
  it("builds a Lightning record URL for a valid id", () => {
    expect(salesforceAccountUrl("001U100000wLXneIAG")).toBe(
      "https://fieldpulse.lightning.force.com/lightning/r/Account/001U100000wLXneIAG/view",
    );
  });

  it("returns null for a null id", () => {
    expect(salesforceAccountUrl(null)).toBeNull();
  });
});
