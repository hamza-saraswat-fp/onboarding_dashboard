// Human-readable labels for import_jobs.job_type, shared by the account detail
// view and the accounts list (which flags a row when one of these fails). Kept
// DB-free so client components can import it directly; see CLAUDE.md on why
// lib/queries/* values can't cross into the client bundle.
import type { ImportJob } from "./types";

export const JOB_LABELS: Record<string, string> = {
  company_settings: "Company settings",
  estimates_invoices: "Estimates and invoices",
  job_workflows: "Job workflows",
  job_statuses: "Job statuses",
  customer_tags: "Customer tags",
  communication_templates: "Communication templates",
  clearpath_triggers: "ClearPath triggers",
  custom_forms: "Custom forms",
  users: "Users",
  teams: "Teams",
};

// Labels of the import jobs that failed at Complete Setup, if any. An account
// can finish the wizard (status "completed") while one of its backend imports
// still failed, so this is intentionally independent of the account's overall
// status.
export function failedJobLabels(jobs: ImportJob[]): string[] {
  return jobs.filter((j) => j.status === "failed").map((j) => JOB_LABELS[j.jobType] ?? j.jobType);
}
