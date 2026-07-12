// Pure sort helpers for the accounts table. Kept out of lib/queries/account.ts on
// purpose: that module imports the Postgres client, so importing a runtime value
// from it into the client accounts-table would pull Node built-ins into the
// browser bundle. This module has no imports and is safe for client components.

// Sort key that approximates account age. FieldPulse assigns company ids in
// creation order, so the numeric id ascending is oldest-first: a rough way to
// surface links generated on existing/old accounts (an established account that
// gets an onboarding link it should not have). Non-numeric ids (seed or probe
// rows) carry no age signal and sort last. Rough by nature: an old account can
// legitimately re-onboard, and an existing account with a high id is not caught.
export function companyIdSortValue(companyId: string): number {
  const n = Number(companyId);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}
