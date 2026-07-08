"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AccountDrawer } from "@/components/account/account-drawer";
import { StatusPill } from "@/components/account/status-pill";
import type { WizardStatus } from "@/lib/types";
import type { AccountRow } from "@/lib/queries/account";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

// The name shown in the Company column: the Salesforce account name when present,
// otherwise the raw company id.
function displayName(row: AccountRow): string {
  return row.companyName ?? row.companyId;
}

// Provisional test-account heuristic. The onboarding data has no explicit test
// flag yet, so we match common test/demo markers in the company id. This is a
// stopgap to be refined later (e.g. an explicit column or an allowlist).
const TEST_RE = /test|e2e|demo|sample|dummy|staging|\bqa\b/i;
function isTestAccount(companyId: string): boolean {
  return TEST_RE.test(companyId);
}

const STATUS_FILTERS: { value: WizardStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
  { value: "submission_failed", label: "Failed" },
];

type SortKey = "companyId" | "status" | "progress" | "createdAt";
type SortDir = "asc" | "desc";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" });
}

function SortHeader({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  columnKey: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === columnKey;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <span className="text-[10px] leading-none">{active ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </TableHead>
  );
}

// The accounts list: one row per onboarding link. Client-side search, status
// filtering, sorting, and pagination keep the whole set readable without an
// endless scroll. Clicking a row opens the detail drawer in place.
export function AccountsTable({ rows }: { rows: AccountRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WizardStatus | "all">("all");
  const [hideTest, setHideTest] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AccountRow | null>(null);

  const testCount = useMemo(() => rows.filter((r) => isTestAccount(r.companyId)).length, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (hideTest && isTestAccount(r.companyId)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !r.companyId.toLowerCase().includes(q) && !(r.companyName ?? "").toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [rows, query, statusFilter, hideTest]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "companyId":
          return displayName(a).localeCompare(displayName(b)) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "progress":
          return (a.progress - b.progress) * dir;
        default:
          return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = sorted.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(sorted.length, (currentPage + 1) * PAGE_SIZE);

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "progress" ? "desc" : "asc");
    }
    setPage(0);
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Accounts</CardTitle>
          <span className="text-sm text-muted-foreground tabular-nums">
            {sorted.length === 0 ? "No accounts" : `Showing ${rangeStart}-${rangeEnd} of ${sorted.length}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search company ID"
            className="h-8 w-52 rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex flex-wrap items-center gap-1">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(0);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
          {testCount > 0 ? (
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={hideTest}
                onChange={(e) => {
                  setHideTest(e.target.checked);
                  setPage(0);
                }}
                className="size-3.5 accent-[var(--fp-navy)]"
              />
              Hide test accounts ({testCount})
            </label>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No accounts match these filters.</p>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  <SortHeader label="Company" columnKey="companyId" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Status" columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Progress" columnKey="progress" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
                  <TableHead className="text-right text-muted-foreground">Modules</TableHead>
                  <SortHeader label="Created" columnKey="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                  const isTest = isTestAccount(row.companyId);
                  return (
                    <TableRow
                      key={row.id}
                      tabIndex={0}
                      onClick={() => setSelected(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(row);
                        }
                      }}
                      className="cursor-pointer outline-none focus-visible:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{displayName(row)}</span>
                            {row.companyName ? (
                              <span className="text-xs text-muted-foreground tabular-nums">{row.companyId}</span>
                            ) : null}
                          </div>
                          {isTest ? (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Test
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={row.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.round(row.progress * 100)}%` }}
                            />
                          </div>
                          <span className="w-9 text-right tabular-nums text-foreground">
                            {Math.round(row.progress * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.modulesComplete}/{row.modulesTotal}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button size="sm" variant="outline" disabled={currentPage === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </CardContent>

      <AccountDrawer
        selected={
          selected
            ? { id: selected.id, companyId: selected.companyId, companyName: selected.companyName }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}
