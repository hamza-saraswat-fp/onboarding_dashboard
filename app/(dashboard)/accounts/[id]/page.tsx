import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccountDetail } from "@/lib/queries/account";
import { AccountDetail } from "@/components/account/account-detail";
import { SalesforceProfile } from "@/components/account/sf-profile";

// Reads live data per request; never statically prerender.
export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Dashboard
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">Account {account.companyId}</span>
      </nav>

      <AccountDetail account={account} />
      <SalesforceProfile salesforceData={account.salesforceData} />
    </div>
  );
}
