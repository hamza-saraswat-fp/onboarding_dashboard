-- BRK-174 — delete the 4 stale seed wizard_sessions (and cascaded rows) from
-- April 2026 testing. They expired 2026-04-16 and reference fake company_ids
-- (acme-plumbing-001, etc.) with dangling storage_path references.
--
-- Cascades via FK on delete:
--   wizard_module_data (session_id FK)
--   import_jobs        (session_id FK)
--   wizard_files       (session_id FK)
--
-- NOT touched:
--   import_files (global catalog) — has no session_id FK; 25 catalog rows stay.
--
-- The expires_at filter (< 2026-05-01) is a safety net: anything created
-- post-April is preserved. If the seed data is somehow re-created with a
-- newer expires_at before this migration runs, expand the filter accordingly.

delete from wizard_sessions where expires_at < '2026-05-01';
