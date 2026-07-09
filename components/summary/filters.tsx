"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const BREAKDOWNS = [
  { value: "none", label: "None" },
  { value: "industry", label: "Industry" },
  { value: "numberOfEmployees", label: "Employees" },
  { value: "salesSegment", label: "Sales Segment" },
];

// Both controls write the page's URL search params; the Server Component reads
// them and recomputes / groups the metrics.
function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (key: string, value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
}

// Date-range presets. Sits inline with the page title.
export function RangeFilter({ range }: { range: string }) {
  const setParam = useSetParam();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Range</span>
      {RANGES.map((r) => (
        <Button
          key={r.value}
          size="sm"
          variant={range === r.value ? "default" : "outline"}
          onClick={() => setParam("range", r.value, "30d")}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}

// Segment / industry / employees breakdown selector. Lives in the insights
// section, next to the breakdown table it drives.
export function BreakdownFilter({ breakdown }: { breakdown: string }) {
  const setParam = useSetParam();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Break down by</span>
      {BREAKDOWNS.map((b) => (
        <Button
          key={b.value}
          size="sm"
          variant={breakdown === b.value ? "default" : "outline"}
          onClick={() => setParam("breakdown", b.value, "none")}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}
