// Assembles one account's full onboarding detail for the drill-down view,
// reusing the read-only session queries. Read-only.

import { getSession, listSessions, listModuleData, listImportJobs } from "./sessions";
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
  onboardingUrl: string | null; // the link the customer used, when the token is present
  salesforceData: Record<string, unknown>;
  moduleSelections: WizardModuleData[]; // final per-module form data
  submitResults: ImportJob[]; // per-module submit results at Complete Setup
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Base URL of the onboarding wizard app. The link the customer opens is
// `${base}/setup?token=${access_token}` (see the onboarding app's README).
// Overridable via env in case the domain changes; defaults to production.
const ONBOARDING_APP_URL = process.env.ONBOARDING_APP_URL ?? "https://welcome.fieldpulse.com";

function onboardingUrlFor(accessToken: string | null): string | null {
  if (!accessToken) return null;
  return `${ONBOARDING_APP_URL.replace(/\/$/, "")}/setup?token=${encodeURIComponent(accessToken)}`;
}

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
    onboardingUrl: onboardingUrlFor(session.accessToken),
    salesforceData: session.salesforceData,
    moduleSelections,
    submitResults,
  };
}

// One row per onboarding link for the accounts list (read-only). Covers every
// session, not date-scoped; the table filters and searches client-side.
export interface AccountRow {
  id: string;
  companyId: string;
  companyName: string | null;
  status: WizardStatus;
  progress: number; // 0..1 fraction of this account's modules that are complete
  modulesComplete: number;
  modulesTotal: number;
  createdAt: Date;
}

export async function listAccountRows(): Promise<AccountRow[]> {
  const [sessions, moduleData] = await Promise.all([listSessions(), listModuleData()]);

  const agg = new Map<string, { total: number; complete: number }>();
  for (const m of moduleData) {
    const a = agg.get(m.sessionId) ?? { total: 0, complete: 0 };
    a.total += 1;
    if (m.isComplete) a.complete += 1;
    agg.set(m.sessionId, a);
  }

  return sessions.map((s) => {
    const a = agg.get(s.id);
    const name = s.salesforceData?.companyName;
    return {
      id: s.id,
      companyId: s.companyId,
      companyName: typeof name === "string" && name.trim() !== "" ? name : null,
      status: s.status,
      progress: a && a.total > 0 ? a.complete / a.total : 0,
      modulesComplete: a?.complete ?? 0,
      modulesTotal: a?.total ?? 0,
      createdAt: s.createdAt,
    };
  });
}
