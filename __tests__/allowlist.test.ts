import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAllowed } from "../lib/auth/allowlist";

describe("isAllowed", () => {
  const original = process.env.ALLOWED_EMAILS;

  beforeEach(() => {
    process.env.ALLOWED_EMAILS = "Alice@FieldPulse.com, bob@fieldpulse.com";
  });

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = original;
  });

  it("admits allowlisted emails, case-insensitively and trimmed", () => {
    expect(isAllowed("alice@fieldpulse.com")).toBe(true);
    expect(isAllowed("  BOB@fieldpulse.com  ")).toBe(true);
  });

  it("denies non-allowlisted emails", () => {
    expect(isAllowed("mallory@example.com")).toBe(false);
  });

  it("denies empty, null, and undefined", () => {
    expect(isAllowed("")).toBe(false);
    expect(isAllowed(null)).toBe(false);
    expect(isAllowed(undefined)).toBe(false);
  });

  it("denies everyone when the allowlist is empty", () => {
    process.env.ALLOWED_EMAILS = "";
    expect(isAllowed("alice@fieldpulse.com")).toBe(false);
  });
});
