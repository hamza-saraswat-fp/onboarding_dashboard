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

describe("isAllowed with a domain entry", () => {
  const original = process.env.ALLOWED_EMAILS;

  beforeEach(() => {
    process.env.ALLOWED_EMAILS = "@fieldpulse.com";
  });

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = original;
  });

  it("admits any address on the domain, case-insensitively and trimmed", () => {
    expect(isAllowed("anyone@fieldpulse.com")).toBe(true);
    expect(isAllowed("  Someone@FieldPulse.com  ")).toBe(true);
  });

  it("denies other domains", () => {
    expect(isAllowed("user@example.com")).toBe(false);
  });

  it("denies look-alike domains that merely end with the name", () => {
    expect(isAllowed("evil@notfieldpulse.com")).toBe(false);
  });

  it("denies subdomains (the entry matches the exact domain only)", () => {
    expect(isAllowed("user@team.fieldpulse.com")).toBe(false);
  });
});

describe("isAllowed with mixed domain and exact entries", () => {
  const original = process.env.ALLOWED_EMAILS;

  beforeEach(() => {
    process.env.ALLOWED_EMAILS = "@fieldpulse.com, contractor@gmail.com";
  });

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = original;
  });

  it("admits both the domain and the exact external email", () => {
    expect(isAllowed("anyone@fieldpulse.com")).toBe(true);
    expect(isAllowed("contractor@gmail.com")).toBe(true);
  });

  it("denies a different address on the exact entry's domain", () => {
    expect(isAllowed("someone-else@gmail.com")).toBe(false);
  });
});
