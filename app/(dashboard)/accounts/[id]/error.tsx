"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Error boundary for the account detail route. Never shows stack traces or DB
// details.
export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">This account could not be loaded. Please try again.</p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Back to summary
        </Link>
      </div>
    </div>
  );
}
