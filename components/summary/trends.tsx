"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TrendPoint } from "@/lib/metrics/summary";

// Re-exported so component consumers can keep importing the shape from here; the
// canonical definition lives with the metric functions in lib/metrics/summary.
export type { TrendPoint };

type Metric = "volume" | "startRate" | "completionRate" | "dropOffRate" | "avgTime";
type Granularity = "weekly" | "monthly";

const DAY_MS = 24 * 60 * 60 * 1000;

const METRICS: { key: Metric; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "startRate", label: "Start rate" },
  { key: "completionRate", label: "Completion rate" },
  { key: "dropOffRate", label: "Drop-off" },
  { key: "avgTime", label: "Avg time to complete" },
];

function metricValue(p: TrendPoint, metric: Metric): number {
  if (metric === "volume") return p.volume;
  if (metric === "startRate") return p.volume === 0 ? 0 : Math.round((p.started / p.volume) * 100);
  if (metric === "completionRate") return Math.round(p.completionRate * 100);
  if (metric === "dropOffRate") return Math.round(p.dropOffRate * 100);
  return p.avgTimeToCompleteMs != null ? Number((p.avgTimeToCompleteMs / DAY_MS).toFixed(1)) : 0;
}

// Aggregate a set of buckets correctly (rates from totals, time weighted by
// completions) for the before/after comparison. Completion and drop-off are
// of-started, so they divide by the started total, not by volume.
function aggregate(points: TrendPoint[]) {
  const volume = points.reduce((sum, p) => sum + p.volume, 0);
  const started = points.reduce((sum, p) => sum + p.started, 0);
  const completions = points.reduce((sum, p) => sum + p.completions, 0);
  const completionRate = started ? completions / started : 0;
  const timed = points.reduce((sum, p) => sum + (p.avgTimeToCompleteMs != null ? p.completions : 0), 0);
  const totalMs = points.reduce((sum, p) => sum + (p.avgTimeToCompleteMs != null ? p.avgTimeToCompleteMs * p.completions : 0), 0);
  return {
    volume,
    started,
    completions,
    startRate: volume ? started / volume : 0,
    completionRate,
    dropOffRate: started ? 1 - completionRate : 0,
    avgTimeToCompleteMs: timed ? totalMs / timed : null,
  };
}

function formatAggregate(agg: ReturnType<typeof aggregate>, metric: Metric): string {
  if (metric === "volume") return String(agg.volume);
  if (metric === "startRate") return `${Math.round(agg.startRate * 100)}%`;
  if (metric === "completionRate") return `${Math.round(agg.completionRate * 100)}%`;
  if (metric === "dropOffRate") return `${Math.round(agg.dropOffRate * 100)}%`;
  return agg.avgTimeToCompleteMs != null ? `${(agg.avgTimeToCompleteMs / DAY_MS).toFixed(1)} days` : "n/a";
}

const chartConfig = { value: { label: "Value", color: "var(--chart-1)" } } satisfies ChartConfig;

export function Trends({ weekly, monthly }: { weekly: TrendPoint[]; monthly: TrendPoint[] }) {
  const [metric, setMetric] = useState<Metric>("completionRate");
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const [compare, setCompare] = useState(false);

  const points = granularity === "weekly" ? weekly : monthly;
  const data = points.map((p) => ({ key: p.key, value: metricValue(p, metric) }));
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "Value";

  const mid = Math.ceil(points.length / 2);
  const before = aggregate(points.slice(0, mid));
  const after = aggregate(points.slice(mid));

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Trends over time</CardTitle>
        <CardDescription>Start rate is of links generated; completion and drop-off are of accounts that started.</CardDescription>
        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map((m) => (
            <Button
              key={m.key}
              size="sm"
              variant={metric === m.key ? "default" : "outline"}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Button
            size="sm"
            variant={granularity === "weekly" ? "default" : "outline"}
            onClick={() => setGranularity("weekly")}
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={granularity === "monthly" ? "default" : "outline"}
            onClick={() => setGranularity("monthly")}
          >
            Monthly
          </Button>
          <Button size="sm" variant={compare ? "default" : "outline"} onClick={() => setCompare((c) => !c)}>
            Compare halves
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {compare ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Earlier half - {metricLabel}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{formatAggregate(before, metric)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Recent half - {metricLabel}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{formatAggregate(after, metric)}</div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data in range.</p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={metric === "avgTime"} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="value" name={metricLabel} type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
