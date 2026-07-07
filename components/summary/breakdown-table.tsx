import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface BreakdownRow {
  value: string;
  totalLinks: number;
  totalCompletions: number;
  completionRate: number; // 0..1
  avgProgress: number; // 0..1
}

// The summary's key metrics grouped by the chosen Salesforce dimension. Shown
// only when a breakdown is active. Values are computed on the page.
export function BreakdownTable({ dimensionLabel, rows }: { dimensionLabel: string; rows: BreakdownRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Breakdown by {dimensionLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dimensionLabel}</TableHead>
              <TableHead className="text-right">Links</TableHead>
              <TableHead className="text-right">Completions</TableHead>
              <TableHead className="text-right">Completion rate</TableHead>
              <TableHead className="text-right">Avg progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.value}>
                <TableCell className="font-medium text-foreground">{r.value}</TableCell>
                <TableCell className="text-right tabular-nums">{r.totalLinks}</TableCell>
                <TableCell className="text-right tabular-nums">{r.totalCompletions}</TableCell>
                <TableCell className="text-right tabular-nums">{Math.round(r.completionRate * 100)}%</TableCell>
                <TableCell className="text-right tabular-nums">{Math.round(r.avgProgress * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
