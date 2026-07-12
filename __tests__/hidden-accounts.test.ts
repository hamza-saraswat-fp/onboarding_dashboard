import { describe, it, expect, vi, afterEach } from "vitest";
import { isHiddenAccount } from "../lib/hidden-accounts";

describe("isHiddenAccount", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns false for an id that is not in the hidden list", () => {
    expect(isHiddenAccount("company-does-not-exist")).toBe(false);
  });

  it("hides ids from HIDDEN_COMPANY_IDS, trimming whitespace and blanks", async () => {
    vi.resetModules();
    vi.stubEnv("HIDDEN_COMPANY_IDS", " company-8 , 12345 ,");
    const { isHiddenAccount: fresh } = await import("../lib/hidden-accounts");
    expect(fresh("company-8")).toBe(true);
    expect(fresh("12345")).toBe(true);
    expect(fresh("company-1")).toBe(false);
  });
});
