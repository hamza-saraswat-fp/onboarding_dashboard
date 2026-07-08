import { describe, it, expect } from "vitest";
import { isAutoTestAccount } from "../lib/test-accounts";

describe("isAutoTestAccount", () => {
  it("matches 'test' followed by a number in name or id", () => {
    expect(isAutoTestAccount("123", "Test 20")).toBe(true);
    expect(isAutoTestAccount("123", "test20")).toBe(true);
    expect(isAutoTestAccount("123", "test-42")).toBe(true);
    expect(isAutoTestAccount("test-7", null)).toBe(true);
    expect(isAutoTestAccount("FP-TEST-3", null)).toBe(true);
  });

  it("does not match real names or bare 'test' without a number", () => {
    expect(isAutoTestAccount("110230", "National Contractors Inc.")).toBe(false);
    expect(isAutoTestAccount("123", "Testarossa 5")).toBe(false); // letters break the match
    expect(isAutoTestAccount("123", "Contest 9")).toBe(false); // word boundary: not a suffix of "contest"
    expect(isAutoTestAccount("123", "Latest 5")).toBe(false); // nor "latest"
    expect(isAutoTestAccount("123", "Latest news")).toBe(false); // "test" not followed by a number
    expect(isAutoTestAccount("123", null)).toBe(false);
  });
});
