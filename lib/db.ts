// The single Postgres client for the dashboard.
//
// Read-only by contract: this dashboard never writes to the onboarding
// database. The production DATABASE_URL is a read-only credential (provisioned
// outside this repo), and this module deliberately exports only the `sql`
// client for SELECTs. Do not add insert/update/delete helpers here.
//
// A process-wide singleton, cached on globalThis in non-production so Next.js
// dev hot-reloads reuse one connection pool instead of opening a new one on
// every reload.

import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

function createClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return postgres(url, { max: 10, onnotice: () => {} });
}

const globalForDb = globalThis as unknown as { onboardingSql?: Sql };

export const sql: Sql = globalForDb.onboardingSql ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.onboardingSql = sql;
}
