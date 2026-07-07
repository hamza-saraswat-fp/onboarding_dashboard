-- BRK-163 — drop NOT NULL on wizard_sessions.access_token.
--
-- The token-exchange endpoint at app/api/auth/exchange/route.ts:31 sets
-- access_token to NULL after a successful exchange to prevent replay
-- attacks (single-use token). Migration 001 declared the column NOT NULL,
-- which made that UPDATE fail with a constraint violation -- discovered
-- during BRK-163 dev validation when the exchange endpoint was wired into
-- the wizard for the first time (no prior code path invoked it).
--
-- Postgres unique constraints treat NULLs as distinct, so multiple
-- exchanged sessions can coexist with access_token = NULL without
-- violating the existing UNIQUE constraint -- no other schema changes
-- needed.

alter table wizard_sessions
  alter column access_token drop not null;
