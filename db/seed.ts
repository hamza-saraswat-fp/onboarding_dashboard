// Deterministic synthetic seed for the local test database.
//
// seed(sql) applies db/schema.sql (a vanilla-Postgres materialization of the
// three tables the dashboard reads; see that file and db/reference-migrations/)
// and then inserts a fixed dataset. Everything here is deterministic: fixed
// UUIDs and fixed timestamps, no random values and no wall-clock reads, so
// metric tests in later issues can assert exact numbers.
//
// Expected seed totals (documented for humans; SEED_COUNTS below derives these
// from the arrays so the numbers and the data can never drift apart):
//   wizard_sessions    : 8   (completed 3, in_progress 3, expired 1, submission_failed 1)
//   wizard_module_data : 45  (is_complete true 41, false 4)
//   import_jobs        : 10  (success 8, failed 1, skipped 1)

import { readFileSync } from "node:fs";
import { join } from "node:path";

type Sql = ReturnType<typeof import("postgres")>;

type WizardStatus = "in_progress" | "completed" | "expired" | "submission_failed";
type JobStatus = "queued" | "in_progress" | "success" | "failed" | "skipped";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

interface SeedSession {
  id: string;
  companyId: string;
  accessToken: string | null;
  salesforceData: JsonObject;
  currentModule: number;
  customFormsEnabled: boolean;
  status: WizardStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

interface SeedModule {
  id: string;
  sessionId: string;
  moduleNumber: number;
  moduleKey: string;
  formData: JsonObject;
  isComplete: boolean;
  savedAt: string;
}

interface SeedJob {
  id: string;
  sessionId: string;
  jobType: string;
  status: JobStatus;
  payload: JsonObject;
  responseData: JsonObject | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

function uuid(n: number): string {
  return `00000000-0000-0000-0000-${n.toString().padStart(12, "0")}`;
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

// ---------------------------------------------------------------------------
// Sessions: all four lifecycle statuses. Completed sessions have submitted_at
// set with known time-to-complete deltas (1, 2, 3 days -> mean 2d, median 2d).
// ---------------------------------------------------------------------------

const SESSIONS: SeedSession[] = [
  {
    id: uuid(1),
    companyId: "company-1",
    accessToken: "seed-token-01",
    salesforceData: { companyName: "Acme HVAC", primaryContactFirstName: "Ada Lin", salesSegment: "SMB", industry: "HVAC", numberOfEmployees: "11-20" },
    currentModule: 8,
    customFormsEnabled: true,
    status: "completed",
    expiresAt: "2026-06-15T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-02T09:00:00.000Z",
    submittedAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: uuid(2),
    companyId: "company-2",
    accessToken: "seed-token-02",
    salesforceData: { companyName: "Blue Pipe", primaryContactFirstName: "Ben Ito", salesSegment: "Mid-Market", industry: "Plumbing", numberOfEmployees: "21-30" },
    currentModule: 8,
    customFormsEnabled: true,
    status: "completed",
    expiresAt: "2026-06-16T09:00:00.000Z",
    createdAt: "2026-06-02T09:00:00.000Z",
    updatedAt: "2026-06-04T09:00:00.000Z",
    submittedAt: "2026-06-04T09:00:00.000Z",
  },
  {
    id: uuid(3),
    companyId: "company-3",
    accessToken: "seed-token-03",
    salesforceData: { companyName: "Cinder Electric", primaryContactFirstName: "Cy Rho", salesSegment: "SMB", industry: "HVAC", numberOfEmployees: "6-10" },
    currentModule: 8,
    customFormsEnabled: true,
    status: "completed",
    expiresAt: "2026-06-17T09:00:00.000Z",
    createdAt: "2026-06-03T09:00:00.000Z",
    updatedAt: "2026-06-06T09:00:00.000Z",
    submittedAt: "2026-06-06T09:00:00.000Z",
  },
  {
    id: uuid(4),
    companyId: "company-4",
    accessToken: "seed-token-04",
    salesforceData: { companyName: "Delta Works", primaryContactFirstName: "Di Vas", salesSegment: "Enterprise", industry: "Electrical", numberOfEmployees: "51+" },
    currentModule: 3,
    customFormsEnabled: false,
    status: "in_progress",
    expiresAt: "2026-06-24T09:00:00.000Z",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T13:00:00.000Z",
    submittedAt: null,
  },
  {
    id: uuid(5),
    companyId: "company-5",
    accessToken: "seed-token-05",
    salesforceData: { companyName: "Ember Plumbing", primaryContactFirstName: "El Fox", salesSegment: "SMB", industry: "Plumbing", numberOfEmployees: "3-5" },
    currentModule: 1,
    customFormsEnabled: false,
    status: "in_progress",
    expiresAt: "2026-06-25T09:00:00.000Z",
    createdAt: "2026-06-11T09:00:00.000Z",
    updatedAt: "2026-06-11T11:00:00.000Z",
    submittedAt: null,
  },
  {
    id: uuid(6),
    companyId: "company-6",
    accessToken: "seed-token-06",
    salesforceData: { companyName: "Frost Air", primaryContactFirstName: "Fi Nam", salesSegment: "Mid-Market", industry: "HVAC", numberOfEmployees: "31-50" },
    currentModule: 0,
    customFormsEnabled: false,
    status: "in_progress",
    expiresAt: "2026-06-26T09:00:00.000Z",
    createdAt: "2026-06-12T09:00:00.000Z",
    updatedAt: "2026-06-12T10:00:00.000Z",
    submittedAt: null,
  },
  {
    id: uuid(7),
    companyId: "company-7",
    accessToken: "seed-token-07",
    salesforceData: { companyName: "Gale Electric", primaryContactFirstName: "Gil Roe", salesSegment: "SMB", industry: "Electrical", numberOfEmployees: "1-2" },
    currentModule: 1,
    customFormsEnabled: false,
    status: "expired",
    expiresAt: "2026-05-15T09:00:00.000Z",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-01T11:00:00.000Z",
    submittedAt: null,
  },
  {
    id: uuid(8),
    companyId: "company-8",
    accessToken: "seed-token-08",
    salesforceData: { companyName: "Hearth Mechanical", primaryContactFirstName: "Ha Sun", salesSegment: "Enterprise", industry: "HVAC", numberOfEmployees: "51+" },
    currentModule: 8,
    customFormsEnabled: true,
    status: "submission_failed",
    expiresAt: "2026-06-27T09:00:00.000Z",
    createdAt: "2026-06-13T09:00:00.000Z",
    updatedAt: "2026-06-13T12:00:00.000Z",
    submittedAt: "2026-06-13T12:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Module rows: the wizard's module sequence, with per-session "reached" and
// "complete" counts, so both is_complete true and false are represented.
// ---------------------------------------------------------------------------

const MODULE_SEQUENCE: { moduleNumber: number; moduleKey: string }[] = [
  { moduleNumber: 0, moduleKey: "generalInfo" },
  { moduleNumber: 1, moduleKey: "customers" },
  { moduleNumber: 2, moduleKey: "jobs" },
  { moduleNumber: 3, moduleKey: "clearpath" },
  { moduleNumber: 4, moduleKey: "estimatesInvoices" },
  { moduleNumber: 5, moduleKey: "communications" },
  { moduleNumber: 6, moduleKey: "customForms" },
  { moduleNumber: 7, moduleKey: "userSetup" },
  { moduleNumber: 8, moduleKey: "teamsSetup" },
];

const FORM_DATA_BY_KEY: Record<string, JsonObject> = {
  generalInfo: { companySize: "11-20", industry: ["HVAC"], customerTypes: ["residential"], emergencyServices: true },
  customers: { selectedTagSets: ["default", "residential"] },
  jobs: { jobRecordName: "Job", workflows: ["service_call", "installation"] },
  clearpath: { service_call: "standard", default: "simple" },
  estimatesInvoices: { currencyCode: "USD", defaultDueDateDays: "30" },
  communications: { sms: { callToSchedule: true }, email: { jobCompleted: true } },
  customForms: { installChecklist: true, safetyChecklist: false },
  userSetup: { users: [] },
  teamsSetup: { teams: [] },
};

// [sessionIndex (1-based), modules reached, modules complete].
const MODULE_PLAN: { sessionIndex: number; reached: number; complete: number }[] = [
  { sessionIndex: 1, reached: 9, complete: 9 },
  { sessionIndex: 2, reached: 9, complete: 9 },
  { sessionIndex: 3, reached: 9, complete: 9 },
  { sessionIndex: 4, reached: 4, complete: 3 },
  { sessionIndex: 5, reached: 2, complete: 1 },
  { sessionIndex: 6, reached: 1, complete: 0 },
  { sessionIndex: 7, reached: 2, complete: 1 },
  { sessionIndex: 8, reached: 9, complete: 9 },
];

const MODULE_ROWS: SeedModule[] = [];
let moduleCounter = 0;
for (const plan of MODULE_PLAN) {
  const session = SESSIONS[plan.sessionIndex - 1];
  for (let i = 0; i < plan.reached; i++) {
    const seq = MODULE_SEQUENCE[i];
    moduleCounter += 1;
    MODULE_ROWS.push({
      id: uuid(1000 + moduleCounter),
      sessionId: session.id,
      moduleNumber: seq.moduleNumber,
      moduleKey: seq.moduleKey,
      formData: FORM_DATA_BY_KEY[seq.moduleKey] ?? {},
      isComplete: i < plan.complete,
      savedAt: addHours(session.createdAt, i + 1),
    });
  }
}

// ---------------------------------------------------------------------------
// Import jobs: per-module submit results at Complete Setup, covering success,
// failed, and skipped. Attached to the completed and submission_failed sessions.
// ---------------------------------------------------------------------------

function makeJob(
  idNum: number,
  sessionIndex: number,
  jobType: string,
  status: JobStatus,
  opts: { responseData?: JsonObject | null; errorMessage?: string | null } = {},
): SeedJob {
  const session = SESSIONS[sessionIndex - 1];
  const firedAt = session.submittedAt ?? session.createdAt;
  return {
    id: uuid(idNum),
    sessionId: session.id,
    jobType,
    status,
    payload: { moduleKey: jobType },
    responseData: opts.responseData ?? (status === "success" ? { ok: true } : null),
    errorMessage: opts.errorMessage ?? null,
    attempts: status === "failed" ? 3 : 1,
    maxAttempts: 3,
    createdAt: firedAt,
    startedAt: firedAt,
    completedAt: status === "skipped" ? firedAt : addHours(firedAt, 0.02),
  };
}

const IMPORT_JOBS: SeedJob[] = [
  makeJob(2001, 1, "company_settings", "success"),
  makeJob(2002, 1, "estimates_invoices", "success"),
  makeJob(2003, 1, "job_workflows", "success"),
  makeJob(2004, 2, "customer_tags", "success"),
  makeJob(2005, 2, "communication_templates", "success"),
  makeJob(2006, 2, "custom_forms", "skipped", { responseData: null }),
  makeJob(2007, 3, "users", "success"),
  makeJob(2008, 3, "teams", "success"),
  makeJob(2009, 8, "company_settings", "success"),
  makeJob(2010, 8, "estimates_invoices", "failed", { errorMessage: "FP API 500: settings upsert failed" }),
];

// ---------------------------------------------------------------------------
// Known counts, derived from the arrays so they never drift from the data.
// ---------------------------------------------------------------------------

function countBy<T, K extends string>(rows: T[], key: (row: T) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const row of rows) {
    const k = key(row);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export const SEED_COUNTS = {
  sessions: SESSIONS.length,
  sessionsByStatus: countBy(SESSIONS, (s) => s.status),
  moduleData: MODULE_ROWS.length,
  moduleComplete: MODULE_ROWS.filter((m) => m.isComplete).length,
  moduleIncomplete: MODULE_ROWS.filter((m) => !m.isComplete).length,
  importJobs: IMPORT_JOBS.length,
  importJobsByStatus: countBy(IMPORT_JOBS, (j) => j.status),
} as const;

// ---------------------------------------------------------------------------
// Apply + seed.
// ---------------------------------------------------------------------------

export async function applySchema(sql: Sql): Promise<void> {
  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  // Simple protocol so the multi-statement DDL runs in one round trip.
  await sql.unsafe(schema).simple();
}

export async function seed(sql: Sql): Promise<void> {
  await applySchema(sql);

  for (const s of SESSIONS) {
    await sql`
      insert into wizard_sessions
        (id, company_id, access_token, salesforce_data, current_module,
         custom_forms_enabled, status, expires_at, created_at, updated_at, submitted_at)
      values
        (${s.id}, ${s.companyId}, ${s.accessToken}, ${sql.json(s.salesforceData)}, ${s.currentModule},
         ${s.customFormsEnabled}, ${s.status}, ${s.expiresAt}, ${s.createdAt}, ${s.updatedAt}, ${s.submittedAt})
    `;
  }

  for (const m of MODULE_ROWS) {
    await sql`
      insert into wizard_module_data
        (id, session_id, module_number, module_key, form_data, is_complete, saved_at)
      values
        (${m.id}, ${m.sessionId}, ${m.moduleNumber}, ${m.moduleKey}, ${sql.json(m.formData)}, ${m.isComplete}, ${m.savedAt})
    `;
  }

  for (const j of IMPORT_JOBS) {
    await sql`
      insert into import_jobs
        (id, session_id, job_type, status, payload, response_data, error_message,
         attempts, max_attempts, created_at, started_at, completed_at)
      values
        (${j.id}, ${j.sessionId}, ${j.jobType}, ${j.status}, ${sql.json(j.payload)},
         ${j.responseData === null ? null : sql.json(j.responseData)}, ${j.errorMessage},
         ${j.attempts}, ${j.maxAttempts}, ${j.createdAt}, ${j.startedAt}, ${j.completedAt})
    `;
  }
}
