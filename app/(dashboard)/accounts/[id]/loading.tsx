// Skeleton shown while the account detail loads.
export default function AccountLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading account">
      <div className="h-8 w-72 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-48 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
