# Reference migrations (read-only)

Verbatim copies of the onboarding app's Supabase migrations from
`jaden-fp/fieldpulse-onboarding` (`supabase/migrations/001..016_*.sql`),
kept here as the production source of truth for the schema this dashboard
reads. **Do not edit these files.**

They are reference only. They are not applied by the local test harness,
because they are Supabase-flavored and cannot run against a plain local
Postgres:

- The base `import_jobs` table and its `import_job_type` / `import_job_status`
  enums are not created by any migration. They were seeded directly on the
  remote Supabase project (2026-04-02); migration `006` is forward-only
  ALTERs over that already-existing base (its own header documents the remote
  shape).
- Several migrations insert into `storage.buckets` and reference other
  Supabase-only schemas (`storage.*`), and the RLS policies key off Supabase
  JWT claims (`request.jwt.claims`).

The local harness instead materializes an equivalent, vanilla-Postgres
schema for the three tables the dashboard actually reads
(`wizard_sessions`, `wizard_module_data`, `import_jobs`) in
[`../schema.sql`](../schema.sql), kept in sync by hand with these files.
