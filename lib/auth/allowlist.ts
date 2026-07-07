// Email allowlist. Only listed FieldPulse emails may use the dashboard.
//
// ALLOWED_EMAILS is a plain, comma-separated env var (intentionally NOT a
// secret, so it can be edited quickly in the Vercel dashboard). Matching is
// case-insensitive and whitespace-trimmed. An empty or missing allowlist denies
// everyone (secure default).

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}
