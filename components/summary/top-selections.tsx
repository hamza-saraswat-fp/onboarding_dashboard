import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelectionSection } from "@/lib/metrics/selections";

// Highest-volume selections, grouped into the curated sections (customer tags,
// job workflows, ClearPath, customer communications, custom forms). Each section
// lists its most-chosen options, ranked.
export function TopSelections({ sections }: { sections: SelectionSection[] }) {
  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>Most common selections</CardTitle>
        <CardDescription>The options customers choose most, by section.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-8 gap-y-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {sections.map((section) => {
            const max = Math.max(1, ...section.items.map((i) => i.count));
            return (
              <div key={section.key} className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </h3>
                {section.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No selections in this range.</p>
                ) : (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.label} className="grid grid-cols-[1fr_5rem] items-center gap-3 text-sm">
                        <span className="truncate text-foreground" title={item.label}>
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-fp-cobalt"
                              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                            />
                          </div>
                          <span className="w-6 text-right tabular-nums text-muted-foreground">{item.count}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
