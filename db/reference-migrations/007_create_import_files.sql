-- BRK-174 — replace the per-session import_files draft with the catalog shape
-- already deployed on the remote Supabase project (seeded 2026-04-02, 25 rows).
--
-- import_files is a *global* template catalog, not a per-session materialization.
-- The orchestrator (BRK-175) queries it by (file_type, variant, workflow) at
-- completeWizard() to pick which xlsx files to ship to Master Portal.
--
-- Idempotent: safe to run against remote (where the table exists with 25 rows
-- of data — they're preserved). Safe to run on a fresh local DB.
--
-- File layout per row (storage paths inside the wizard-uploads bucket once
-- BRK-175 uploads them):
--   templates/clearpath/default_simple.xlsx
--   templates/customer_tags/residential.xlsx
--   templates/communications/sms_on_the_way.xlsx
--   ...

create table if not exists import_files (
  id                    uuid primary key default extensions.uuid_generate_v4(),
  file_type             text not null,
  variant               text not null,
  workflow              text,
  display_name          text not null,
  storage_path          text not null,
  fieldpulse_endpoint   text,
  requires_custom_forms boolean not null default false,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

create index if not exists idx_import_files_active on import_files(file_type, is_active);

-- No RLS policy on import_files: the catalog is read by the orchestrator via
-- the service-role/postgres.js connection (DATABASE_URL), not by browser
-- clients. If we later expose it client-side, add a read-only RLS policy.
