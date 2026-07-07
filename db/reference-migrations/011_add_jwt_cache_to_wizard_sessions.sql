-- BRK-180 — persist the FP backend JWT on each wizard session so retries at
-- Complete Setup reuse it instead of re-calling /authorize with a burned SSO
-- token.
--
-- Areg confirmed 2026-05-21 that SSO tokens are single-use (consumed by the
-- first /authorize call) with no TTL. BRK-179 wired fetchJwt() to be called
-- on every Complete Setup, which meant any retry was unrecoverable. This
-- migration adds the storage; the orchestrator's getOrFetchJwt helper reads
-- jwt/jwt_expires_at first and only re-calls /authorize on a cache miss or
-- once the cached JWT is within 60s of its decoded exp claim.
--
-- Both columns are nullable: pre-BRK-180 sessions don't have them, and a
-- fresh wizard session won't either until its first Complete Setup runs.

alter table wizard_sessions
  add column jwt text,
  add column jwt_expires_at timestamptz;
