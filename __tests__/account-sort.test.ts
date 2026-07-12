import { describe, it, expect } from "vitest";
import { companyIdSortValue } from "../lib/account-sort";

describe("companyIdSortValue", () => {
  it("returns the numeric id so ascending sort is oldest-first", () => {
    expect(companyIdSortValue("2130")).toBe(2130);
    expect(companyIdSortValue("189329")).toBe(189329);
    expect(companyIdSortValue("2130")).toBeLessThan(companyIdSortValue("189329"));
  });

  it("sinks non-numeric ids to the end", () => {
    expect(companyIdSortValue("FP-FIX-REALISTIC")).toBe(Number.POSITIVE_INFINITY);
    expect(companyIdSortValue("company-1")).toBe(Number.POSITIVE_INFINITY);
  });
});
