import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleDropOff } from "@/lib/metrics/modules";

const MODULE_LABELS: Record<string, string> = {
  generalInfo: "General info",
  customers: "Customers",
  jobs: "Jobs",
  clearpath: "ClearPath",
  estimatesInvoices: "Estimates and invoices",
  communications: "Communications",
  customForms: "Custom forms",
  userSetup: "User setup",
  teamsSetup: "Teams setup",
};

// Onboarding drop-off funnel: of the accounts that started, how many reach each
// setup step, in order. Each bar is the share of starters who reached that step,
// so the shape shows exactly where people fall off. Scaling to starters (not to
// every generated link) is what makes the drop-off legible: unsent links, which
// never reach any step, are not in the denominator.
export function OnboardingFunnel({
  steps,
  totalLinks,
  startedCount,
}: {
  steps: ModuleDropOff[];
  totalLinks: number;
  startedCount: number;
}) {
  const startedPct = totalLinks === 0 ? 0 : Math.round((startedCount / totalLinks) * 100);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Onboarding funnel</CardTitle>
        <CardDescription>Of the accounts that started, how far they get through setup.</CardDescription>
        <p className="mt-1 text-xs text-muted-foreground">
          Started:{" "}
          <span className="font-medium tabular-nums text-foreground">{startedCount}</span> of{" "}
          <span className="tabular-nums">{totalLinks}</span> links ({startedPct}% answered the first question)
        </p>
      </CardHeader>
      <CardContent>
        {steps.length === 0 || startedCount === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No accounts have started in this range.</p>
        ) : (
          <div className="space-y-2.5">
            {steps.map((s) => {
              const pct = Math.min(100, Math.round((s.reached / startedCount) * 100));
              return (
                <div key={s.moduleKey} className="grid grid-cols-[8rem_1fr_5.5rem] items-center gap-3 text-sm">
                  <span className="truncate text-muted-foreground" title={MODULE_LABELS[s.moduleKey] ?? s.moduleKey}>
                    {MODULE_LABELS[s.moduleKey] ?? s.moduleKey}
                  </span>
                  <div className="relative h-6 w-full overflow-hidden rounded bg-muted/50">
                    <div className="absolute inset-y-0 left-0 rounded bg-fp-cobalt" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {s.reached} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
