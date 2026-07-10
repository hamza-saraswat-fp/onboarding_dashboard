// Email allowlist. Only listed FieldPulse emails may use the dashboard.
//
// ALLOWED_EMAILS is a plain, comma-separated env var (intentionally NOT a
// secret, so it can be edited quickly in the Vercel dashboard). Matching is
// case-insensitive and whitespace-trimmed. An entry that starts with "@" (for
// example "@fieldpulse.com") matches any address on that domain; any other
// entry must match the full email exactly. An empty or missing allowlist denies
// everyone (secure default).

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const entries = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (entries.length === 0) return false;
  return entries.some((entry) =>
    entry.startsWith("@") ? normalized.endsWith(entry) : normalized === entry,
  );
}
