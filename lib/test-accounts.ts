// Detects test / demo onboarding accounts so they can be excluded from every
// statistic and shown only in the collapsed table at the bottom.
//
// Rule: the company name or id starts a word with "test" (test, test20, "Local
// Test Co", "Test company name"), contains "e2e", or is one of the internal
// FieldPulse probe/fixture accounts prefixed "FP-PROBE" or "FP-FIX" (their real
// company name can look legitimate, e.g. "Acme Plumbing", so the id carries the
// prefix). A leading word boundary keeps real names like "Latest 5", "Contest 9",
// or a plain "FP Plumbing" from matching.
//
// Some test accounts can't be caught by name (e.g. the typo "Teset 137"). Those
// are listed by company id below, and more can be added without a code change
// via the TEST_COMPANY_IDS env var (comma-separated company ids).

const TEST_RE = /\btest|\be2e\b|\bfp-(probe|fix)\b/i;

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
