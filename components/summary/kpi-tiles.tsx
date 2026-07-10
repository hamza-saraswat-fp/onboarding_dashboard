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

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

// Headline KPI tiles for the summary. Presentational: all values come from the
// already-computed summary metrics passed by the page. The funnel reads left to
// right: Links generated -> Started -> Completions, with the two rates that
// connect those counts. "Completion rate" is of accounts that started, not of
// every link generated, since links are auto-created for accounts that are never
// sent one; the Start rate tile exposes that gap.
export function KpiTiles({ summary }: { summary: SummaryMetrics }) {
  const ttc = summary.timeToComplete;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      <Tile label="Links generated" value={String(summary.totalLinks)} />
      <Tile label="Started" value={String(summary.startedCount)} hint="answered the first question" />
      <Tile label="Completions" value={String(summary.totalCompletions)} />
      <Tile label="Start rate" value={formatPercent(summary.startRate)} hint="of links generated" />
      <Tile
        label="Completion rate"
        value={formatPercent(summary.completionRateOfStarted)}
        hint="of accounts that started"
      />
      <Tile label="Avg progress" value={formatPercent(summary.avgProgress)} />
      <Tile label="Avg time to complete" value={ttc ? humanizeMs(ttc.meanMs) : "n/a"} />
      <Tile label="Median time to complete" value={ttc ? humanizeMs(ttc.medianMs) : "n/a"} />
      <Tile label="Submissions" value={String(summary.totalSubmissions)} />
    </div>
  );
}
