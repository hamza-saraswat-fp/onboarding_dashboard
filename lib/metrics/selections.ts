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

export interface SelectionItem {
  label: string;
  count: number;
}

export interface SelectionSection {
  key: string;
  title: string;
  items: SelectionItem[];
}

// The curated sections shown in "Most common selections". Only the areas the
// team cares about (customer tags, job workflows, and the ClearPath, customer
// communications, and custom forms modules); general info and estimates and
// invoices are deliberately excluded.
//   - value:       count each chosen value (arrays/enums), e.g. tag sets.
//   - field-value: count each field's chosen value, e.g. ClearPath level per workflow.
//   - enabled:     boolean toggles, count how many accounts turned each option on.
const SELECTION_SECTIONS: {
  key: string;
  title: string;
  fields: string[] | null; // restrict to these top-level fields; null = all
  mode: "value" | "field-value" | "enabled";
}[] = [
  { key: "customers", title: "Customer tags", fields: ["selectedTagSets"], mode: "value" },
  { key: "jobs", title: "Job workflows", fields: ["workflows"], mode: "value" },
  { key: "clearpath", title: "ClearPath", fields: null, mode: "field-value" },
  { key: "communications", title: "Customer communications", fields: null, mode: "enabled" },
  { key: "customForms", title: "Custom forms", fields: null, mode: "enabled" },
];

const ACRONYMS: Record<string, string> = { sms: "SMS", fp: "FP", qbo: "QBO" };

function humanizeSegment(seg: string): string {
  const spaced = seg
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
  if (ACRONYMS[spaced]) return ACRONYMS[spaced];
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function labelizePath(field: string): string {
  return field.split(".").map(humanizeSegment).join(" · ");
}

// The most common selections per curated section. Counts are the number of
// accounts (module rows) that made each selection.
export function topSelectionsBySection(moduleData: WizardModuleData[], perSection = 8): SelectionSection[] {
  const byModule = new Map<string, WizardModuleData[]>();
  for (const m of moduleData) {
    const arr = byModule.get(m.moduleKey) ?? [];
    arr.push(m);
    byModule.set(m.moduleKey, arr);
  }

  return SELECTION_SECTIONS.map((cfg) => {
    const rows = byModule.get(cfg.key) ?? [];
    const counts = new Map<string, number>();

    for (const row of rows) {
      for (const { field, value } of selectionsOf(row.formData)) {
        if (cfg.fields && !cfg.fields.includes(field.split(".")[0])) continue;
        const isBool = value === "true" || value === "false";

        let label: string | null = null;
        if (cfg.mode === "enabled") {
          if (value === "true") label = labelizePath(field);
        } else if (cfg.mode === "field-value") {
          if (!isBool) label = `${labelizePath(field)}: ${humanizeSegment(value)}`;
        } else if (!isBool) {
          label = humanizeSegment(value);
        }

        if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }

    const items = [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, perSection);

    return { key: cfg.key, title: cfg.title, items };
  });
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
