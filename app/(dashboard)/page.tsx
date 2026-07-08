import { listSessions, listModuleData, listImportJobs } from "@/lib/queries/sessions";
import {
  filterByDateRange,
  bucketByWeek,
  bucketByMonth,
  groupByDimension,
  type SessionBucket,
  type Dimension,
} from "@/lib/metrics/filters";
import {
  totalLinks,
  totalCompletions,
  completionRate,
  avgProgress,
  timeToComplete,
  lifecycleBreakdown,
} from "@/lib/metrics/summary";
import { moduleDropOff } from "@/lib/metrics/modules";
import { topSelectionsBySection } from "@/lib/metrics/selections";
import { SummaryView, type SummaryMetrics } from "@/components/summary/summary-view";
import type { TrendPoint } from "@/components/summary/trends";
import type { BreakdownRow } from "@/components/summary/breakdown-table";
import type { AccountRow } from "@/lib/queries/account";

// The summary reads live data per request; never statically prerender it.
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// Date-range presets. null means "all time" (no lower bound).
const RANGE_DAYS: Record<string, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

function resolveRange(range: string | undefined): string {
  return range && range in RANGE_DAYS ? range : "30d";
}

const DIMENSION_LABELS: Record<Dimension, string> = {
  salesSegment: "Sales Segment",
  industry: "Industry",
  numberOfEmployees: "Number of Employees",
};

function resolveDimension(value: string | undefined): Dimension | null {
  return value === "salesSegment" || value === "industry" || value === "numberOfEmployees" ? value : null;
}

// One trend point per time bucket, reusing the metric functions. Rates are
// derived from the bucket's own sessions so aggregation stays correct.
function toTrendPoint(bucket: SessionBucket): TrendPoint {
  const rate = completionRate(bucket.sessions);
  const ttc = timeToComplete(bucket.sessions);
  return {
    key: bucket.key,
    volume: bucket.sessions.length,
    completions: totalCompletions(bucket.sessions),
    completionRate: rate,
    dropOffRate: 1 - rate,
    avgTimeToCompleteMs: ttc ? ttc.meanMs : null,
  };
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; breakdown?: string }>;
}) {
  const params = await searchParams;
  const range = resolveRange(params.range);
  const dimension = resolveDimension(params.breakdown);
  const days = RANGE_DAYS[range];

  const [allSessions, allModuleData, allImportJobs] = await Promise.all([
    listSessions(),
    listModuleData(),
    listImportJobs(),
  ]);

  // Scope by the selected date range (on createdAt), then narrow the module and
  // import rows to the surviving sessions so every metric agrees on the window.
  let sessions = allSessions;
  if (days !== null) {
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY_MS);
    sessions = filterByDateRange(allSessions, from, to);
  }
  const sessionIds = new Set(sessions.map((s) => s.id));
  const moduleData = allModuleData.filter((m) => sessionIds.has(m.sessionId));
  const importJobs = allImportJobs.filter((j) => sessionIds.has(j.sessionId));

  const summary: SummaryMetrics = {
    totalLinks: totalLinks(sessions),
    totalCompletions: totalCompletions(sessions),
    completionRate: completionRate(sessions),
    avgProgress: avgProgress(sessions, moduleData),
    timeToComplete: timeToComplete(sessions),
    totalSubmissions: sessions.filter((s) => s.submittedAt !== null).length,
    submissionOutcomes: {
      success: importJobs.filter((j) => j.status === "success").length,
      failed: importJobs.filter((j) => j.status === "failed").length,
      skipped: importJobs.filter((j) => j.status === "skipped").length,
    },
    lifecycle: lifecycleBreakdown(sessions),
  };

  const dropOff = moduleDropOff(sessions, moduleData);

  // Highest-volume selections within the selected range (company metric),
  // grouped into the curated sections.
  const topPicks = topSelectionsBySection(moduleData);

  // Links created per week within the selected range, for the overview strip.
  const volume = bucketByWeek(sessions).map((b) => ({ key: b.key, count: b.sessions.length }));

  // The accounts list is every account, not date-scoped: the table has its own
  // search / status filter / pagination, and scoping the finder to the KPI range
  // would hide most accounts by default.
  const allAgg = new Map<string, { total: number; complete: number }>();
  for (const m of allModuleData) {
    const a = allAgg.get(m.sessionId) ?? { total: 0, complete: 0 };
    a.total += 1;
    if (m.isComplete) a.complete += 1;
    allAgg.set(m.sessionId, a);
  }
  const accountRows: AccountRow[] = allSessions.map((s) => {
    const a = allAgg.get(s.id);
    const name = s.salesforceData?.companyName;
    return {
      id: s.id,
      companyId: s.companyId,
      companyName: typeof name === "string" && name.trim() !== "" ? name : null,
      status: s.status,
      progress: a && a.total > 0 ? a.complete / a.total : 0,
      modulesComplete: a?.complete ?? 0,
      modulesTotal: a?.total ?? 0,
      createdAt: s.createdAt,
    };
  });

  // Trends span the full history (independent of the KPI date range) so the
  // timeline has enough buckets to be meaningful.
  const trends = {
    weekly: bucketByWeek(allSessions).map(toTrendPoint),
    monthly: bucketByMonth(allSessions).map(toTrendPoint),
  };

  // When a breakdown dimension is active, group the (date-scoped) sessions and
  // compute the key metrics per group.
  let breakdownData: { dimension: string; rows: BreakdownRow[] } | null = null;
  if (dimension) {
    const groups = groupByDimension(sessions, dimension);
    const rows: BreakdownRow[] = Object.entries(groups)
      .map(([value, groupSessions]) => {
        const ids = new Set(groupSessions.map((s) => s.id));
        const groupModules = moduleData.filter((m) => ids.has(m.sessionId));
        return {
          value,
          totalLinks: totalLinks(groupSessions),
          totalCompletions: totalCompletions(groupSessions),
          completionRate: completionRate(groupSessions),
          avgProgress: avgProgress(groupSessions, groupModules),
        };
      })
      .sort((a, b) => b.totalLinks - a.totalLinks);
    breakdownData = { dimension: DIMENSION_LABELS[dimension], rows };
  }

  return (
    <SummaryView
      range={range}
      breakdown={dimension ?? "none"}
      summary={summary}
      moduleDropOff={dropOff}
      volume={volume}
      topSelections={topPicks}
      trends={trends}
      breakdownData={breakdownData}
      accountRows={accountRows}
    />
  );
}
