// Module funnel metrics: where customers abandon (drop-off per module) and
// where they spend time (approximate per-module dwell). Pure functions over
// query results, no DB access.

import type { WizardModuleData, WizardSession } from "../types";

export interface ModuleDropOff {
  moduleKey: string;
  moduleNumber: number;
  reached: number;
  completed: number;
  reachedShare: number; // reached / total sessions, 0..1
  completedShare: number; // completed / total sessions, 0..1
}

// For each module (in module-number order), how many sessions reached it versus
// completed it. A session reached a module if a wizard_module_data row exists
// for it, or the session's currentModule is at or past that module's number.
// Completed means that module's row has isComplete true.
export function moduleDropOff(
  sessions: WizardSession[],
  moduleData: WizardModuleData[],
): ModuleDropOff[] {
  const moduleKeyByNumber = moduleUniverse(moduleData);

  // rows indexed by session then module number for O(1) lookup.
  const rowsBySession = new Map<string, Map<number, WizardModuleData>>();
  for (const m of moduleData) {
    let inner = rowsBySession.get(m.sessionId);
    if (!inner) {
      inner = new Map();
      rowsBySession.set(m.sessionId, inner);
    }
    inner.set(m.moduleNumber, m);
  }

  const total = sessions.length;

  return [...moduleKeyByNumber.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([moduleNumber, moduleKey]) => {
      let reached = 0;
      let completed = 0;
      for (const s of sessions) {
        const row = rowsBySession.get(s.id)?.get(moduleNumber);
        if (row !== undefined || s.currentModule >= moduleNumber) reached += 1;
        if (row?.isComplete) completed += 1;
      }
      return {
        moduleKey,
        moduleNumber,
        reached,
        completed,
        reachedShare: total === 0 ? 0 : reached / total,
        completedShare: total === 0 ? 0 : completed / total,
      };
    });
}

export interface ModuleDwell {
  moduleKey: string;
  moduleNumber: number;
  avgDwellMs: number | null; // null when there are no gap samples for this module
  sampleCount: number;
}

// APPROXIMATE. Estimates dwell per module as the gap between the previous
// module's savedAt and this module's savedAt within the same session. Saves are
// not precise start/stop events, so this is a rough, directional proxy, not an
// exact measure. The first saved module in a session has no preceding timestamp
// and contributes no sample; a session with zero or one saved module
// contributes nothing.
export function avgTimePerModule(moduleData: WizardModuleData[]): ModuleDwell[] {
  const moduleKeyByNumber = moduleUniverse(moduleData);

  const rowsBySession = new Map<string, WizardModuleData[]>();
  for (const m of moduleData) {
    const arr = rowsBySession.get(m.sessionId) ?? [];
    arr.push(m);
    rowsBySession.set(m.sessionId, arr);
  }

  const acc = new Map<number, { sum: number; count: number }>();
  for (const rows of rowsBySession.values()) {
    const sorted = [...rows].sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime());
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].savedAt.getTime() - sorted[i - 1].savedAt.getTime();
      const key = sorted[i].moduleNumber;
      const a = acc.get(key) ?? { sum: 0, count: 0 };
      a.sum += gap;
      a.count += 1;
      acc.set(key, a);
    }
  }

  return [...moduleKeyByNumber.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([moduleNumber, moduleKey]) => {
      const a = acc.get(moduleNumber);
      return {
        moduleKey,
        moduleNumber,
        avgDwellMs: a && a.count > 0 ? a.sum / a.count : null,
        sampleCount: a?.count ?? 0,
      };
    });
}

// The set of modules seen in the data, as a moduleNumber -> moduleKey map.
function moduleUniverse(moduleData: WizardModuleData[]): Map<number, string> {
  const moduleKeyByNumber = new Map<number, string>();
  for (const m of moduleData) {
    if (!moduleKeyByNumber.has(m.moduleNumber)) moduleKeyByNumber.set(m.moduleNumber, m.moduleKey);
  }
  return moduleKeyByNumber;
}
