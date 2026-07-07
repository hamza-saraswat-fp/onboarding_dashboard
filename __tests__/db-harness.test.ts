import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient } from "../db/test-db";
import { SEED_COUNTS } from "../db/seed";

type Sql = ReturnType<typeof import("postgres")>;

describe("db harness", () => {
  let sql: Sql;

  beforeAll(() => {
    sql = createTestClient();
  });

  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("seeds the expected number of sessions", async () => {
    const [row] = await sql<{ count: number }[]>`select count(*)::int as count from wizard_sessions`;
    expect(row.count).toBe(SEED_COUNTS.sessions);
  });

  it("covers every lifecycle status", async () => {
    const rows = await sql<{ status: string; count: number }[]>`
      select status, count(*)::int as count from wizard_sessions group by status
    `;
    const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
    expect(byStatus).toEqual(SEED_COUNTS.sessionsByStatus);
  });

  it("seeds module rows with both complete and incomplete", async () => {
    const [total] = await sql<{ count: number }[]>`select count(*)::int as count from wizard_module_data`;
    const [complete] = await sql<{ count: number }[]>`select count(*)::int as count from wizard_module_data where is_complete`;
    const [incomplete] = await sql<{ count: number }[]>`select count(*)::int as count from wizard_module_data where not is_complete`;
    expect(total.count).toBe(SEED_COUNTS.moduleData);
    expect(complete.count).toBe(SEED_COUNTS.moduleComplete);
    expect(incomplete.count).toBe(SEED_COUNTS.moduleIncomplete);
  });

  it("seeds import jobs covering success, failed, and skipped", async () => {
    const [total] = await sql<{ count: number }[]>`select count(*)::int as count from import_jobs`;
    const rows = await sql<{ status: string; count: number }[]>`
      select status, count(*)::int as count from import_jobs group by status
    `;
    const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
    expect(total.count).toBe(SEED_COUNTS.importJobs);
    expect(byStatus).toEqual(SEED_COUNTS.importJobsByStatus);
  });
});
