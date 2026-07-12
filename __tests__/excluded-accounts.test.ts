import { describe, it, expect, vi, afterEach } from "vitest";
import { isExcludedAccount } from "../lib/excluded-accounts";

describe("isExcludedAccount", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns false for an id that is not in the excluded list", () => {
    expect(isExcludedAccount("company-does-not-exist")).toBe(false);
  });

  it("excludes ids from EXCLUDED_COMPANY_IDS, trimming whitespace and blanks", async () => {
    vi.resetModules();
    vi.stubEnv("EXCLUDED_COMPANY_IDS", " company-8 , 12345 ,");
    const { isExcludedAccount: fresh } = await import("../lib/excluded-accounts");
    expect(fresh("company-8")).toBe(true);
    expect(fresh("12345")).toBe(true);
    expect(fresh("company-1")).toBe(false);
  });
});
