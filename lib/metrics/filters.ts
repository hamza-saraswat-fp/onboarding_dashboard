// Shared helpers the summary view uses to scope sessions by date, bucket them
// into trend series, and break them down by Salesforce profile dimensions. Pure
// functions over WizardSession[], no DB access and no metric math (callers apply
// the summary/module/selection functions per bucket or per group).
//
// Bucket boundaries and keys are computed in the runtime timezone. Production
// (Vercel) and the test runner both run in UTC, so buckets are stable there.

import { startOfISOWeek, startOfMonth, format, isWithinInterval } from "date-fns";
import type { WizardSession } from "../types";

// Sessions whose createdAt falls within [from, to], inclusive of both ends.
export function filterByDateRange(sessions: WizardSession[], from: Date, to: Date): WizardSession[] {
  return sessions.filter((s) => isWithinInterval(s.createdAt, { start: from, end: to }));
}

export interface SessionBucket {
  key: string;
  start: Date;
  sessions: WizardSession[];
}

function bucketBy(
  sessions: WizardSession[],
  startOf: (date: Date) => Date,
  keyFormat: string,
): SessionBucket[] {
  const buckets = new Map<string, SessionBucket>();
  for (const s of sessions) {
    const start = startOf(s.createdAt);
    const key = format(start, keyFormat);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { key, start, sessions: [] };
      buckets.set(key, bucket);
    }
    bucket.sessions.push(s);
  }
  return [...buckets.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Trend buckets by ISO week (Monday start), chronological, non-empty only.
export function bucketByWeek(sessions: WizardSession[]): SessionBucket[] {
  return bucketBy(sessions, startOfISOWeek, "yyyy-MM-dd");
}

// Trend buckets by calendar month, chronological, non-empty only.
export function bucketByMonth(sessions: WizardSession[]): SessionBucket[] {
  return bucketBy(sessions, startOfMonth, "yyyy-MM");
}

export type Dimension = "salesSegment" | "industry" | "numberOfEmployees";

// The salesforceData jsonb keys each dimension may appear under. First match
// wins; the exact key set is a small, extendable hook (SF field naming is not
// fully pinned down yet, so a few likely spellings are accepted).
const DIMENSION_KEYS: Record<Dimension, string[]> = {
  salesSegment: ["sales_segment", "salesSegment", "Sales_Segment__c"],
  industry: ["industry", "Industry", "industry__c"],
  numberOfEmployees: ["number_of_employees", "numberOfEmployees", "NumberOfEmployees", "number_of_employees__c"],
};

const UNSPECIFIED = "Unspecified";

function dimensionValue(session: WizardSession, dim: Dimension): string {
  const data = session.salesforceData;
  if (!data || typeof data !== "object") return UNSPECIFIED;
  const record = data as Record<string, unknown>;
  for (const key of DIMENSION_KEYS[dim]) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return UNSPECIFIED;
}

// Group sessions by a Salesforce dimension so any metric function can be applied
// per group. Sessions missing the dimension fall under "Unspecified".
export function groupByDimension(
  sessions: WizardSession[],
  dim: Dimension,
): Record<string, WizardSession[]> {
  const groups: Record<string, WizardSession[]> = {};
  for (const s of sessions) {
    const value = dimensionValue(s, dim);
    (groups[value] ??= []).push(s);
  }
  return groups;
}
