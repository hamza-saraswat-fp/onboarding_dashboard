// Route protection: every route (except the auth routes, static assets, and the
// 403 page itself) requires an authenticated, allowlisted user.
//
// - Unauthenticated -> redirect to the Auth.js sign-in page.
// - Authenticated but not allowlisted -> the 403 page.
// - Dev bypass (AUTH_DEV_BYPASS, non-production) -> treated as the stub user.
//
// This is the active gate: Google SSO + an ALLOWED_EMAILS allowlist. The shared
// HTTP Basic Auth path (lib/auth/basic-auth.ts) is kept in place but dormant as
// a fallback; to switch back, restore the Basic Auth middleware here.

import { NextResponse } from "next/server";
import { auth, isDevBypass, DEV_BYPASS_USER } from "@/lib/auth";
import { isAllowed } from "@/lib/auth/allowlist";

export default auth((req) => {
  const session = isDevBypass ? { user: DEV_BYPASS_USER } : req.auth;
  const email = session?.user?.email ?? null;
  const { nextUrl } = req;

  if (!session) {
    const signInUrl = new URL("/api/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  if (!isAllowed(email)) {
    return NextResponse.rewrite(new URL("/403", nextUrl.origin), { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  // Protect everything except the auth routes, Next internals, favicon, and the
  // 403 page (so the not-allowlisted rewrite does not loop).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|403).*)"],
};
