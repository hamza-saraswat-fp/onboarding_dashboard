import type { WizardStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<WizardStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-50 text-green-700 ring-green-600/20" },
  in_progress: { label: "In progress", className: "bg-fp-cobalt/10 text-fp-cobalt ring-fp-cobalt/20" },
  expired: { label: "Expired", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  submission_failed: { label: "Failed", className: "bg-destructive/10 text-destructive ring-destructive/20" },
};

// A small colored status chip, shared by the accounts table and the drawer header
// so the lifecycle color mapping stays in one place.
export function StatusPill({ status }: { status: WizardStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  );
}
