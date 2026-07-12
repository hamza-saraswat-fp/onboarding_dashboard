// Company ids that exist in the onboarding DB but are not real onboarding sends:
// manually generated links on existing/old accounts, and test accounts the name
// heuristic in test-accounts.ts cannot catch (real-looking company names). Curated
// by hand. Excluded from every statistic and shown only in the collapsed "Excluded
// links" table at the bottom, so the exclusion stays auditable and reversible.
//
// Primary curation is the committed EXCLUDED_ID_DEFAULTS array below (edit, open a
// PR, preview on the branch, merge). EXCLUDED_COMPANY_IDS (comma-separated) is a
// no-deploy escape hatch, parity with TEST_COMPANY_IDS in test-accounts.ts.
//
// Keyed on company id, so adding an id hides every link for that company. That is
// the right call for a duplicate or bogus manual link.

// Known non-real links, by company id. Add an id here with a short note so the
// reason survives. Ships empty; seed ids are backfilled as they are identified.
const EXCLUDED_ID_DEFAULTS: string[] = [
  // "<company_id>", // AAA Appliance Service Center: manual link on an old account
];

function excludedIds(): Set<string> {
  const fromEnv = (process.env.EXCLUDED_COMPANY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...EXCLUDED_ID_DEFAULTS, ...fromEnv]);
}

const EXCLUDED = excludedIds();

export function isExcludedAccount(companyId: string): boolean {
  return EXCLUDED.has(companyId);
}
