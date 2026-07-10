"use client";

import { useState } from "react";
import type { ModuleDropOff } from "@/lib/metrics/modules";
import type { SelectionSection } from "@/lib/metrics/selections";
import type { AccountRow } from "@/lib/queries/account";
import { KpiTiles } from "./kpi-tiles";
import { OnboardingFunnel } from "./onboarding-funnel";
import { LifecycleCard, VolumeCard, type VolumePoint } from "./overview-cards";
import { TopSelections } from "./top-selections";
import { Trends, type TrendPoint } from "./trends";
import { RangeFilter, BreakdownFilter } from "./filters";
import { BreakdownTable, type BreakdownRow } from "./breakdown-table";
import { AccountsTable } from "./accounts-table";

export interface SummaryMetrics {
  totalLinks: number;
  startedCount: number;
  totalCompletions: number;
  startRate: number; // 0..1, started / generated
  completionRateOfStarted: number; // 0..1, completed / started
  avgProgress: number; // 0..1
  timeToComplete: { meanMs: number; medianMs: number } | null;
  totalSubmissions: number;
  submissionOutcomes: { success: number; failed: number; skipped: number };
  lifecycle: Record<"in_progress" | "completed" | "expired" | "submission_failed", number>;
}

// The whole dashboard on one page: a company overview scoped to the selected
// date range (KPIs, funnel, status, volume), the heavier trends / selections /
// breakdowns behind a disclosure, and the full accounts list (every account,
// with the drill-down drawer) below.
export function SummaryView({
  range,
  breakdown,
  summary,
  moduleDropOff,
  volume,
  topSelections,
  trends,
  breakdownData,
  accountRows,
  testAccountRows,
}: {
  range: string;
  breakdown: string;
  summary: SummaryMetrics;
  moduleDropOff: ModuleDropOff[];
  volume: VolumePoint[];
  topSelections: SelectionSection[];
  trends: { weekly: TrendPoint[]; monthly: TrendPoint[] };
  breakdownData: { dimension: string; rows: BreakdownRow[] } | null;
  accountRows: AccountRow[];
  testAccountRows: AccountRow[];
}) {
  // Open insights automatically when a breakdown is active (the user asked for it).
  const [showInsights, setShowInsights] = useState(breakdownData !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Onboarding funnel for the selected range, and every account.
          </p>
        </div>
        <RangeFilter range={range} />
      </div>

      <KpiTiles summary={summary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OnboardingFunnel
            steps={moduleDropOff}
            totalLinks={summary.totalLinks}
            startedCount={summary.startedCount}
          />
        </div>
        <div className="space-y-4">
          <LifecycleCard lifecycle={summary.lifecycle} />
          <VolumeCard volume={volume} />
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <button
          type="button"
          onClick={() => setShowInsights((v) => !v)}
          aria-expanded={showInsights}
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
        >
          <span className="text-base font-medium text-foreground">Trends, selections, and breakdowns</span>
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
            <div className="flex justify-end">
              <BreakdownFilter breakdown={breakdown} />
            </div>
            {breakdownData ? (
              <BreakdownTable dimensionLabel={breakdownData.dimension} rows={breakdownData.rows} />
            ) : null}
            <TopSelections sections={topSelections} />
            <Trends weekly={trends.weekly} monthly={trends.monthly} />
          </div>
        ) : null}
      </div>

      <AccountsTable rows={accountRows} />

      {testAccountRows.length > 0 ? (
        <AccountsTable rows={testAccountRows} title="Test accounts" collapsible defaultCollapsed />
      ) : null}
    </div>
  );
}
