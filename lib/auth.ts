// Auth.js (NextAuth v5) configuration. Google SSO gates the whole dashboard.
//
// The Google provider reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the
// environment (Auth.js env convention). AUTH_SECRET signs the session. These
// are provisioned outside this repo (Vercel env vars) and are not needed to
// build: Auth.js validates them lazily, on a real request.
//
// Dev bypass: when AUTH_DEV_BYPASS is "true" AND NODE_ENV is not production,
// getSession() returns a stub authenticated user so local dev and CI can run
// without real OAuth credentials. The email allowlist and route protection live
// in the next issue (middleware).

import NextAuth, { type Session } from "next-auth";
import Google from "next-auth/providers/google";

export const isDevBypass =
  process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production";

export const DEV_BYPASS_USER = { name: "Dev User", email: "dev@fieldpulse.com" };

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
});

// Bypass-aware session accessor. Callers (pages, middleware) read the session
// through this so the dev bypass is honored in exactly one place.
export async function getSession(): Promise<Session | null> {
  if (isDevBypass) {
    return {
      user: DEV_BYPASS_USER,
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }
  return auth();
}
