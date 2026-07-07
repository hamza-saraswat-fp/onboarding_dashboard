import { formatDuration, intervalToDuration } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryMetrics } from "./summary-view";

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// Humanize a duration in ms via date-fns (e.g. "2 days", "3 hours 20 minutes").
function humanizeMs(ms: number): string {
  const duration = intervalToDuration({ start: 0, end: Math.round(ms) });
  const formatted = formatDuration(duration, { format: ["days", "hours", "minutes"], zero: false });
  return formatted || "under a minute";
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

// Headline KPI tiles for the summary. Presentational: all values come from the
// already-computed summary metrics passed by the page.
export function KpiTiles({ summary }: { summary: SummaryMetrics }) {
  const ttc = summary.timeToComplete;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      <Tile label="Links generated" value={String(summary.totalLinks)} />
      <Tile label="Completions" value={String(summary.totalCompletions)} />
      <Tile label="Completion rate" value={formatPercent(summary.completionRate)} />
      <Tile label="Avg progress" value={formatPercent(summary.avgProgress)} />
      <Tile label="Avg time to complete" value={ttc ? humanizeMs(ttc.meanMs) : "n/a"} />
      <Tile label="Median time to complete" value={ttc ? humanizeMs(ttc.medianMs) : "n/a"} />
      <Tile label="Submissions" value={String(summary.totalSubmissions)} />
    </div>
  );
}
