import type { WizardStatus } from "@/lib/types";
import { displayStatus, type DisplayStatus } from "@/lib/display-status";
import { Pill, type PillTone } from "./pill";

const STATUS_META: Record<DisplayStatus, { label: string; tone: PillTone }> = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "info" },
  not_started: { label: "Not started", tone: "neutral" },
  expired: { label: "Expired", tone: "warning" },
  submission_failed: { label: "Failed", tone: "danger" },
};

// The lifecycle status chip, shared by the accounts table and the drawer/detail
// headers so the status mapping lives in one place. When progress is passed, an
// in-progress account at 0% reads as "Not started" (see displayStatus).
export function StatusPill({ status, progress }: { status: WizardStatus; progress?: number }) {
  const key = progress === undefined ? status : displayStatus(status, progress);
  const meta = STATUS_META[key];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}
