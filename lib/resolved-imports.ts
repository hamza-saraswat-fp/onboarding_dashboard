// Company ids whose failed submit imports have been handled by a human outside
// the wizard (e.g. ClearPath triggers re-created by hand in the Master Portal),
// so the accounts list should stop flagging their rows. UI-only: the underlying
// import_jobs rows still say "failed" (this app never writes to the database),
// and the account detail's Submit results section still shows the true statuses,
// so the exclusion stays auditable and reversible - delete an id to re-flag it.
//
// Same two-store pattern as hidden-accounts.ts: the committed defaults are the
// primary curation (edit, PR, merge), and RESOLVED_IMPORT_COMPANY_IDS
// (comma-separated) is the no-deploy escape hatch.

// One id per line with the resolution note. No customer names here: the repo is
// public, so ids only.
const RESOLVED_ID_DEFAULTS: string[] = [
  "189329", // clearpath_triggers re-created manually
  "195170", // clearpath_triggers handled manually
  "195236", // clearpath_triggers handled manually
  "198173", // clearpath_triggers handled manually
  "198470", // clearpath_triggers handled manually
];

function resolvedIds(): Set<string> {
  const fromEnv = (process.env.RESOLVED_IMPORT_COMPANY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...RESOLVED_ID_DEFAULTS, ...fromEnv]);
}

const RESOLVED = resolvedIds();

export function isResolvedImportAccount(companyId: string): boolean {
  return RESOLVED.has(companyId);
}
