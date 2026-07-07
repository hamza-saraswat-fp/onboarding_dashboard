-- QA-40 / F-007 — durable "submission has started" signal.
--
-- wizard_sessions.status only became 'completed' at the END of completeWizard's
-- orchestration, so the entire submit window read 'in_progress' — which is
-- indistinguishable from "user is still reviewing." On refresh, the Completed
-- module therefore re-showed the confirm screen with a live re-submit button.
--
-- This column records the instant Complete Setup is fired (stamped before any FP
-- call), so the UI can render a no-resubmit "finishing" screen the moment a
-- submission has started — durably across refreshes and the ?token= exchange
-- path. status='completed' still wins once the orchestrator finishes.
--
-- Nullable, no backfill: existing 'completed' rows (null submitted_at) are
-- handled by the status check; existing 'in_progress' rows are genuinely
-- un-submitted, so null is the correct value for them.

alter table wizard_sessions
  add column if not exists submitted_at timestamptz;
