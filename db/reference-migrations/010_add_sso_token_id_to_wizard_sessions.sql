-- BRK-179 — add sso_token_id to wizard_sessions.
--
-- The FP backend (apibe.fieldpulse.com) authenticates via SSO id → POST
-- /authorize → JWT, then Authorization: Bearer <jwt> on subsequent calls
-- (Areg confirmed 2026-05-20, replacing the prior static API-KEY plan).
-- Salesforce will pass the sso_token_id alongside company_id at wizard-link
-- generation; our exchange handshake persists it on the session so the
-- orchestrator can fetch a JWT at Complete Setup.
--
-- Nullable: existing sessions predate this column and the SF upstream
-- wiring lands in a follow-up. completeWizard() fails-fast with a clear
-- error if sso_token_id is missing at submission time.

alter table wizard_sessions
  add column sso_token_id text;
