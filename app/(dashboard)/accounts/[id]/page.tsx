import { notFound } from "next/navigation";
import { getAccountDetail } from "@/lib/queries/account";

// Reads live data per request; never statically prerender.
export const dynamic = "force-dynamic";

// Minimal skeleton for the account drill-down. The polished UI and the
// Salesforce profile panel land in COR2-21 and COR2-22.
export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Account {account.companyId}</h1>
      <p className="text-sm text-muted-foreground">
        Status: {account.status} &middot; Progress: {Math.round(account.progress * 100)}% &middot; Current step:{" "}
        {account.currentModule}
      </p>
      <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs text-foreground">
        {JSON.stringify(account, null, 2)}
      </pre>
    </div>
  );
}
