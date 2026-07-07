// Company-level summary metrics, as pure functions over query results so they
// are unit-testable with exact expected values. No DB access here.
//
// Rate conventions: completionRate and avgProgress are returned as 0..1 ratios,
// not 0..100 percentages. The UI formats them as percentages. Keeping both on
// the same 0..1 scale means the presentation layer can format every rate the
// same way. Durations are in milliseconds. Every function guards empty input:
// rates return 0, timeToComplete returns null, and there is no divide-by-zero.

import type { WizardModuleData, WizardSession, WizardStatus } from "../types";

export function totalLinks(sessions: WizardSession[]): number {
  return sessions.length;
}

export function totalCompletions(sessions: WizardSession[]): number {
  return sessions.filter((s) => s.status === "completed").length;
}

// Completed links divided by total links, as a 0..1 ratio (0 when no links).
export function completionRate(sessions: WizardSession[]): number {
  if (sessions.length === 0) return 0;
  return totalCompletions(sessions) / sessions.length;
}

// Mean over sessions of each session's completed-module fraction (0..1). A
// session with no module rows contributes 0.
export function avgProgress(sessions: WizardSession[], moduleData: WizardModuleData[]): number {
  if (sessions.length === 0) return 0;

  const bySession = new Map<string, { total: number; complete: number }>();
  for (const m of moduleData) {
    const agg = bySession.get(m.sessionId) ?? { total: 0, complete: 0 };
    agg.total += 1;
    if (m.isComplete) agg.complete += 1;
    bySession.set(m.sessionId, agg);
  }

  let sum = 0;
  for (const s of sessions) {
    const agg = bySession.get(s.id);
    sum += agg && agg.total > 0 ? agg.complete / agg.total : 0;
  }
  return sum / sessions.length;
}

export interface TimeToComplete {
  meanMs: number;
  medianMs: number;
}

// Mean and median of (submittedAt - createdAt) over completed sessions, in ms.
// Null when there are no completed sessions.
export function timeToComplete(sessions: WizardSession[]): TimeToComplete | null {
  const durations: number[] = [];
  for (const s of sessions) {
    if (s.status === "completed" && s.submittedAt !== null) {
      durations.push(s.submittedAt.getTime() - s.createdAt.getTime());
    }
  }
  if (durations.length === 0) return null;

  const meanMs = durations.reduce((total, d) => total + d, 0) / durations.length;
  return { meanMs, medianMs: median(durations) };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Count of sessions per lifecycle status. Always returns all four keys so the
// UI can render a stable set of categories.
export function lifecycleBreakdown(sessions: WizardSession[]): Record<WizardStatus, number> {
  const counts: Record<WizardStatus, number> = {
    in_progress: 0,
    completed: 0,
    expired: 0,
    submission_failed: 0,
  };
  for (const s of sessions) counts[s.status] += 1;
  return counts;
}
