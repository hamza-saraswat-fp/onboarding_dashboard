"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiTiles } from "./kpi-tiles";

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

// A labeled placeholder section. Later milestone-5 issues replace these with the
// real charts and controls.
function Section({ title, note }: { title: string; note: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

// Client shell for the company summary. Arranges the sections (desktop-first).
export function SummaryView({ range, summary }: { range: string; summary: SummaryMetrics }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Company Summary</h1>
        <p className="text-sm text-muted-foreground">Onboarding funnel across all accounts.</p>
      </div>

      <Section title="Filters" note={`Date range: ${range}. Controls arrive in COR2-19.`} />

      <KpiTiles summary={summary} />

      <Section title="Funnel and drop-off" note="Lifecycle and module drop-off charts arrive in COR2-16." />
      <Section title="Selection insights" note="Selection distribution and correlation arrive in COR2-17." />
      <Section title="Trends" note="Trends over time and before/after comparison arrive in COR2-18." />
    </div>
  );
}
