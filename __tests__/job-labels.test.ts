import { describe, it, expect } from "vitest";
import { failedJobLabels } from "../lib/job-labels";
import type { ImportJob } from "../lib/types";

function job(jobType: string, status: ImportJob["status"]): ImportJob {
  return { sessionId: "session-1", jobType, status, errorMessage: null, completedAt: null };
}

describe("failedJobLabels", () => {
  it("returns an empty list when nothing failed", () => {
    expect(failedJobLabels([])).toEqual([]);
    expect(failedJobLabels([job("company_settings", "success"), job("users", "skipped")])).toEqual([]);
  });

  it("labels a single failed job", () => {
    expect(failedJobLabels([job("clearpath_triggers", "failed")])).toEqual(["ClearPath triggers"]);
  });

  it("picks out only the failed jobs from a mixed set, in order", () => {
    const jobs = [
      job("company_settings", "success"),
      job("estimates_invoices", "failed"),
      job("users", "skipped"),
      job("clearpath_triggers", "failed"),
    ];
    expect(failedJobLabels(jobs)).toEqual(["Estimates and invoices", "ClearPath triggers"]);
  });

  it("falls back to the raw job type when it has no known label", () => {
    expect(failedJobLabels([job("some_new_job_type", "failed")])).toEqual(["some_new_job_type"]);
  });

  it("is independent of the account's own wizard status: it only looks at job rows", () => {
    // A "completed" account can still have a failed backend import; this function
    // takes only the job list, so it has no way to depend on the session status.
    expect(failedJobLabels([job("teams", "failed")])).toEqual(["Teams"]);
  });
});
