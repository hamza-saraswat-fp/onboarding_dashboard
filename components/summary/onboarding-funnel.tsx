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

// A readable onboarding funnel: one row per module in order, each bar scaled to
// the total number of accounts. The light segment is how many accounts reached
// the step; the filled segment is how many completed it. Bars shrink down the
// list (the funnel), and the gap between light and filled is where accounts
// stall on a step.
export function OnboardingFunnel({ steps, totalLinks }: { steps: ModuleDropOff[]; totalLinks: number }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Onboarding funnel</CardTitle>
        <CardDescription>How far accounts get through the setup steps.</CardDescription>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-fp-sky/40" aria-hidden />
            Reached
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
            Completed
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {steps.length === 0 || totalLinks === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No module activity in this range.</p>
        ) : (
          <div className="space-y-2">
            {steps.map((s) => {
              const reachedPct = Math.round((s.reached / totalLinks) * 100);
              const completedPct = Math.round((s.completed / totalLinks) * 100);
              return (
                <div key={s.moduleKey} className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3 text-sm">
                  <span className="truncate text-muted-foreground" title={MODULE_LABELS[s.moduleKey] ?? s.moduleKey}>
                    {MODULE_LABELS[s.moduleKey] ?? s.moduleKey}
                  </span>
                  <div className="relative h-5 w-full overflow-hidden rounded bg-muted/50">
                    <div className="absolute inset-y-0 left-0 rounded bg-fp-sky/40" style={{ width: `${reachedPct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded bg-primary" style={{ width: `${completedPct}%` }} />
                  </div>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {s.completed}/{s.reached}
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
