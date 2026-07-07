"use client";

import { Button } from "@/components/ui/button";

// Error boundary for the summary route. Never shows stack traces or DB details.
export default function SummaryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">The summary could not be loaded. Please try again.</p>
      <Button onClick={reset} className="mt-4">
        Retry
      </Button>
    </div>
  );
}
