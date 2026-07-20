import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingLink } from "./onboarding-link";
import { StatusPill } from "./status-pill";
import { Pill, type PillTone } from "./pill";
import { JOB_LABELS } from "@/lib/job-labels";
import { HIDDEN_SELECTION_KEYS, prettifyAnswer } from "@/lib/selection-format";
import type { AccountDetail as AccountDetailData } from "@/lib/queries/account";
import type { ImportJobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  generalInfo: "General info",
  customers: "Customers",
  jobs: "Jobs",
  clearpath: "ClearPath",
  estimatesInvoices: "Estimates and invoices",
  communications: "Communications",
  customForms: "Custom forms",
  userSetup: "User setup",
  teamsSetup: "Teams setup",
};

function formatKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A non-boolean value as a readable string. Booleans are handled separately (they
// render as a colored Yes/No), and nested objects are broken out into their own
// sub-groups, so this only sees scalars and arrays.
function renderScalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.map((v) => renderScalar(v)).join(", ") : "-";
  if (isPlainObject(value)) {
    const parts = Object.entries(value).map(([k, v]) => `${formatKey(k)}: ${renderScalar(v)}`);
    return parts.length ? parts.join(" · ") : "-";
  }
  return prettifyAnswer(String(value));
}

function formatTimestamp(date: Date | null): string {
  if (!date) return "Not provided";
  return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// A yes/no answer, colored so it reads at a glance: green check for yes, muted
// cross for no. Used for every boolean across the module selections.
function BoolValue({ on }: { on: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", on ? "text-green-700" : "text-muted-foreground")}>
      <span className={on ? "text-green-600" : "text-muted-foreground/70"}>{on ? <CheckIcon /> : <CrossIcon />}</span>
      {on ? "Yes" : "No"}
    </span>
  );
}

// A right-hand value in a key/value row: a colored yes/no for booleans, a muted
// dash for empty values, and medium foreground text for any other answer, so the
// written answers read like the yes/no rather than a separate chip style.
function ScalarValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") return <BoolValue on={value} />;
  const text = renderScalar(value);
  if (text === "-") return <span className="text-muted-foreground">-</span>;
  return <span className="font-medium text-foreground">{text}</span>;
}

function KeyValueRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right">
        <ScalarValue value={value} />
      </span>
    </div>
  );
}

// One on/off setting inside a nested group (e.g. an SMS or Email toggle in the
// Communications module), shown as a labeled check/cross so chosen vs not chosen
// is obvious.
function ToggleItem({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", on ? "text-foreground" : "text-muted-foreground")}>
      <span className={on ? "text-green-600" : "text-muted-foreground/70"}>{on ? <CheckIcon /> : <CrossIcon />}</span>
      {label}
    </span>
  );
}

function SubmitBadge({ status }: { status: ImportJobStatus }) {
  const tone: PillTone = status === "success" ? "success" : status === "failed" ? "danger" : "neutral";
  const label =
    status === "success" ? "Success" : status === "failed" ? "Failed" : status === "skipped" ? "Skipped" : status;
  return <Pill tone={tone}>{label}</Pill>;
}

// One module's saved answers. Scalars sit in a key/value grid; nested objects
// (like Communications' SMS / Email settings) break out into their own labeled
// group of check/cross toggles so the chosen options are scannable.
function ModuleSelections({ formData }: { formData: Record<string, unknown> }) {
  const entries = Object.entries(formData ?? {}).filter(([key]) => !HIDDEN_SELECTION_KEYS.has(key));
  if (entries.length === 0) return <p className="text-xs text-muted-foreground">No data.</p>;

  const scalars = entries.filter(([, value]) => !isPlainObject(value));
  const groups = entries.filter(([, value]) => isPlainObject(value)) as [string, Record<string, unknown>][];

  return (
    <div className="space-y-4">
      {scalars.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 @2xl:grid-cols-2">
          {scalars.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 text-sm">
              <dt className="shrink-0 text-muted-foreground">{formatKey(key)}</dt>
              <dd className="min-w-0 break-words text-right">
                <ScalarValue value={value} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {groups.map(([key, value]) => {
        const sub = Object.entries(value);
        return (
          <div key={key} className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatKey(key)}</div>
            {sub.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data.</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 @lg:grid-cols-2">
                {sub.map(([k, v]) =>
                  typeof v === "boolean" ? (
                    <ToggleItem key={k} label={formatKey(k)} on={v} />
                  ) : (
                    <KeyValueRow key={k} label={formatKey(k)} value={v} />
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// showHeader is false when this renders inside the account drawer, which supplies
// its own header (company name + status), so we skip the redundant title block.
export function AccountDetail({
  account,
  showHeader = true,
}: {
  account: AccountDetailData;
  showHeader?: boolean;
}) {
  const completed = account.moduleSelections.filter((m) => m.isComplete).length;
  const total = account.modulesTotal;

  return (
    <div className="@container space-y-6">
      {showHeader ? (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</div>
            <h1 className="text-2xl font-semibold text-foreground">
              {account.companyName ?? `Account ${account.companyId}`}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {account.companyName ? (
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                  ID {account.companyId}
                </span>
              ) : null}
              {account.salesforceUrl ? (
                <a
                  href={account.salesforceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Salesforce
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 opacity-70"
                    aria-hidden
                  >
                    <path d="M15 3h6v6" />
                    <path d="M10 14 21 3" />
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                </a>
              ) : null}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground/80">Session {account.sessionId}</div>
          </div>
          <StatusPill status={account.status} progress={account.progress} />
        </div>
      ) : null}

      {account.onboardingUrl ? <OnboardingLink url={account.onboardingUrl} /> : null}

      <div className="grid gap-4 @xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 w-full rounded bg-muted">
              <div className="h-2 rounded bg-primary" style={{ width: `${Math.round(account.progress * 100)}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{Math.round(account.progress * 100)}%</span> -{" "}
              {completed} of {total} modules complete - current step {account.currentModule}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground">{formatTimestamp(account.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Submitted</span>
              <span className="text-foreground">{formatTimestamp(account.submittedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Expires</span>
              <span className="text-foreground">{formatTimestamp(account.expiresAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit results</CardTitle>
        </CardHeader>
        <CardContent>
          {account.submitResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <ul className="divide-y">
              {account.submitResults.map((job) => (
                <li key={job.jobType} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">{JOB_LABELS[job.jobType] ?? job.jobType}</div>
                    {job.errorMessage ? <div className="text-xs text-destructive">{job.errorMessage}</div> : null}
                  </div>
                  <SubmitBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selections by module</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {account.moduleSelections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules started.</p>
          ) : (
            account.moduleSelections.map((module) => (
              <div key={module.moduleKey} className="space-y-3 py-5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {MODULE_LABELS[module.moduleKey] ?? module.moduleKey}
                  </h3>
                  <Pill tone={module.isComplete ? "success" : "neutral"}>
                    {module.isComplete ? "Complete" : "Incomplete"}
                  </Pill>
                </div>
                <ModuleSelections formData={module.formData} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
