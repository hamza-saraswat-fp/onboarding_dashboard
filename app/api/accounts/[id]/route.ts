// Read-only JSON endpoint for one account's full onboarding detail. Powers the
// summary page's slide-out drawer, which fetches lazily on open so the summary
// payload stays small. The standalone /accounts/[id] page reuses the same
// getAccountDetail assembler for deep links.
//
// Dates serialize to ISO strings over JSON; the client revives them. This route
// is gated by the same middleware as every other route.

import { NextResponse } from "next/server";
import { getAccountDetail } from "@/lib/queries/account";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAccountDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
