import { describe, it, expect } from "vitest";
import { displayStatus } from "../lib/display-status";

describe("displayStatus", () => {
  it("reads an in-progress account at 0% as not_started", () => {
    expect(displayStatus("in_progress", 0)).toBe("not_started");
  });

  it("keeps an in-progress account with any progress as in_progress", () => {
    expect(displayStatus("in_progress", 0.01)).toBe("in_progress");
    expect(displayStatus("in_progress", 0.5)).toBe("in_progress");
    expect(displayStatus("in_progress", 1)).toBe("in_progress");
  });

  it("passes every other status through unchanged, even at 0%", () => {
    expect(displayStatus("completed", 1)).toBe("completed");
    expect(displayStatus("completed", 0)).toBe("completed");
    expect(displayStatus("submission_failed", 0)).toBe("submission_failed");
    expect(displayStatus("expired", 0)).toBe("expired");
  });
});
