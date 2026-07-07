import { listSessions, listModuleData, listImportJobs } from "@/lib/queries/sessions";
import { filterByDateRange } from "@/lib/metrics/filters";
import {
  totalLinks,
  totalCompletions,
  completionRate,
  avgProgress,
  timeToComplete,
  lifecycleBreakdown,
} from "@/lib/metrics/summary";
import { moduleDropOff } from "@/lib/metrics/modules";
import { selectionDistribution, selectionCompletionCorrelation } from "@/lib/metrics/selections";
import { SummaryView, type SummaryMetrics } from "@/components/summary/summary-view";

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

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = resolveRange(params.range);
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
  const distribution = selectionDistribution(moduleData);
  const correlation = selectionCompletionCorrelation(sessions, moduleData);

  return (
    <SummaryView
      range={range}
      summary={summary}
      moduleDropOff={dropOff}
      selectionDistribution={distribution}
      selectionCorrelation={correlation}
    />
  );
}
