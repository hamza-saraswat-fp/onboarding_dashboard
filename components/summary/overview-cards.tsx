import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WizardStatus } from "@/lib/types";

const LIFECYCLE_ORDER: { key: WizardStatus; label: string; bar: string; dot: string }[] = [
  { key: "completed", label: "Completed", bar: "bg-green-500", dot: "bg-green-500" },
  { key: "in_progress", label: "In progress", bar: "bg-fp-cobalt", dot: "bg-fp-cobalt" },
  { key: "expired", label: "Expired", bar: "bg-amber-500", dot: "bg-amber-500" },
  { key: "submission_failed", label: "Failed", bar: "bg-destructive", dot: "bg-destructive" },
];

// Lifecycle mix as a single stacked bar plus a labeled legend with counts, so
// "how many links finished vs stalled vs expired vs failed" reads at a glance.
export function LifecycleCard({ lifecycle }: { lifecycle: Record<WizardStatus, number> }) {
  const total = LIFECYCLE_ORDER.reduce((sum, s) => sum + lifecycle[s.key], 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {total > 0
            ? LIFECYCLE_ORDER.map((s) =>
                lifecycle[s.key] > 0 ? (
                  <div
                    key={s.key}
                    className={s.bar}
                    style={{ width: `${(lifecycle[s.key] / total) * 100}%` }}
                    title={`${s.label}: ${lifecycle[s.key]}`}
                  />
                ) : null,
              )
            : null}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {LIFECYCLE_ORDER.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${s.dot}`} aria-hidden />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto tabular-nums text-foreground">{lifecycle[s.key]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export interface VolumePoint {
  key: string;
  count: number;
}

// Links created per week within the selected range, as compact bars. Answers
// "are we generating more onboarding links over time" without a full chart.
export function VolumeCard({ volume }: { volume: VolumePoint[] }) {
  const max = Math.max(1, ...volume.map((v) => v.count));
  const total = volume.reduce((sum, v) => sum + v.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links over time</CardTitle>
      </CardHeader>
      <CardContent>
        {volume.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No links in this range.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex h-20 items-end gap-1">
              {volume.map((v) => (
                <div
                  key={v.key}
                  className="flex-1 rounded-t bg-fp-sky"
                  style={{ height: `${Math.max(4, (v.count / max) * 100)}%` }}
                  title={`Week of ${v.key}: ${v.count}`}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {total} links across {volume.length} {volume.length === 1 ? "week" : "weeks"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
