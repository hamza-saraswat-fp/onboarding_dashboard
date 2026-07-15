import { describe, it, expect } from "vitest";
import { accountBucket } from "../lib/account-bucket";

describe("accountBucket", () => {
  it("classifies a plain active account as real", () => {
    expect(accountBucket({ hidden: false, test: false, status: "in_progress" })).toBe("real");
    expect(accountBucket({ hidden: false, test: false, status: "completed" })).toBe("real");
    expect(accountBucket({ hidden: false, test: false, status: "submission_failed" })).toBe("real");
  });

  it("classifies an expired-status account as expired when it is neither hidden nor test", () => {
    expect(accountBucket({ hidden: false, test: false, status: "expired" })).toBe("expired");
  });

  it("keeps an expired test account on the test shelf (test precedence over expired)", () => {
    // The rule Jaden called out: expiring links must never move a test account
    // off the test shelf.
    expect(accountBucket({ hidden: false, test: true, status: "expired" })).toBe("test");
  });

  it("keeps a test account on the test shelf regardless of status", () => {
    expect(accountBucket({ hidden: false, test: true, status: "in_progress" })).toBe("test");
    expect(accountBucket({ hidden: false, test: true, status: "completed" })).toBe("test");
  });

  it("puts hidden first, above test and expired", () => {
    expect(accountBucket({ hidden: true, test: false, status: "in_progress" })).toBe("hidden");
    expect(accountBucket({ hidden: true, test: true, status: "expired" })).toBe("hidden");
    expect(accountBucket({ hidden: true, test: false, status: "expired" })).toBe("hidden");
  });
});
