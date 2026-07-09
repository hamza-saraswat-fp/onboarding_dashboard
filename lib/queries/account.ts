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

// Base URL of the FieldPulse Salesforce (Lightning) org. Overridable via env in
// case the org domain changes; defaults to production.
const SALESFORCE_BASE_URL = process.env.SALESFORCE_BASE_URL ?? "https://fieldpulse.lightning.force.com";

// A Salesforce Account record id: "001" plus 12 (15-char) or 15 (18-char) chars.
const SALESFORCE_ACCOUNT_ID_RE = /^001[A-Za-z0-9]{12,15}$/;

// Pulls the Salesforce Account record id out of the opaque salesforceData blob,
// if present and well-formed. As of 2026-07 the upstream Closed-Won automation
// does NOT write this key, so this returns null for every live row today; the
// moment Salesforce starts including `accountId` in the blob, the "View in
// Salesforce" link lights up with no dashboard change. See the onboarding app:
// salesforceData is pass-through jsonb minted by Salesforce, not the app.
export function salesforceAccountIdFrom(salesforceData: Record<string, unknown>): string | null {
  const raw = salesforceData?.accountId;
  return typeof raw === "string" && SALESFORCE_ACCOUNT_ID_RE.test(raw) ? raw : null;
}

// The Salesforce Lightning URL for one Account record, or null when the id is
// absent/malformed.
export function salesforceAccountUrl(accountId: string | null): string | null {
  if (!accountId) return null;
  return `${SALESFORCE_BASE_URL.replace(/\/$/, "")}/lightning/r/Account/${accountId}/view`;
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

// One row per onboarding link for the accounts list (read-only). The row data is
// built on the summary page from the sessions it already loads; this type is the
// shared shape.
export interface AccountRow {
  id: string;
  companyId: string;
  companyName: string | null;
  status: WizardStatus;
  progress: number; // 0..1 fraction of this account's modules that are complete
  modulesComplete: number;
  modulesTotal: number;
  createdAt: Date;
  salesforceUrl: string | null; // Lightning link to the Account, when the id is captured
}
