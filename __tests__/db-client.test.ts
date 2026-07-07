import { describe, it, expect, afterAll } from "vitest";
import { sql } from "../lib/db";
import type { WizardSession } from "../lib/types";

// Exercises the read-only client against the seeded local test database
// (DATABASE_URL is pointed at it by vitest.config.ts).
describe("db client", () => {
  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("runs a SELECT and returns typed rows", async () => {
    const rows = await sql<Pick<WizardSession, "id" | "companyId" | "status">[]>`
      select id, company_id as "companyId", status
      from wizard_sessions
      order by created_at
      limit 1
    `;

    expect(rows).toHaveLength(1);
    expect(typeof rows[0].id).toBe("string");
    expect(typeof rows[0].companyId).toBe("string");
    expect(["in_progress", "completed", "expired", "submission_failed"]).toContain(rows[0].status);
  });
});
