// Assembles one account's full onboarding detail for the drill-down view,
// reusing the read-only session queries. Read-only.

import { getSession, listModuleData, listImportJobs } from "./sessions";
import type { ImportJob, WizardModuleData, WizardStatus } from "../types";

export interface AccountDetail {
  sessionId: string;
  companyId: string;
  status: WizardStatus;
  currentModule: number;
  progress: number; // 0..1 fraction of this account's modules that are complete
  createdAt: Date;
  submittedAt: Date | null;
  expiresAt: Date;
  salesforceData: Record<string, unknown>;
  moduleSelections: WizardModuleData[]; // final per-module form data
  submitResults: ImportJob[]; // per-module submit results at Complete Setup
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAccountDetail(sessionId: string): Promise<AccountDetail | null> {
  // Guard malformed ids (a user-supplied URL segment) so a bad id returns
  // not-found instead of a Postgres uuid-cast error.
  if (!UUID_RE.test(sessionId)) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  const [moduleSelections, submitResults] = await Promise.all([
    listModuleData([sessionId]),
    listImportJobs([sessionId]),
  ]);

  const completeCount = moduleSelections.filter((m) => m.isComplete).length;
  const progress = moduleSelections.length > 0 ? completeCount / moduleSelections.length : 0;

  return {
    sessionId: session.id,
    companyId: session.companyId,
    status: session.status,
    currentModule: session.currentModule,
    progress,
    createdAt: session.createdAt,
    submittedAt: session.submittedAt,
    expiresAt: session.expiresAt,
    salesforceData: session.salesforceData,
    moduleSelections,
    submitResults,
  };
}
