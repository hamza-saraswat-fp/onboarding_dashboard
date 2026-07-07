// Local test-database harness.
//
// Resolves a LOCAL Postgres connection, hard-guards that it is local and a test
// database (the seed is destructive: it drops and recreates tables), and wires
// a vitest globalSetup that seeds once before the suite.
//
// The connection comes from TEST_DATABASE_URL, defaulting to a local database.
// We deliberately do NOT fall back to DATABASE_URL: that variable points at the
// real (read-only) onboarding Supabase in other environments, and the seed must
// never be able to touch it. vitest.config.ts injects this same URL as
// DATABASE_URL into the test environment so the app's db client (added in a
// later issue) reads the seeded test database during tests.
//
// Starting a local Postgres:
//   Docker:   docker run --name onboarding-dash-pg -e POSTGRES_PASSWORD=postgres \
//               -e POSTGRES_DB=onboarding_dash_test -p 5432:5432 -d postgres:17
//             then TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/onboarding_dash_test
//   Homebrew: brew install postgresql@17 && brew services start postgresql@17 && \
//               createdb onboarding_dash_test
//             then TEST_DATABASE_URL=postgres://localhost:5432/onboarding_dash_test (the default)

import postgres from "postgres";
import { seed } from "./seed";

type Sql = ReturnType<typeof postgres>;

const DEFAULT_TEST_DATABASE_URL = "postgres://localhost:5432/onboarding_dash_test";

export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
}

// Refuse to run the destructive seed anywhere that is not a local test database.
export function assertLocalTestDb(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid TEST_DATABASE_URL: ${url}`);
  }
  const host = parsed.hostname;
  const dbName = parsed.pathname.replace(/^\//, "");
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocalHost || !/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run the destructive test seed against "${host}/${dbName}". ` +
        `The test database must be local (localhost) and its name must contain "test". ` +
        `Set TEST_DATABASE_URL to a local test database.`,
    );
  }
}

export function createTestClient(): Sql {
  const url = testDatabaseUrl();
  assertLocalTestDb(url);
  return postgres(url, { max: 4, onnotice: () => {} });
}

// vitest globalSetup entry point: seed the test database once before the suite.
export async function setup(): Promise<void> {
  const sql = createTestClient();
  try {
    await seed(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
