import { describe, it, expect } from "vitest";
import { isResolvedImportAccount } from "../lib/resolved-imports";

describe("isResolvedImportAccount", () => {
  it("matches the curated defaults", () => {
    expect(isResolvedImportAccount("189329")).toBe(true);
    expect(isResolvedImportAccount("197909")).toBe(true);
    expect(isResolvedImportAccount("198470")).toBe(true);
  });

  it("still flags accounts whose imports are not yet handled", () => {
    // These three failed their ClearPath import and are intentionally left
    // flagged until re-uploaded; do not add them here until they are fixed.
    expect(isResolvedImportAccount("195170")).toBe(false);
    expect(isResolvedImportAccount("195236")).toBe(false);
    expect(isResolvedImportAccount("198173")).toBe(false);
  });

  it("does not match other company ids", () => {
    expect(isResolvedImportAccount("196457")).toBe(false);
    expect(isResolvedImportAccount("")).toBe(false);
  });
});
