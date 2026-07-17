// Derives the status label shown for an account from its lifecycle status and
// progress. An in-progress account that has completed no modules (0% progress)
// reads as "Not started" rather than "In progress", so the list distinguishes
// links nobody has advanced from ones actively in flight. Every other status
// passes through unchanged.
//
// DB-free (type-only import) so client components can import it without pulling
// the Postgres client into the browser bundle.

import type { WizardStatus } from "./types";

export type DisplayStatus = WizardStatus | "not_started";

export function displayStatus(status: WizardStatus, progress: number): DisplayStatus {
  return status === "in_progress" && progress === 0 ? "not_started" : status;
}
