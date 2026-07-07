"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelectionCorrelation, SelectionField } from "@/lib/metrics/selections";

const MODULE_LABELS: Record<string, string> = {
  generalInfo: "General info",
  customers: "Customers",
  jobs: "Jobs",
  clearpath: "ClearPath",
  estimatesInvoices: "Estimates",
  communications: "Comms",
  customForms: "Custom forms",
  userSetup: "Users",
  teamsSetup: "Teams",
};

function labelFor(moduleKey: string, field: string): string {
  const mod = MODULE_LABELS[moduleKey] ?? moduleKey;
  const readable = field
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return `${mod} - ${readable}`;
}

function ProportionBar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <div className="h-2 w-full rounded bg-muted">
      <div className="h-2 rounded" style={{ width: `${Math.round(ratio * 100)}%`, backgroundColor: color }} />
    </div>
  );
}

// Selection distribution (which options are chosen, including never-chosen ones)
// and how each selection correlates with completion. Ranked lists with
// brand-colored proportion bars keep the many fields and values readable.
// Presentational: the metrics are computed on the page.
export function SelectionInsights({
  distribution,
  correlation,
}: {
  distribution: SelectionField[];
  correlation: SelectionCorrelation[];
}) {
  // Fields with a real choice among options (multi-option fields, which also
  // surface never-chosen options as zeros).
  const fields = distribution.filter((f) => f.options.length >= 2);
  const topCorrelation = [...correlation]
    .sort((a, b) => b.sessions - a.sessions || b.completionRate - a.completionRate)
    .slice(0, 12);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Selection distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No selections in the selected range.</p>
          ) : (
            fields.map((f) => {
              const max = Math.max(1, ...f.options.map((o) => o.count));
              return (
                <div key={`${f.moduleKey}.${f.field}`} className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {labelFor(f.moduleKey, f.field)}
                  </div>
                  <ul className="space-y-1.5">
                    {f.options.map((o) => (
                      <li key={o.value} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-sm">
                        <span className={o.count === 0 ? "truncate text-muted-foreground" : "truncate text-foreground"}>
                          {o.value}
                        </span>
                        <ProportionBar ratio={o.count / max} color="var(--chart-1)" />
                        <span className="text-right tabular-nums text-muted-foreground">{o.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selection to completion</CardTitle>
        </CardHeader>
        <CardContent>
          {topCorrelation.length === 0 ? (
            <p className="text-sm text-muted-foreground">No selections in the selected range.</p>
          ) : (
            <ul className="space-y-2.5">
              {topCorrelation.map((c) => (
                <li
                  key={`${c.moduleKey}.${c.field}.${c.value}`}
                  className="grid grid-cols-[9rem_1fr_3rem] items-center gap-2 text-sm"
                >
                  <span className="truncate text-foreground" title={`${labelFor(c.moduleKey, c.field)}: ${c.value}`}>
                    {c.value}
                  </span>
                  <ProportionBar ratio={c.completionRate} color="var(--chart-3)" />
                  <span className="text-right tabular-nums text-muted-foreground">
                    {Math.round(c.completionRate * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
