// Route protection for the quick launch: every route requires HTTP Basic Auth
// against BASIC_AUTH_USER / BASIC_AUTH_PASSWORD. This is a shared-credential
// stopgap so we can deploy and gather feedback.
//
// The Google SSO path is kept in place but dormant (lib/auth.ts,
// app/api/auth/[...nextauth]/route.ts, lib/auth/allowlist.ts, the 403 page). To
// switch the gate back to Google SSO, restore the Auth.js middleware here.

import { NextResponse, type NextRequest } from "next/server";
import { verifyBasicAuth } from "@/lib/auth/basic-auth";

function requireAuth(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Onboarding Dashboard", charset="UTF-8"' },
  });
}

export function middleware(req: NextRequest) {
  const ok = verifyBasicAuth(
    req.headers.get("authorization"),
    process.env.BASIC_AUTH_USER,
    process.env.BASIC_AUTH_PASSWORD,
  );
  return ok ? NextResponse.next() : requireAuth();
}

export const config = {
  // Gate everything except Next internals and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
