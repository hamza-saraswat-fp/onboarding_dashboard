import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingLink } from "./onboarding-link";
import { JOB_LABELS } from "@/lib/job-labels";
import type { AccountDetail as AccountDetailData } from "@/lib/queries/account";
import type { ImportJobStatus, WizardStatus } from "@/lib/types";
import { displayStatus, type DisplayStatus } from "@/lib/display-status";

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

const STATUS_LABELS: Record<DisplayStatus, string> = {
  in_progress: "In progress",
  not_started: "Not started",
  completed: "Completed",
  expired: "Expired",
  submission_failed: "Submission failed",
};

function formatKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.map((v) => renderValue(v)).join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  // Render nested objects as readable "Label: value" pairs instead of raw JSON.
  if (typeof value === "object") {
    const parts = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${formatKey(k)}: ${renderValue(v)}`,
    );
    return parts.length ? parts.join(" · ") : "-";
  }
  return String(value);
}

function formatTimestamp(date: Date | null): string {
  if (!date) return "Not provided";
  return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status, progress }: { status: WizardStatus; progress: number }) {
  const key = displayStatus(status, progress);
  if (key === "not_started") {
    return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{STATUS_LABELS.not_started}</Badge>;
  }
  const variant = key === "completed" ? "default" : key === "submission_failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[key]}</Badge>;
}

function SubmitBadge({ status }: { status: ImportJobStatus }) {
  if (status === "success") {
    return <Badge className="bg-green-600 text-white hover:bg-green-600">Success</Badge>;
  }
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (status === "skipped") return <Badge variant="secondary">Skipped</Badge>;
  return <Badge variant="outline">{status}</Badge>;
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
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Account {account.companyId}</h1>
            <p className="text-sm text-muted-foreground">Session {account.sessionId}</p>
          </div>
          <StatusBadge status={account.status} progress={account.progress} />
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
                    {job.errorMessage ? (
                      <div className="text-xs text-destructive">{job.errorMessage}</div>
                    ) : null}
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
            account.moduleSelections.map((module) => {
              const entries = Object.entries(module.formData ?? {});
              return (
                <div key={module.moduleKey} className="space-y-2.5 py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {MODULE_LABELS[module.moduleKey] ?? module.moduleKey}
                    </h3>
                    <Badge variant={module.isComplete ? "default" : "outline"}>
                      {module.isComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                  {entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data.</p>
                  ) : (
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 @2xl:grid-cols-2">
                      {entries.map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 text-sm">
                          <dt className="shrink-0 text-muted-foreground">{formatKey(key)}</dt>
                          <dd className="min-w-0 break-words text-right text-foreground">{renderValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
