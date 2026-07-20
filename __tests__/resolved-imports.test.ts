import { describe, it, expect } from "vitest";
import { isResolvedImportAccount } from "../lib/resolved-imports";

describe("isResolvedImportAccount", () => {
  it("matches the curated defaults", () => {
    expect(isResolvedImportAccount("189329")).toBe(true);
    expect(isResolvedImportAccount("195170")).toBe(true);
    expect(isResolvedImportAccount("195236")).toBe(true);
    expect(isResolvedImportAccount("198173")).toBe(true);
    expect(isResolvedImportAccount("198470")).toBe(true);
  });

  it("does not match other company ids", () => {
    expect(isResolvedImportAccount("196457")).toBe(false);
    expect(isResolvedImportAccount("")).toBe(false);
  });
});
