import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/onboarding_dash_test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts", "lib/**/*.test.ts"],
    globalSetup: ["./db/test-db.ts"],
    // Inject the local test DB as DATABASE_URL for the test environment so the
    // app's db client (added in a later issue) reads the seeded test database,
    // never the real onboarding Supabase.
    env: {
      TEST_DATABASE_URL,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
});
