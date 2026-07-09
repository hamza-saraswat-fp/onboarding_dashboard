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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Format an ISO week-start key ("2026-06-02") as "Jun 2" without timezone drift.
function weekLabel(key: string): string {
  const [, month, day] = key.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

// New links per week within the selected range. Each bar is labeled with its
// count and week so the trend is readable; the caption gives the total.
export function VolumeCard({ volume }: { volume: VolumePoint[] }) {
  const max = Math.max(1, ...volume.map((v) => v.count));
  const total = volume.reduce((sum, v) => sum + v.count, 0);
  // With many weeks, per-bar labels would collide; show counts only when there
  // is room, and thin the week labels to the two ends.
  const showAllLabels = volume.length <= 8;

  return (
    <Card>
      <CardHeader>
        <CardTitle>New links per week</CardTitle>
      </CardHeader>
      <CardContent>
        {volume.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No links in this range.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-end gap-1.5">
              {volume.map((v, i) => {
                const showLabel = showAllLabels || i === 0 || i === volume.length - 1;
                return (
                  <div key={v.key} className="flex flex-1 flex-col items-center gap-1">
                    {showAllLabels ? (
                      <span className="text-[11px] tabular-nums text-muted-foreground">{v.count}</span>
                    ) : null}
                    <div className="flex h-16 w-full items-end" title={`Week of ${weekLabel(v.key)}: ${v.count}`}>
                      <div
                        className="w-full rounded-t bg-fp-sky"
                        style={{ height: `${Math.max(6, (v.count / max) * 100)}%` }}
                      />
                    </div>
                    <span className="h-3.5 text-[11px] tabular-nums text-muted-foreground">
                      {showLabel ? weekLabel(v.key) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-2 text-xs text-muted-foreground tabular-nums">
              {total} links total across {volume.length} {volume.length === 1 ? "week" : "weeks"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
