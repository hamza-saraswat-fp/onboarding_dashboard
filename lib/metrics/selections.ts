// Selection metrics: what customers pick, as decision fuel. Two views:
// the full distribution of chosen values per module (including known options
// that were never chosen), and how each chosen value correlates with completing
// vs abandoning. Pure functions over query results, no DB access.
//
// formData shape varies per module, so it is flattened defensively into
// (field, value) selections: scalars become one value, arrays contribute each
// element, nested objects recurse with a dotted field path, and anything else
// is ignored.

import type { WizardModuleData, WizardSession } from "../types";

// Known option sets for enum-like fields, keyed by `${moduleKey}.${field}`.
// Fields listed here get never-chosen options rendered as zero counts. This is
// a deliberately small, extendable hook: add a field here to surface its full
// option set even when some options never appear in the data.
const KNOWN_OPTIONS: Record<string, string[]> = {
  "generalInfo.companySize": ["1-2", "3-5", "6-10", "11-20", "21-30", "31-50", "51+"],
  "generalInfo.customerTypes": ["residential", "commercial"],
  "customers.selectedTagSets": ["default", "residential", "commercial", "zones"],
  "jobs.workflows": ["service_call", "installation", "default"],
  "clearpath.service_call": ["simple", "standard", "advanced"],
  "clearpath.installation": ["simple", "standard", "advanced"],
  "clearpath.default": ["simple", "standard", "advanced"],
};

export interface SelectionOption {
  value: string;
  count: number;
}

export interface SelectionField {
  moduleKey: string;
  field: string;
  options: SelectionOption[];
}

export interface SelectionCorrelation {
  moduleKey: string;
  field: string;
  value: string;
  sessions: number;
  completions: number;
  completionRate: number; // completions / sessions, 0..1
}

function isScalar(v: unknown): v is string | number | boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function collect(field: string, value: unknown, out: { field: string; value: string }[]): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const el of value) {
      if (isScalar(el)) out.push({ field, value: String(el) });
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      collect(`${field}.${k}`, v, out);
    }
    return;
  }
  if (isScalar(value)) out.push({ field, value: String(value) });
}

// Flatten one row's formData into de-duplicated (field, value) selections.
function selectionsOf(formData: unknown): { field: string; value: string }[] {
  if (!formData || typeof formData !== "object" || Array.isArray(formData)) return [];
  const raw: { field: string; value: string }[] = [];
  for (const [k, v] of Object.entries(formData as Record<string, unknown>)) {
    collect(k, v, raw);
  }
  const seen = new Set<string>();
  return raw.filter(({ field, value }) => {
    const key = `${field}\u0000${value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Distribution of chosen values per module.field across sessions. Where a known
// option set exists, options never chosen appear with a zero count. Options are
// sorted by count descending, then value ascending.
export function selectionDistribution(moduleData: WizardModuleData[]): SelectionField[] {
  // moduleKey -> field -> value -> count
  const tally = new Map<string, Map<string, Map<string, number>>>();

  const ensureField = (moduleKey: string, field: string): Map<string, number> => {
    let fields = tally.get(moduleKey);
    if (!fields) {
      fields = new Map();
      tally.set(moduleKey, fields);
    }
    let values = fields.get(field);
    if (!values) {
      values = new Map();
      fields.set(field, values);
    }
    return values;
  };

  for (const m of moduleData) {
    for (const { field, value } of selectionsOf(m.formData)) {
      const values = ensureField(m.moduleKey, field);
      values.set(value, (values.get(value) ?? 0) + 1);
    }
  }

  // Seed known-option fields so never-chosen options show up as zeros, even for
  // known fields that were never observed at all.
  for (const knownKey of Object.keys(KNOWN_OPTIONS)) {
    const dot = knownKey.indexOf(".");
    const moduleKey = knownKey.slice(0, dot);
    const field = knownKey.slice(dot + 1);
    const values = ensureField(moduleKey, field);
    for (const option of KNOWN_OPTIONS[knownKey]) {
      if (!values.has(option)) values.set(option, 0);
    }
  }

  const result: SelectionField[] = [];
  for (const [moduleKey, fields] of tally) {
    for (const [field, values] of fields) {
      const options = [...values.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      result.push({ moduleKey, field, options });
    }
  }
  return result;
}

export interface TopSelection {
  moduleKey: string;
  field: string;
  value: string;
  count: number;
}

// The most-chosen selection values across all modules, ranked by count. Boolean
// toggles (Yes/No) are excluded so the list surfaces meaningful categorical
// choices (company size, workflows, tag sets, service levels). This is the
// readable form of "highest-volume selections" for the company summary.
export function topSelections(moduleData: WizardModuleData[], limit = 10): TopSelection[] {
  const distribution = selectionDistribution(moduleData);
  const rows: TopSelection[] = [];
  for (const f of distribution) {
    for (const o of f.options) {
      const v = o.value.toLowerCase();
      if (o.count <= 0 || v === "true" || v === "false") continue;
      rows.push({ moduleKey: f.moduleKey, field: f.field, value: o.value, count: o.count });
    }
  }
  rows.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return rows.slice(0, limit);
}

// For each chosen selection value, the completion rate of the sessions that made
// it (fraction whose status is 'completed'). Only observed selections appear.
export function selectionCompletionCorrelation(
  sessions: WizardSession[],
  moduleData: WizardModuleData[],
): SelectionCorrelation[] {
  const statusById = new Map<string, WizardSession["status"]>();
  for (const s of sessions) statusById.set(s.id, s.status);

  // moduleKey -> field -> value -> set of sessionIds
  const bySelection = new Map<string, Map<string, Map<string, Set<string>>>>();

  for (const m of moduleData) {
    if (!statusById.has(m.sessionId)) continue;
    for (const { field, value } of selectionsOf(m.formData)) {
      let fields = bySelection.get(m.moduleKey);
      if (!fields) {
        fields = new Map();
        bySelection.set(m.moduleKey, fields);
      }
      let values = fields.get(field);
      if (!values) {
        values = new Map();
        fields.set(field, values);
      }
      let ids = values.get(value);
      if (!ids) {
        ids = new Set();
        values.set(value, ids);
      }
      ids.add(m.sessionId);
    }
  }

  const result: SelectionCorrelation[] = [];
  for (const [moduleKey, fields] of bySelection) {
    for (const [field, values] of fields) {
      for (const [value, ids] of values) {
        let completions = 0;
        for (const id of ids) {
          if (statusById.get(id) === "completed") completions += 1;
        }
        const sessionCount = ids.size;
        result.push({
          moduleKey,
          field,
          value,
          sessions: sessionCount,
          completions,
          completionRate: sessionCount === 0 ? 0 : completions / sessionCount,
        });
      }
    }
  }
  return result;
}
