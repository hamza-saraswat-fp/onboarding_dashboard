-- BRK-175: bucket for the 25 system-managed xlsx templates the orchestrator
-- ships to Master Portal at completeWizard() (customer tags, communications
-- templates, ClearPath workflow definitions).
--
-- Distinct from `wizard-uploads` (migration 004), which is for user-uploaded
-- logos + csvs and restricts mime types to image/* + text/csv. This bucket
-- only accepts xlsx and is read-only from a client perspective (service-role
-- access only on the server). No RLS policies needed.
--
-- Idempotent: safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'import-templates',
  'import-templates',
  false,
  10485760,  -- 10 MB; generous headroom (actual files are ~5-30 KB each)
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
)
on conflict (id) do nothing;
