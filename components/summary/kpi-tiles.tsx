import type { ReactNode } from "react";
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

// Decorative inline glyphs (no icon dependency; the repo uses inline SVG).
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function LinkGlyph() {
  return (
    <svg {...svgProps} className="size-4">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

function FlagGlyph() {
  return (
    <svg {...svgProps} className="size-4">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg {...svgProps} className="size-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// One funnel stage in the hero band: a colored glyph chip, a label, the count,
// and an optional caption.
function Stage({
  glyph,
  chip,
  label,
  value,
  sub,
}: {
  glyph: ReactNode;
  chip: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-1 items-start gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-white ${chip}`}>
        {glyph}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-3xl font-semibold leading-none tabular-nums text-fp-navy">{value}</div>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  );
}

// The conversion between two stages: an arrow and the rate. Arrow points down
// when the band stacks (mobile), right when it is a row (sm and up).
function Connector({ rate, label }: { rate: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 sm:flex-col sm:gap-1 sm:px-1">
      <svg {...svgProps} className="size-4 rotate-90 text-fp-cobalt/50 sm:rotate-0">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
      <div className="text-center leading-tight">
        <div className="text-sm font-semibold tabular-nums text-fp-cobalt">{rate}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// A quiet secondary stat tile with a small colored marker.
function Stat({ label, value, dot, hint }: { label: string; value: string; dot: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
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

// Headline KPIs in two rows. Row one is the conversion funnel (Links generated
// -> Started -> Completions) with the two rates woven in as the connectors, so
// each count shows how it converts from the stage before. "Completion rate" is
// of accounts that started, not of every link generated, since links are
// auto-created for accounts that are never sent one; the Start rate connector
// exposes that gap. Row two holds the quieter, standalone stats.
export function KpiTiles({ summary }: { summary: SummaryMetrics }) {
  const ttc = summary.timeToComplete;
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-fp-navy/[0.08] via-fp-cobalt/[0.06] to-fp-sky/[0.14] ring-1 ring-fp-cobalt/15">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-stretch sm:gap-3">
          <Stage glyph={<LinkGlyph />} chip="bg-fp-navy" label="Links generated" value={String(summary.totalLinks)} />
          <Connector rate={formatPercent(summary.startRate)} label="start rate" />
          <Stage
            glyph={<FlagGlyph />}
            chip="bg-fp-cobalt"
            label="Started"
            value={String(summary.startedCount)}
            sub="answered the first question"
          />
          <Connector rate={formatPercent(summary.completionRateOfStarted)} label="completion rate" />
          <Stage
            glyph={<CheckGlyph />}
            chip="bg-fp-sky"
            label="Completions"
            value={String(summary.totalCompletions)}
            sub="of accounts that started"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Avg progress"
          value={formatPercent(summary.avgProgress)}
          hint="of accounts that started"
          dot="bg-fp-cobalt"
        />
        <Stat
          label="Avg time to complete"
          value={ttc ? humanizeMs(ttc.meanMs) : "n/a"}
          hint="from first answer to submit"
          dot="bg-fp-sky"
        />
        <Stat
          label="Median time to complete"
          value={ttc ? humanizeMs(ttc.medianMs) : "n/a"}
          hint="from first answer to submit"
          dot="bg-fp-aqua"
        />
        <Stat
          label="Import success"
          value={summary.importSuccessRate === null ? "n/a" : formatPercent(summary.importSuccessRate)}
          hint="of setups submitted"
          dot="bg-fp-quartz"
        />
      </div>
    </div>
  );
}
