import Image from "next/image";
import { signIn } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Branded sign-in page. Replaces the default Auth.js sign-in screen (wired via
// pages.signIn in lib/auth). It echoes the app shell: a navy band with the white
// FieldPulse logo over a white card. The single action starts the Google OAuth
// flow through an Auth.js server action, so no client component is needed.
//
// This route is public (excluded from the middleware matcher); the allowlist gate
// still runs after Google returns, redirecting non-allowlisted accounts to /403.

// A callbackUrl only counts when it is a same-origin relative path, so a crafted
// ?callbackUrl=https://evil.example can never turn this into an open redirect.
function safeCallback(value: string | string[] | undefined): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

// Friendly copy for the Auth.js error codes that can land back on this page.
function errorMessage(code: string | string[] | undefined): string | null {
  if (typeof code !== "string") return null;
  if (code === "AccessDenied") return "That account is not authorized for this dashboard.";
  if (code === "Configuration") return "Sign-in is temporarily unavailable. Please try again later.";
  return "Something went wrong signing you in. Please try again.";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallback(params.callbackUrl);
  const error = errorMessage(params.error);

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-fp-fog/40 to-background px-6 py-12">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex justify-center bg-fp-navy px-8 py-8">
          <Image src="/fieldpulse-logo-white.png" alt="FieldPulse" width={150} height={32} priority />
        </div>

        <div className="px-8 py-8 text-center">
          <h1 className="text-base font-semibold text-foreground">Onboarding Dashboard</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Internal analytics for the FieldPulse onboarding funnel.
          </p>

          {error && (
            <p className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full gap-2.5 px-4 text-sm font-medium")}
            >
              <GoogleG />
              Sign in with Google
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Access is limited to allowlisted FieldPulse accounts.
          </p>
        </div>
      </div>
    </main>
  );
}

// Google "G" in its official four colors, sized to the button's icon slot.
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
