// Auto-detects test onboarding accounts. The rule: the company name or id
// contains "test" followed by a number (e.g. "Test 20", "test20", "test-42").
// Test accounts are excluded from every statistic and are shown only in the
// collapsed table at the bottom of the dashboard.
//
// A word boundary is required before "test" so suffixes like "contest 9" or
// "latest 5" are not caught, and letters between "test" and the number break the
// match, so real names like "Testarossa 5" are not caught either.

const TEST_RE = /\btest[^a-z0-9]*\d+/i;

export function isAutoTestAccount(companyId: string, companyName: string | null): boolean {
  if (TEST_RE.test(companyId)) return true;
  return companyName != null && TEST_RE.test(companyName);
}
