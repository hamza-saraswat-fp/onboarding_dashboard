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
// This is the raw, generated-based rate. The UI shows the of-started rate below
// instead; this stays for reference and for callers that want the raw view.
export function completionRate(sessions: WizardSession[]): number {
  if (sessions.length === 0) return 0;
  return totalCompletions(sessions) / sessions.length;
}

// "First Steps Started" signal. A session counts as started when it saved at
// least one real answer (a wizard_module_data row with non-empty form_data), or
// it is completed. The module-row rule is the best signal in this database that
// a real person engaged with the wizard, as opposed to a link that was generated
// but never sent or never opened, so it removes those never-sent links from the
// completion-rate denominator. The completed guard means a completed onboarding
// always counts as started, so completions can never exceed started and the
// of-started rate never exceeds 100%.
//
// Returned as an id set so one definition drives every surface (KPIs, funnel,
// trends, breakdown): build it once, then intersect with each surface's session
// list via startedCount.
export function startedSessionIds(
  sessions: WizardSession[],
  moduleData: WizardModuleData[],
): Set<string> {
  const ids = new Set<string>();
  for (const m of moduleData) {
    if (hasAnswers(m.formData)) ids.add(m.sessionId);
  }
  for (const s of sessions) {
    if (s.status === "completed") ids.add(s.id);
  }
  return ids;
}

// True when form_data holds at least one saved field (not an empty autosave).
function hasAnswers(formData: Record<string, unknown>): boolean {
  return formData != null && typeof formData === "object" && Object.keys(formData).length > 0;
}

// How many of these sessions are in the started set.
export function startedCount(sessions: WizardSession[], startedIds: Set<string>): number {
  return sessions.reduce((n, s) => (startedIds.has(s.id) ? n + 1 : n), 0);
}

// Started divided by total links, as a 0..1 ratio (0 when no links).
export function startRate(sessions: WizardSession[], startedIds: Set<string>): number {
  if (sessions.length === 0) return 0;
  return startedCount(sessions, startedIds) / sessions.length;
}

// Completed divided by started, as a 0..1 ratio (0 when nobody started).
export function completionRateOfStarted(
  sessions: WizardSession[],
  startedIds: Set<string>,
): number {
  const started = startedCount(sessions, startedIds);
  if (started === 0) return 0;
  return totalCompletions(sessions) / started;
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

// Average setup progress among accounts that started: the mean, over started
// sessions, of completed modules / totalSteps. Excluding never-started links is
// the point, so unsent links no longer drag it toward zero the way a
// generated-denominator average does. totalSteps is the number of setup steps in
// the wizard; the caller passes the count of distinct modules seen in the data.
// Returns 0 when nobody started or there are no steps.
export function avgProgressOfStarted(
  sessions: WizardSession[],
  moduleData: WizardModuleData[],
  startedIds: Set<string>,
  totalSteps: number,
): number {
  if (totalSteps <= 0) return 0;
  const started = sessions.filter((s) => startedIds.has(s.id));
  if (started.length === 0) return 0;

  const completeBySession = new Map<string, number>();
  for (const m of moduleData) {
    if (m.isComplete) completeBySession.set(m.sessionId, (completeBySession.get(m.sessionId) ?? 0) + 1);
  }

  let sum = 0;
  for (const s of started) {
    sum += Math.min(1, (completeBySession.get(s.id) ?? 0) / totalSteps);
  }
  return sum / started.length;
}

// Active time to complete: mean and median of (submittedAt - first module
// savedAt) over completed sessions that have both a submission and at least one
// saved module. Unlike timeToComplete this starts from first activity, not
// createdAt (link generation), so it excludes the dead time a link sits before
// the customer first engages. Null when no completed session has measurable
// activity.
export function timeToCompleteActive(
  sessions: WizardSession[],
  moduleData: WizardModuleData[],
): TimeToComplete | null {
  const firstSavedBySession = new Map<string, number>();
  for (const m of moduleData) {
    const t = m.savedAt.getTime();
    const prev = firstSavedBySession.get(m.sessionId);
    if (prev === undefined || t < prev) firstSavedBySession.set(m.sessionId, t);
  }

  const durations: number[] = [];
  for (const s of sessions) {
    if (s.status !== "completed" || s.submittedAt === null) continue;
    const first = firstSavedBySession.get(s.id);
    if (first === undefined) continue;
    const d = s.submittedAt.getTime() - first;
    if (d >= 0) durations.push(d);
  }
  if (durations.length === 0) return null;

  const meanMs = durations.reduce((total, d) => total + d, 0) / durations.length;
  return { meanMs, medianMs: median(durations) };
}

// One point on the Trends timeline, for a single time bucket. Rates are of the
// bucket's own sessions so buckets aggregate correctly. avgTimeToCompleteMs uses
// the active (first-answer to submit) basis, matching the headline tile, so the
// trend line and the tile speak the same time definition.
export interface TrendPoint {
  key: string;
  volume: number;
  started: number;
  completions: number;
  completionRate: number; // 0..1, completed / started
  dropOffRate: number; // 0..1, started but not completed / started
  avgTimeToCompleteMs: number | null;
}

// Build a TrendPoint from one bucket's sessions and their module rows. moduleData
// should be the rows for these sessions (extra rows are harmless: only listed
// sessions contribute). completionRate is of-started, matching the KPI row, and
// startedIds is the one shared started set.
export function trendPoint(
  key: string,
  sessions: WizardSession[],
  moduleData: WizardModuleData[],
  startedIds: Set<string>,
): TrendPoint {
  const started = startedCount(sessions, startedIds);
  const completions = totalCompletions(sessions);
  const rate = started === 0 ? 0 : completions / started;
  const ttc = timeToCompleteActive(sessions, moduleData);
  return {
    key,
    volume: sessions.length,
    started,
    completions,
    completionRate: rate,
    dropOffRate: started === 0 ? 0 : 1 - rate,
    avgTimeToCompleteMs: ttc ? ttc.meanMs : null,
  };
}

// Of the accounts that reached submission (completed or submission_failed), the
// share whose setup pushed to FieldPulse without a failure. This is the useful
// signal behind the old "Submissions" count, which merely duplicated
// Completions. Null when none have reached submission.
export function importSuccessRate(sessions: WizardSession[]): number | null {
  let completed = 0;
  let failed = 0;
  for (const s of sessions) {
    if (s.status === "completed") completed += 1;
    else if (s.status === "submission_failed") failed += 1;
  }
  const submitted = completed + failed;
  if (submitted === 0) return null;
  return completed / submitted;
}
