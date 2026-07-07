-- BRK-174 — align repo migration with the import_jobs schema already deployed
-- on the remote Supabase project (rqelncbqgepyardwtltc, seeded 2026-04-02).
-- This script is fully idempotent: safe to re-run, no-ops what's already in place.
--
-- Remote shape (truth, captured 2026-05-19):
--   id              uuid pk default extensions.uuid_generate_v4()
--   session_id      uuid not null
--   job_type        import_job_type not null     -- enum
--   status          import_job_status not null   -- enum, default 'queued'
--   payload         jsonb not null
--   response_data   jsonb
--   error_message   text
--   attempts        integer not null default 0
--   max_attempts    integer not null default 3
--   created_at      timestamptz not null default now()
--   started_at      timestamptz
--   completed_at    timestamptz
--
-- This migration adds what was missing for the orchestrator code (BRK-161):
--   1. updated_at column + auto-update trigger (used by withImportJob audit log)
--   2. 'in_progress' and 'skipped' values in the import_job_status enum
--   3. unique (session_id, job_type) constraint for idempotency upserts
--
-- For a fresh local DB (`supabase db reset`), the CREATE TYPE / CREATE TABLE
-- statements in migrations 001-005 are assumed to set up the enums and base
-- import_jobs table. This file is forward-only ALTERs.

-- ---------------------------------------------------------------------------
-- 1. updated_at column + trigger
-- ---------------------------------------------------------------------------

alter table import_jobs
  add column if not exists updated_at timestamptz not null default now();

create or replace function update_updated_at_column() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists import_jobs_updated_at on import_jobs;
create trigger import_jobs_updated_at
  before update on import_jobs
  for each row execute procedure update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. Extend import_job_status enum to include 'in_progress' and 'skipped'
--
-- Note: ALTER TYPE ... ADD VALUE must run outside a transaction in some
-- Supabase migration runners. If `supabase db push` errors with
-- "ALTER TYPE ... ADD cannot run inside a transaction block", move these
-- two statements into a sibling file 006a_extend_status_enum.sql.
-- ---------------------------------------------------------------------------

alter type import_job_status add value if not exists 'in_progress';
alter type import_job_status add value if not exists 'skipped';

-- ---------------------------------------------------------------------------
-- 3. Idempotency constraint: unique (session_id, job_type)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'import_jobs_session_job_unique'
  ) then
    alter table import_jobs
      add constraint import_jobs_session_job_unique
      unique (session_id, job_type);
  end if;
end$$;
