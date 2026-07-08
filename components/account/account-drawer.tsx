"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountDetail } from "./account-detail";
import { SalesforceProfile } from "./sf-profile";
import { StatusPill } from "./status-pill";
import type { AccountDetail as AccountDetailData } from "@/lib/queries/account";

export interface DrawerAccount {
  id: string;
  companyId: string;
  companyName: string | null;
}

// Revives the ISO-string dates in the JSON payload back into Date objects so the
// presentational components (which type these as Date) receive what they expect.
function reviveAccount(raw: unknown): AccountDetailData {
  const data = raw as Record<string, unknown>;
  const toDate = (v: unknown): Date => new Date(v as string);
  const toDateOrNull = (v: unknown): Date | null => (v == null ? null : new Date(v as string));

  return {
    sessionId: data.sessionId as string,
    companyId: data.companyId as string,
    status: data.status as AccountDetailData["status"],
    currentModule: data.currentModule as number,
    progress: data.progress as number,
    createdAt: toDate(data.createdAt),
    submittedAt: toDateOrNull(data.submittedAt),
    expiresAt: toDate(data.expiresAt),
    salesforceData: (data.salesforceData ?? {}) as Record<string, unknown>,
    moduleSelections: ((data.moduleSelections as Record<string, unknown>[]) ?? []).map((m) => ({
      sessionId: m.sessionId as string,
      moduleKey: m.moduleKey as string,
      moduleNumber: m.moduleNumber as number,
      formData: (m.formData ?? {}) as Record<string, unknown>,
      isComplete: m.isComplete as boolean,
      savedAt: toDate(m.savedAt),
    })),
    submitResults: ((data.submitResults as Record<string, unknown>[]) ?? []).map((j) => ({
      sessionId: j.sessionId as string,
      jobType: j.jobType as string,
      status: j.status as AccountDetailData["submitResults"][number]["status"],
      errorMessage: (j.errorMessage ?? null) as string | null,
      completedAt: toDateOrNull(j.completedAt),
    })),
  };
}

// Right-side slide-out that shows one account's full onboarding detail in the
// context of the summary. It fetches lazily when opened, keeps the last loaded
// account visible while closing (so the exit animation is clean), and closes on
// scrim click or Escape. The standalone /accounts/[id] page is still available
// via "Open full page" for deep links.
export function AccountDrawer({ selected, onClose }: { selected: DrawerAccount | null; onClose: () => void }) {
  const open = selected !== null;
  const accountId = selected?.id ?? null;
  const [account, setAccount] = useState<AccountDetailData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    const load = async () => {
      setState("loading");
      setAccount(null);
      try {
        const res = await fetch(`/api/accounts/${accountId}`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (cancelled) return;
        setAccount(reviveAccount(json));
        setState("idle");
      } catch {
        if (!cancelled) setState("error");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleClose]);

  const displayName = selected?.companyName ?? selected?.companyId ?? account?.companyId ?? "";
  const displayId = selected?.companyId ?? account?.companyId ?? "";

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-foreground/40" onClick={handleClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Account detail"
        className={`absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-background shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</div>
            <div className="truncate text-lg font-semibold text-foreground">{displayName}</div>
            <div className="mt-1 flex items-center gap-2">
              {account ? <StatusPill status={account.status} /> : null}
              {displayId && displayId !== displayName ? (
                <span className="truncate text-xs text-muted-foreground">ID {displayId}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {accountId ? (
              <Link href={`/accounts/${accountId}`} className="text-sm font-medium text-primary hover:underline">
                Open full page
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {state === "loading" ? (
            <p className="text-sm text-muted-foreground">Loading account detail...</p>
          ) : state === "error" ? (
            <p className="text-sm text-destructive">Could not load this account. Close and try again.</p>
          ) : account ? (
            <div className="space-y-6">
              <AccountDetail account={account} showHeader={false} />
              <SalesforceProfile salesforceData={account.salesforceData} />
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
