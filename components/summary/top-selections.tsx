import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopSelection } from "@/lib/metrics/selections";

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
  return `${mod} · ${readable}`;
}

// Highest-volume selections: the options customers pick most, ranked across all
// modules. The readable answer to "what are people choosing" without the wall of
// per-field bars we had before.
export function TopSelections({ rows }: { rows: TopSelection[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most common selections</CardTitle>
        <CardDescription>The options customers choose most, across all modules.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No selections in this range.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li
                key={`${r.moduleKey}.${r.field}.${r.value}`}
                className="grid grid-cols-[1fr_10rem] items-center gap-4 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{r.value}</div>
                  <div className="truncate text-xs text-muted-foreground">{labelFor(r.moduleKey, r.field)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-fp-cobalt"
                      style={{ width: `${Math.round((r.count / max) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{r.count}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
