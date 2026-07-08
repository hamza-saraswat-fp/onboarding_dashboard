import { describe, it, expect } from "vitest";
import { verifyBasicAuth } from "../lib/auth/basic-auth";

const header = (user: string, password: string) => `Basic ${btoa(`${user}:${password}`)}`;

describe("verifyBasicAuth", () => {
  it("accepts the correct credentials", () => {
    expect(verifyBasicAuth(header("admin", "s3cret"), "admin", "s3cret")).toBe(true);
  });

  it("accepts a password containing a colon", () => {
    expect(verifyBasicAuth(header("admin", "a:b:c"), "admin", "a:b:c")).toBe(true);
  });

  it("rejects a wrong user or password", () => {
    expect(verifyBasicAuth(header("admin", "nope"), "admin", "s3cret")).toBe(false);
    expect(verifyBasicAuth(header("mallory", "s3cret"), "admin", "s3cret")).toBe(false);
  });

  it("rejects missing or malformed headers", () => {
    expect(verifyBasicAuth(null, "admin", "s3cret")).toBe(false);
    expect(verifyBasicAuth("Bearer token", "admin", "s3cret")).toBe(false);
  });

  it("denies when credentials are not configured", () => {
    expect(verifyBasicAuth(header("admin", "s3cret"), undefined, undefined)).toBe(false);
    expect(verifyBasicAuth(header("admin", "s3cret"), "admin", "")).toBe(false);
  });
});
