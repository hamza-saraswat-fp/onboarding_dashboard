// Typed row shapes for the three tables the dashboard reads. These are the
// read-model the queries and metrics build on; they intentionally expose only
// the columns the dashboard needs, not the full production schema.

export type WizardStatus = "in_progress" | "completed" | "expired" | "submission_failed";

export type ImportJobStatus = "queued" | "in_progress" | "success" | "failed" | "skipped";

export interface WizardSession {
  id: string;
  companyId: string;
  salesforceData: Record<string, unknown>;
  currentModule: number;
  status: WizardStatus;
  createdAt: Date;
  submittedAt: Date | null;
  expiresAt: Date;
}

export interface WizardModuleData {
  sessionId: string;
  moduleKey: string;
  moduleNumber: number;
  formData: Record<string, unknown>;
  isComplete: boolean;
  savedAt: Date;
}

export interface ImportJob {
  sessionId: string;
  jobType: string;
  status: ImportJobStatus;
  errorMessage: string | null;
  completedAt: Date | null;
}
