"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SummaryMetrics {
  totalLinks: number;
  totalCompletions: number;
  completionRate: number; // 0..1
  avgProgress: number; // 0..1
  timeToComplete: { meanMs: number; medianMs: number } | null;
  totalSubmissions: number;
  submissionOutcomes: { success: number; failed: number; skipped: number };
  lifecycle: Record<"in_progress" | "completed" | "expired" | "submission_failed", number>;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function formatDays(ms: number): string {
  return `${(ms / (24 * 60 * 60 * 1000)).toFixed(1)} days`;
}

// A labeled placeholder section. Later milestone-5 issues replace the body of
// each with real tiles and charts.
function Section({ title, note, children }: { title: string; note: string; children?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children ?? <p className="text-sm text-muted-foreground">{note}</p>}</CardContent>
    </Card>
  );
}

// Client shell for the company summary. It arranges the sections (desktop-first)
// and, for now, renders the computed metrics as a minimal preview inside the KPI
// slot so data loading is visible end to end.
export function SummaryView({ range, summary }: { range: string; summary: SummaryMetrics }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Company Summary</h1>
        <p className="text-sm text-muted-foreground">Onboarding funnel across all accounts.</p>
      </div>

      <Section title="Filters" note="Date-range and breakdown controls arrive in COR2-19.">
        <p className="text-sm text-muted-foreground">
          Date range: <span className="font-medium text-foreground">{range}</span>
        </p>
      </Section>

      <Section title="KPI tiles" note="Styled tiles arrive in COR2-15.">
        <ul className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <li>Links generated: <strong className="text-foreground">{summary.totalLinks}</strong></li>
          <li>Completions: <strong className="text-foreground">{summary.totalCompletions}</strong></li>
          <li>Completion rate: <strong className="text-foreground">{formatPercent(summary.completionRate)}</strong></li>
          <li>Avg progress: <strong className="text-foreground">{formatPercent(summary.avgProgress)}</strong></li>
          <li>Submissions: <strong className="text-foreground">{summary.totalSubmissions}</strong></li>
          <li>
            Avg time to complete:{" "}
            <strong className="text-foreground">
              {summary.timeToComplete ? formatDays(summary.timeToComplete.meanMs) : "n/a"}
            </strong>
          </li>
        </ul>
      </Section>

      <Section title="Funnel and drop-off" note="Lifecycle and module drop-off charts arrive in COR2-16." />
      <Section title="Selection insights" note="Selection distribution and correlation arrive in COR2-17." />
      <Section title="Trends" note="Trends over time and before/after comparison arrive in COR2-18." />
    </div>
  );
}
