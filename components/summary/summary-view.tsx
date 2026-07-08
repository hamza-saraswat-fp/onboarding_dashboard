"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleDropOff } from "@/lib/metrics/modules";
import type { SelectionCorrelation, SelectionField } from "@/lib/metrics/selections";
import { KpiTiles } from "./kpi-tiles";
import { FunnelCharts } from "./funnel-charts";
import { SelectionInsights } from "./selection-insights";
import { Trends, type TrendPoint } from "./trends";
import { Filters } from "./filters";
import { BreakdownTable, type BreakdownRow } from "./breakdown-table";
import { AccountsTable, type AccountRow } from "./accounts-table";

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

// Client shell for the company summary. The headline KPIs and the accounts table
// are always visible; the heavier funnel / selection / trend charts live behind a
// disclosure so the page opens compact and the accounts list is the focus.
export function SummaryView({
  range,
  breakdown,
  summary,
  moduleDropOff,
  selectionDistribution,
  selectionCorrelation,
  trends,
  breakdownData,
  accountRows,
}: {
  range: string;
  breakdown: string;
  summary: SummaryMetrics;
  moduleDropOff: ModuleDropOff[];
  selectionDistribution: SelectionField[];
  selectionCorrelation: SelectionCorrelation[];
  trends: { weekly: TrendPoint[]; monthly: TrendPoint[] };
  breakdownData: { dimension: string; rows: BreakdownRow[] } | null;
  accountRows: AccountRow[];
}) {
  // Open insights automatically when a breakdown is active (the user asked for it).
  const [showInsights, setShowInsights] = useState(breakdownData !== null);

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

          <div className="rounded-xl ring-1 ring-foreground/10">
            <button
              type="button"
              onClick={() => setShowInsights((v) => !v)}
              aria-expanded={showInsights}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <span className="text-base font-medium text-foreground">Funnel and insights</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {showInsights ? "Hide" : "Show"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform duration-200 ${showInsights ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>

            {showInsights ? (
              <div className="space-y-4 border-t px-4 py-4">
                {breakdownData ? (
                  <BreakdownTable dimensionLabel={breakdownData.dimension} rows={breakdownData.rows} />
                ) : null}
                <FunnelCharts lifecycle={summary.lifecycle} moduleDropOff={moduleDropOff} />
                <SelectionInsights distribution={selectionDistribution} correlation={selectionCorrelation} />
                <Trends weekly={trends.weekly} monthly={trends.monthly} />
              </div>
            ) : null}
          </div>

          <AccountsTable rows={accountRows} />
        </>
      )}
    </div>
  );
}
