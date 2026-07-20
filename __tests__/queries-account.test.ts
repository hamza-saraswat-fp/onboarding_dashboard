import { describe, it, expect, afterAll } from "vitest";
import { sql } from "../lib/db";
import {
  companyNameFrom,
  getAccountDetail,
  progressDenominator,
  salesforceAccountIdFrom,
  salesforceAccountUrl,
  wizardProgress,
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
    expect(account?.companyName).toBe("Acme HVAC");
    expect(account?.status).toBe("completed");
    expect(account?.progress).toBe(1);
    expect(account?.modulesTotal).toBe(9);
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

describe("wizardProgress", () => {
  it("is completed modules over total wizard steps, not modules reached", () => {
    // Finishing step 1 of a 6-step wizard reads ~17%, not 100%.
    expect(wizardProgress(1, 6)).toBeCloseTo(1 / 6);
    expect(wizardProgress(3, 9)).toBeCloseTo(1 / 3);
  });

  it("is 1 when every step is complete and 0 when none are", () => {
    expect(wizardProgress(6, 6)).toBe(1);
    expect(wizardProgress(0, 6)).toBe(0);
  });

  it("caps at 1 and guards a wizard with no steps", () => {
    expect(wizardProgress(7, 6)).toBe(1);
    expect(wizardProgress(3, 0)).toBe(0);
  });
});

describe("progressDenominator", () => {
  it("uses the account's own reached modules once it has submitted (gated modules never counted)", () => {
    // Busch Bros.: submitted, 7 modules reached (Users/Teams gated out by nue_gate)
    // even though the wizard can have 9. Denominator is 7, so 7 complete reads 100%.
    expect(progressDenominator(true, 7, 9)).toBe(7);
  });

  it("uses the full wizard length before an account has submitted", () => {
    // ProTech: in progress, reached only 1 of a 6-step wizard. Denominator is 6, so
    // 1 complete reads ~17%, not 100%.
    expect(progressDenominator(false, 1, 6)).toBe(6);
  });

  it("falls back to the wizard length when a submitted account has no modules", () => {
    expect(progressDenominator(true, 0, 6)).toBe(6);
  });
});

describe("companyNameFrom", () => {
  it("reads the companyName key from the blob", () => {
    expect(companyNameFrom({ companyName: "Acme HVAC" })).toBe("Acme HVAC");
  });

  it("returns null when the name is absent, blank, or not a string", () => {
    expect(companyNameFrom({})).toBeNull();
    expect(companyNameFrom({ companyName: "   " })).toBeNull();
    expect(companyNameFrom({ companyName: 123 })).toBeNull();
  });
});

describe("salesforceAccountIdFrom", () => {
  it("reads the live salesforceAccountId key from the blob", () => {
    expect(salesforceAccountIdFrom({ salesforceAccountId: "001U100000wLXneIAG" })).toBe("001U100000wLXneIAG");
  });

  it("falls back to the accountId key when salesforceAccountId is absent", () => {
    expect(salesforceAccountIdFrom({ accountId: "001U100000wLXneIAG" })).toBe("001U100000wLXneIAG");
  });

  it("prefers salesforceAccountId over accountId when both are present", () => {
    expect(
      salesforceAccountIdFrom({ salesforceAccountId: "001U100000aPzl8IAC", accountId: "001U100000wLXneIAG" }),
    ).toBe("001U100000aPzl8IAC");
  });

  it("accepts the 15-char form", () => {
    expect(salesforceAccountIdFrom({ salesforceAccountId: "001U100000wLXne" })).toBe("001U100000wLXne");
  });

  it("returns null when neither key is present", () => {
    expect(salesforceAccountIdFrom({ companyName: "B&B Glass Repair Plus, LLC" })).toBeNull();
  });

  it("rejects a value that is not a Salesforce Account id", () => {
    expect(salesforceAccountIdFrom({ salesforceAccountId: "192695" })).toBeNull();
    expect(salesforceAccountIdFrom({ salesforceAccountId: "003U100000wLXneIAG" })).toBeNull(); // Contact, not Account
    expect(salesforceAccountIdFrom({ salesforceAccountId: 12345 })).toBeNull();
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
