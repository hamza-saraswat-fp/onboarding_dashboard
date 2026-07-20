import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one soft status-chip style for the whole app: a rounded, tinted pill with
// an inset ring and a leading dot. Every status-like label (lifecycle status,
// per-module completion, submit results) renders through this so they share one
// visual language. Tones map to the lifecycle palette used in the accounts table.
export type PillTone = "success" | "info" | "neutral" | "warning" | "danger";

const TONE_CLASS: Record<PillTone, string> = {
  success: "bg-green-50 text-green-700 ring-green-600/20",
  info: "bg-fp-cobalt/10 text-fp-cobalt ring-fp-cobalt/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function Pill({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
