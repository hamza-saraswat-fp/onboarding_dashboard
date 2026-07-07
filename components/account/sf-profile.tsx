import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SALESFORCE_GROUPS, fieldValue } from "@/lib/salesforce-fields";

// The account's full Salesforce profile captured at link creation, including
// fields never shown in the onboarding app. Missing fields render "Not provided".
export function SalesforceProfile({ salesforceData }: { salesforceData: Record<string, unknown> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salesforce profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {SALESFORCE_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {group.fields.map((field) => {
                const value = fieldValue(salesforceData, field);
                return (
                  <div key={field.label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd
                      className={
                        value === null ? "text-right italic text-muted-foreground" : "text-right text-foreground"
                      }
                    >
                      {value ?? "Not provided"}
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
