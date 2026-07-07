import { describe, it, expect } from "vitest";
import {
  totalLinks,
  totalCompletions,
  completionRate,
  avgProgress,
  timeToComplete,
  lifecycleBreakdown,
} from "../lib/metrics/summary";
import { moduleDropOff, avgTimePerModule } from "../lib/metrics/modules";
import { selectionDistribution, selectionCompletionCorrelation } from "../lib/metrics/selections";
import { filterByDateRange, bucketByWeek, bucketByMonth, groupByDimension } from "../lib/metrics/filters";

// Hardening: every metric function must be safe on empty input (no NaN, no
// divide-by-zero), so the summary renders clean zeros when there is no data.
describe("empty-input safety", () => {
  it("summary metrics return safe zeros with no NaN", () => {
    expect(totalLinks([])).toBe(0);
    expect(totalCompletions([])).toBe(0);

    const rate = completionRate([]);
    expect(rate).toBe(0);
    expect(Number.isNaN(rate)).toBe(false);

    const progress = avgProgress([], []);
    expect(progress).toBe(0);
    expect(Number.isNaN(progress)).toBe(false);

    expect(timeToComplete([])).toBeNull();
    expect(lifecycleBreakdown([])).toEqual({
      in_progress: 0,
      completed: 0,
      expired: 0,
      submission_failed: 0,
    });
  });

  it("module metrics return empty arrays", () => {
    expect(moduleDropOff([], [])).toEqual([]);
    expect(avgTimePerModule([])).toEqual([]);
  });

  it("selection metrics handle empty input", () => {
    expect(selectionCompletionCorrelation([], [])).toEqual([]);
    const dist = selectionDistribution([]);
    // Only known-option fields remain, all with zero counts.
    expect(dist.every((field) => field.options.every((option) => option.count === 0))).toBe(true);
  });

  it("filter and segmentation helpers handle empty input", () => {
    expect(filterByDateRange([], new Date("2026-01-01T00:00:00Z"), new Date("2026-12-31T00:00:00Z"))).toEqual([]);
    expect(bucketByWeek([])).toEqual([]);
    expect(bucketByMonth([])).toEqual([]);
    expect(groupByDimension([], "salesSegment")).toEqual({});
  });
});
