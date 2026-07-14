import { describe, it, expect } from "vitest";
import { isTestAccount } from "../lib/test-accounts";

describe("isTestAccount", () => {
  it("matches the word 'test' (in any form) or 'e2e' in name or id", () => {
    expect(isTestAccount("123", "Test 20")).toBe(true);
    expect(isTestAccount("123", "test20")).toBe(true);
    expect(isTestAccount("123123", "test")).toBe(true);
    expect(isTestAccount("123", "Local Test Co")).toBe(true);
    expect(isTestAccount("123", "Fieldpulse Test Customer")).toBe(true);
    expect(isTestAccount("123", "Test company name")).toBe(true);
    expect(isTestAccount("FP-BRK958-E2E", "BRK-958 E2E Test Co")).toBe(true);
    expect(isTestAccount("test-7", null)).toBe(true);
  });

  it("does not match real names where 'test' is only a suffix", () => {
    expect(isTestAccount("110230", "National Contractors Inc.")).toBe(false);
    expect(isTestAccount("123", "Contest 9")).toBe(false); // not a word starting with test
    expect(isTestAccount("123", "Latest 5")).toBe(false);
    expect(isTestAccount("123", null)).toBe(false);
    expect(isTestAccount("110230", "FP Plumbing")).toBe(false); // "FP" alone is not a probe prefix
  });

  it("matches ids in the override list (names the heuristic can't catch)", () => {
    // "Teset 137" is a misspelling of Test; caught by the id override.
    expect(isTestAccount("85273", "Teset 137")).toBe(true);
    // Links minted with an empty salesforce_data blob carry no name at all, so
    // only the id can catch them.
    expect(isTestAccount("15359", null)).toBe(true);
    expect(isTestAccount("151589", null)).toBe(true);
    // Internal account: an ordinary-looking name the heuristic would never match,
    // so the id override has to win regardless of the name.
    expect(isTestAccount("83425", "Ordinary Company Name")).toBe(true);
  });

  it("matches the internal FP-PROBE / FP-FIX probe and fixture accounts", () => {
    expect(isTestAccount("FP-PROBE-SF-FIELDNAME", null)).toBe(true);
    expect(isTestAccount("FP-PROBE-VELOCITY-1", null)).toBe(true);
    expect(isTestAccount("FP-FIX-NULL-EMAIL", null)).toBe(true);
    // realistic company name but a probe id: the id still matches.
    expect(isTestAccount("FP-FIX-REALISTIC", "Acme Plumbing")).toBe(true);
  });
});
