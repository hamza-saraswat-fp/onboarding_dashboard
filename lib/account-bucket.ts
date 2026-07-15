// Which shelf an onboarding link belongs to. Only "real" accounts count in the
// metrics; the other three are excluded from every statistic and shown in their
// own collapsed tables. Pure and DB-free (type-only import) so it can be reused
// and unit-tested in isolation.
//
// Precedence is Hidden > Test > Expired > Real: a session that matches more than
// one category lands in the first match. In particular an expired-status account
// that is also a test account stays in "test", so expiring links never moves an
// account off the test shelf.
//
// Hidden and Test are curated / detected elsewhere (lib/hidden-accounts.ts,
// lib/test-accounts.ts); this helper just resolves precedence given those two
// booleans plus the wizard status. Expired is driven purely by the wizard
// status: a link the onboarding app has marked expired.

import type { WizardStatus } from "./types";

export type AccountBucket = "hidden" | "test" | "expired" | "real";

export function accountBucket(input: {
  hidden: boolean;
  test: boolean;
  status: WizardStatus;
}): AccountBucket {
  if (input.hidden) return "hidden";
  if (input.test) return "test";
  if (input.status === "expired") return "expired";
  return "real";
}
