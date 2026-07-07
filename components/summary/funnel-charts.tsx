"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ModuleDropOff } from "@/lib/metrics/modules";
import type { SummaryMetrics } from "./summary-view";

// Secondary brand palette (globals.css maps --chart-1..5 to cobalt/sky/aqua/quartz/fog).
const LIFECYCLE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const LIFECYCLE_ORDER: { key: keyof SummaryMetrics["lifecycle"]; label: string }[] = [
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "submission_failed", label: "Submission failed" },
  { key: "expired", label: "Expired" },
];

const MODULE_LABELS: Record<string, string> = {
  generalInfo: "General info",
  customers: "Customers",
  jobs: "Jobs",
  clearpath: "ClearPath",
  estimatesInvoices: "Estimates",
  communications: "Comms",
  customForms: "Custom forms",
  userSetup: "Users",
  teamsSetup: "Teams",
};

const lifecycleConfig = { count: { label: "Links" } } satisfies ChartConfig;

const dropOffConfig = {
  reached: { label: "Reached", color: "var(--chart-1)" },
  completed: { label: "Completed", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function FunnelCharts({
  lifecycle,
  moduleDropOff,
}: {
  lifecycle: SummaryMetrics["lifecycle"];
  moduleDropOff: ModuleDropOff[];
}) {
  const lifecycleData = LIFECYCLE_ORDER.map((s) => ({ label: s.label, count: lifecycle[s.key] }));
  const dropOffData = moduleDropOff.map((m) => ({
    label: MODULE_LABELS[m.moduleKey] ?? m.moduleKey,
    reached: m.reached,
    completed: m.completed,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lifecycleConfig} className="min-h-[240px] w-full">
            <BarChart accessibilityLayer data={lifecycleData} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={4}>
                {lifecycleData.map((entry, i) => (
                  <Cell key={entry.label} fill={LIFECYCLE_COLORS[i % LIFECYCLE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module drop-off</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={dropOffConfig} className="min-h-[240px] w-full">
            <BarChart accessibilityLayer data={dropOffData} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-30}
                textAnchor="end"
                height={64}
                interval={0}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="reached" fill="var(--color-reached)" radius={4} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
