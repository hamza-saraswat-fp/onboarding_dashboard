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
      <AccountDetail account={account} />
      <SalesforceProfile salesforceData={account.salesforceData} />
    </div>
  );
}
