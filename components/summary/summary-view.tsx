"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ModuleDropOff } from "@/lib/metrics/modules";
import type { SelectionCorrelation, SelectionField } from "@/lib/metrics/selections";
import { KpiTiles } from "./kpi-tiles";
import { FunnelCharts } from "./funnel-charts";
import { SelectionInsights } from "./selection-insights";
import { Trends, type TrendPoint } from "./trends";
import { Filters } from "./filters";
import { BreakdownTable, type BreakdownRow } from "./breakdown-table";
import { SessionsTable, type SessionRow } from "./sessions-table";

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

// Client shell for the company summary. Arranges the controls, tiles, and charts
// (desktop-first). All heavy computation happens on the page.
export function SummaryView({
  range,
  breakdown,
  summary,
  moduleDropOff,
  selectionDistribution,
  selectionCorrelation,
  trends,
  breakdownData,
  sessionRows,
}: {
  range: string;
  breakdown: string;
  summary: SummaryMetrics;
  moduleDropOff: ModuleDropOff[];
  selectionDistribution: SelectionField[];
  selectionCorrelation: SelectionCorrelation[];
  trends: { weekly: TrendPoint[]; monthly: TrendPoint[] };
  breakdownData: { dimension: string; rows: BreakdownRow[] } | null;
  sessionRows: SessionRow[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Company Summary</h1>
        <p className="text-sm text-muted-foreground">Onboarding funnel across all accounts.</p>
      </div>

      <Filters range={range} breakdown={breakdown} />

      {summary.totalLinks === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No onboarding links in the selected range. Try a wider date range.
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiTiles summary={summary} />

          {breakdownData ? (
            <BreakdownTable dimensionLabel={breakdownData.dimension} rows={breakdownData.rows} />
          ) : null}

          <FunnelCharts lifecycle={summary.lifecycle} moduleDropOff={moduleDropOff} />

          <SelectionInsights distribution={selectionDistribution} correlation={selectionCorrelation} />

          <Trends weekly={trends.weekly} monthly={trends.monthly} />

          <SessionsTable rows={sessionRows} />
        </>
      )}
    </div>
  );
}
