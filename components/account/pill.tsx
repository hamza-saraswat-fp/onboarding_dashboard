import type { ReactNode } from "react";
import { Check, Hourglass, Minus, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The one soft status-chip style for the whole app: a rounded, tinted pill with
// an inset ring that matches the text color and a leading icon (no enclosing
// circle). Every status-like label (lifecycle status, per-module completion,
// submit results) renders through this so they share one visual language. Tones
// map to the lifecycle palette used in the accounts table; successStrong is the
// filled dark green for submit-results Success, distinct from the soft green
// Completed. `ring-current` makes each pill's outline the same color as its word.
export type PillTone = "success" | "successStrong" | "info" | "neutral" | "warning" | "danger";

const TONE_META: Record<PillTone, { className: string; icon: LucideIcon }> = {
  success: { className: "bg-green-50 text-green-700 ring-current", icon: Check },
  successStrong: { className: "bg-green-700 text-white ring-green-800", icon: Check },
  info: { className: "bg-fp-cobalt/10 text-fp-cobalt ring-current", icon: Hourglass },
  neutral: { className: "bg-slate-100 text-slate-600 ring-current", icon: Minus },
  warning: { className: "bg-amber-50 text-amber-700 ring-current", icon: TriangleAlert },
  danger: { className: "bg-destructive/10 text-destructive ring-current", icon: X },
};

export function Pill({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  const meta = TONE_META[tone];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-[1.5px] ring-inset",
        meta.className,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      {children}
    </span>
  );
}
