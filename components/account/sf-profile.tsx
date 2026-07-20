import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SALESFORCE_GROUPS, fieldValue } from "@/lib/salesforce-fields";
import { cn } from "@/lib/utils";

// A single Salesforce field value. Yes/No answers are colored (green / muted) so
// they read at a glance like the module selections; a missing value renders a
// muted italic "Not provided"; everything else is plain foreground text.
function FieldValue({ value }: { value: string | null }) {
  if (value === null) return <span className="italic text-muted-foreground">Not provided</span>;
  if (value === "Yes" || value === "No") {
    const on = value === "Yes";
    return (
      <span className={cn("inline-flex items-center gap-1 font-medium", on ? "text-green-700" : "text-muted-foreground")}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("shrink-0", on ? "text-green-600" : "text-muted-foreground/70")}
          aria-hidden
        >
          {on ? <path d="M20 6 9 17l-5-5" /> : <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>}
        </svg>
        {value}
      </span>
    );
  }
  return <span className="text-foreground">{value}</span>;
}

// The account's full Salesforce profile captured at link creation, including
// fields never shown in the onboarding app. Missing fields render "Not provided".
export function SalesforceProfile({ salesforceData }: { salesforceData: Record<string, unknown> }) {
  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>Salesforce profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {SALESFORCE_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 @2xl:grid-cols-2">
              {group.fields.map((field) => {
                const value = fieldValue(salesforceData, field);
                return (
                  <div key={field.label} className="flex justify-between gap-4 text-sm">
                    <dt className="shrink-0 text-muted-foreground">{field.label}</dt>
                    <dd className="min-w-0 break-words text-right">
                      <FieldValue value={value} />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
