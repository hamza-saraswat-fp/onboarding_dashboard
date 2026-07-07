import Link from "next/link";

// Shown when getAccountDetail returns null (unknown session id). Renders inside
// the dashboard shell.
export default function AccountNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Account not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">No onboarding session matches that id.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Back to summary
      </Link>
    </div>
  );
}
