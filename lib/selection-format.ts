// Formatting for the wizard's saved answers on the account detail view. Pure and
// DB-free so both the standalone page and the client drawer can use it.

// Selection keys the wizard collects but hides in the onboarding app's own UI, so
// we hide them here too and the dashboard shows only what the customer saw.
export const HIDDEN_SELECTION_KEYS = new Set<string>(["emergencyServices"]);

// An enum-like slug value: lowercase words, optionally underscore-joined, e.g.
// "service_call" or "residential". These are the answers worth title-casing.
// Anything else (proper names, URLs, emails, "USD", ids, "720 Vallejo st",
// numbers, zip codes) fails this test and is left exactly as stored.
const SLUG_RE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

// Title-cases a slug answer: "service_call" -> "Service Call", "residential" ->
// "Residential". Non-slug strings pass through unchanged.
export function prettifyAnswer(value: string): string {
  if (!SLUG_RE.test(value)) return value;
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
