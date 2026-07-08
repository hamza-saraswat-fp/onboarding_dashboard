import { listAccountRows } from "@/lib/queries/account";
import { AccountsTable } from "@/components/summary/accounts-table";

// Reads live data per request; never statically prerender.
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const rows = await listAccountRows();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
        <p className="text-sm text-muted-foreground">Every onboarding link, one row per account. Select a row for full detail.</p>
      </div>
      <AccountsTable rows={rows} />
    </div>
  );
}
