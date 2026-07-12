// Company ids that are real Salesforce accounts but should not count in the
// numbers: accounts whose onboarding link is not a genuine send (a link generated
// on an existing/old account, or one that was never actually sent). Curated by
// hand. Hidden from every statistic and shown only in the collapsed "Hidden" table
// at the bottom, so the exclusion stays auditable and reversible.
//
// This is deliberately separate from test-accounts.ts. Those are synthetic
// test/probe accounts detected by name; these are genuine accounts a human chose
// to hide. Two different reasons, two different stores, two different shelves.
//
// Primary curation is the committed HIDDEN_ID_DEFAULTS array below (edit, open a
// PR, preview on the branch, merge). HIDDEN_COMPANY_IDS (comma-separated) is a
// no-deploy escape hatch, parity with TEST_COMPANY_IDS in test-accounts.ts.
//
// Keyed on company id, so adding an id hides every link for that company.

// Known non-real links, by company id. Add an id here with a short note so the
// reason survives. Ships empty; ids are backfilled as they are identified.
const HIDDEN_ID_DEFAULTS: string[] = [
  // "<company_id>", // AAA Appliance Service Center: link on an existing account
];

function hiddenIds(): Set<string> {
  const fromEnv = (process.env.HIDDEN_COMPANY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...HIDDEN_ID_DEFAULTS, ...fromEnv]);
}

const HIDDEN = hiddenIds();

export function isHiddenAccount(companyId: string): boolean {
  return HIDDEN.has(companyId);
}
