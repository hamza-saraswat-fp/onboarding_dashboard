import Link from "next/link";
import Image from "next/image";

// Persistent app shell: a navy top bar with the FieldPulse logo, over a centered
// content column. The dashboard is a single page (overview plus the accounts list
// with the drill-down drawer), so there is no tab nav. Desktop-first.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-fp-navy">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="FieldPulse onboarding app home"
          >
            <Image src="/fieldpulse-logo-white.png" alt="FieldPulse" width={130} height={28} priority />
            <span className="relative top-[3px] hidden border-l border-white/25 pl-3 text-lg font-semibold text-white sm:inline">
              Onboarding App
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
