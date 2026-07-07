import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { WizardStatus } from "@/lib/types";

export interface SessionRow {
  id: string;
  companyId: string;
  status: WizardStatus;
  progress: number; // 0..1
  createdAt: Date;
}

const STATUS_LABELS: Record<WizardStatus, string> = {
  in_progress: "In progress",
  completed: "Completed",
  expired: "Expired",
  submission_failed: "Submission failed",
};

function StatusBadge({ status }: { status: WizardStatus }) {
  const variant = status === "completed" ? "default" : status === "submission_failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" });
}

// Compact list of accounts in the current view; each row links to the account
// drill-down. Rows come from data the summary page already loaded.
export function SessionsTable({ rows }: { rows: SessionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts in the selected range.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/accounts/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.companyId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(row.progress * 100)}%</TableCell>
                  <TableCell className="text-right tabular-nums">{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
