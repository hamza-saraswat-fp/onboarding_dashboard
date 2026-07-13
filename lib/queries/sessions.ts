// Read-only session queries. Two shapes the dashboard needs: a list of all
// sessions (company summary and drill-in) and one session by id (account view),
// plus the module and import-job rows for one or more sessions.
//
// Every query maps snake_case columns to the camelCase fields of the interfaces
// in lib/types.ts. postgres.js returns timestamptz as Date and jsonb as a
// parsed object, so the aliased rows match the interfaces directly.

import { sql } from "../db";
import type { ImportJob, WizardModuleData, WizardSession } from "../types";

export async function listSessions(): Promise<WizardSession[]> {
  return sql<WizardSession[]>`
    select
      id,
      company_id as "companyId",
      access_token as "accessToken",
      salesforce_data as "salesforceData",
      current_module as "currentModule",
      status,
      created_at as "createdAt",
      submitted_at as "submittedAt",
      expires_at as "expiresAt"
    from wizard_sessions
    order by created_at
  `;
}

export async function getSession(id: string): Promise<WizardSession | null> {
  const rows = await sql<WizardSession[]>`
    select
      id,
      company_id as "companyId",
      access_token as "accessToken",
      salesforce_data as "salesforceData",
      current_module as "currentModule",
      status,
      created_at as "createdAt",
      submitted_at as "submittedAt",
      expires_at as "expiresAt"
    from wizard_sessions
    where id = ${id}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function listModuleData(sessionIds?: string[]): Promise<WizardModuleData[]> {
  if (sessionIds) {
    return sql<WizardModuleData[]>`
      select
        session_id as "sessionId",
        module_key as "moduleKey",
        module_number as "moduleNumber",
        form_data as "formData",
        is_complete as "isComplete",
        saved_at as "savedAt"
      from wizard_module_data
      where session_id = any(${sessionIds}::uuid[])
      order by session_id, module_number
    `;
  }
  return sql<WizardModuleData[]>`
    select
      session_id as "sessionId",
      module_key as "moduleKey",
      module_number as "moduleNumber",
      form_data as "formData",
      is_complete as "isComplete",
      saved_at as "savedAt"
    from wizard_module_data
    order by session_id, module_number
  `;
}

// The number of steps in the onboarding wizard, taken as the count of distinct
// module_numbers present across all sessions. Used as the denominator for
// per-account progress so it reads against the whole wizard, not just the modules
// an account happened to reach. 0 when there is no module data at all.
export async function wizardStepCount(): Promise<number> {
  const rows = await sql<{ n: number }[]>`
    select count(distinct module_number)::int as n from wizard_module_data
  `;
  return rows[0]?.n ?? 0;
}

export async function listImportJobs(sessionIds?: string[]): Promise<ImportJob[]> {
  if (sessionIds) {
    return sql<ImportJob[]>`
      select
        session_id as "sessionId",
        job_type as "jobType",
        status,
        error_message as "errorMessage",
        completed_at as "completedAt"
      from import_jobs
      where session_id = any(${sessionIds}::uuid[])
      order by session_id, job_type
    `;
  }
  return sql<ImportJob[]>`
    select
      session_id as "sessionId",
      job_type as "jobType",
      status,
      error_message as "errorMessage",
      completed_at as "completedAt"
    from import_jobs
    order by session_id, job_type
  `;
}
