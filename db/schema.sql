-- Local, vanilla-PostgreSQL schema for the three tables the dashboard reads.
--
-- Why this file exists (and is not just the raw migrations):
-- The onboarding app's migrations under db/reference-migrations/ are the
-- production source of truth, but they are Supabase-flavored and cannot be
-- applied to a plain local Postgres as-is:
--   * The base import_jobs table and its import_job_type / import_job_status
--     enums live only on the remote Supabase project (seeded 2026-04-02);
--     migration 006 is forward-only ALTERs over that already-existing base.
--   * Several migrations insert into storage.buckets and reference other
--     Supabase-only schemas, and the RLS policies key off Supabase JWT claims.
--
-- This file materializes the equivalent final-state schema (after the relevant
-- 001..016 ALTERs) for wizard_sessions, wizard_module_data, and import_jobs
-- only. It uses gen_random_uuid() (built in since PG13, no extension needed).
-- It is kept in sync by hand with db/reference-migrations/ and is used only by
-- the local test harness. It is never run against any real database.

drop table if exists import_jobs cascade;
drop table if exists wizard_module_data cascade;
drop table if exists wizard_sessions cascade;
drop type if exists import_job_status cascade;
drop type if exists import_job_type cascade;
drop type if exists wizard_status cascade;

-- wizard_sessions.status (migration 001).
create type wizard_status as enum (
  'in_progress',
  'completed',
  'expired',
  'submission_failed'
);

-- import_jobs.job_type (remote enum, documented in migration 006 header and
-- mirrored by the ImportJobType union in the onboarding app's lib/types).
create type import_job_type as enum (
  'company_settings',
  'estimates_invoices',
  'job_workflows',
  'job_statuses',
  'customer_tags',
  'communication_templates',
  'clearpath_triggers',
  'custom_forms',
  'users',
  'teams'
);

-- import_jobs.status (base enum plus the in_progress and skipped values added
-- by migration 006).
create type import_job_status as enum (
  'queued',
  'in_progress',
  'success',
  'failed',
  'skipped'
);

-- wizard_sessions: migration 001, plus 010 (sso_token_id), 011 (jwt,
-- jwt_expires_at), 012 (access_token nullable), 014 (submitted_at).
create table wizard_sessions (
  id                   uuid primary key default gen_random_uuid(),
  company_id           text not null,
  access_token         text unique,
  salesforce_data      jsonb default '{}',
  current_module       integer not null default 0,
  custom_forms_enabled boolean not null default false,
  status               wizard_status not null default 'in_progress',
  expires_at           timestamptz not null default (now() + interval '14 days'),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  sso_token_id         text,
  jwt                  text,
  jwt_expires_at       timestamptz,
  submitted_at         timestamptz
);
create index idx_wizard_sessions_company on wizard_sessions (company_id);

-- wizard_module_data: migration 002.
create table wizard_module_data (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references wizard_sessions (id) on delete cascade,
  module_number   integer not null,
  module_key      text not null,
  form_data       jsonb not null default '{}',
  is_complete     boolean not null default false,
  submitted_to_fp boolean not null default false,
  saved_at        timestamptz not null default now(),
  unique (session_id, module_key)
);
create index idx_module_data_session on wizard_module_data (session_id);

-- import_jobs: remote base shape documented in migration 006 header, plus
-- migration 006 (updated_at column, unique (session_id, job_type)).
create table import_jobs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references wizard_sessions (id) on delete cascade,
  job_type      import_job_type not null,
  status        import_job_status not null default 'queued',
  payload       jsonb not null,
  response_data jsonb,
  error_message text,
  attempts      integer not null default 0,
  max_attempts  integer not null default 3,
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (session_id, job_type)
);
create index idx_import_jobs_session on import_jobs (session_id);
