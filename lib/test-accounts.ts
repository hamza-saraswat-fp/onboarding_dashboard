// Detects test / demo onboarding accounts so they can be excluded from every
// statistic and shown only in the collapsed table at the bottom.
//
// Rule: the company name or id starts a word with "test" (test, test20, "Local
// Test Co", "Test company name") or contains "e2e". A leading word boundary
// keeps real names like "Latest 5" or "Contest 9" from matching.
//
// Some test accounts can't be caught by name (e.g. the typo "Teset 137"). Those
// are listed by company id below, and more can be added without a code change
// via the TEST_COMPANY_IDS env var (comma-separated company ids).

const TEST_RE = /\btest|\be2e\b/i;

// Known test accounts the name heuristic can't catch (typos, opaque ids).
const TEST_ID_OVERRIDES = ["85273"]; // "Teset 137" (misspelled "Test")

function overrideIds(): Set<string> {
  const fromEnv = (process.env.TEST_COMPANY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...TEST_ID_OVERRIDES, ...fromEnv]);
}

const OVERRIDES = overrideIds();

export function isTestAccount(companyId: string, companyName: string | null): boolean {
  if (OVERRIDES.has(companyId)) return true;
  if (TEST_RE.test(companyId)) return true;
  return companyName != null && TEST_RE.test(companyName);
}
