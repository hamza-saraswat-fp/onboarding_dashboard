import { AppShell } from "@/components/app-shell";

// Wraps the dashboard routes (summary and accounts) in the persistent shell.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
