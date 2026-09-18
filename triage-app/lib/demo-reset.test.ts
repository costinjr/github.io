import { readFileSync } from "node:fs";
import { join } from "node:path";
import { newDb } from "pg-mem";
import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_CASES_V1 } from "@/config/demo-cases.v1";
import { resetDemoData, type QueryExecutor } from "./demo-reset";

const migrationSql = readFileSync(
  join(__dirname, "..", "supabase", "migrations", "0001_init.sql"),
  "utf-8",
);

function createTestDb(): QueryExecutor {
  const db = newDb();
  db.public.none(migrationSql);
  const { Pool } = db.adapters.createPg();
  return new Pool();
}

describe("resetDemoData", () => {
  let db: QueryExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it("creates exactly the nine synthetic referrals", async () => {
    const result = await resetDemoData(db);

    expect(result.count).toBe(9);
    expect(DEMO_CASES_V1).toHaveLength(9);

    const { rows } = await db.query<{ id: string; is_synthetic: boolean }>(
      "select id, is_synthetic from referrals order by id",
    );
    expect(rows).toHaveLength(9);
    expect(rows.every((row) => row.is_synthetic)).toBe(true);
    expect(rows.map((row) => row.id)).toEqual(DEMO_CASES_V1.map((c) => c.id).sort());
  });

  it("is idempotent: running it twice still leaves exactly nine records", async () => {
    await resetDemoData(db);
    const second = await resetDemoData(db);

    expect(second.count).toBe(9);

    const { rows } = await db.query<{ count: number }>("select count(*)::int as count from referrals");
    expect(Number(rows[0]?.count)).toBe(9);
  });

  it("clears any non-seed referrals created since the last reset", async () => {
    await resetDemoData(db);
    await db.query(
      `insert into referrals (id, source, raw_text, received_at, status, is_synthetic)
       values ('AD-HOC-1', 'form', 'Manually entered during the demo', now(), 'New', true)`,
    );

    const result = await resetDemoData(db);

    expect(result.count).toBe(9);
    const { rows } = await db.query("select id from referrals where id = 'AD-HOC-1'");
    expect(rows).toHaveLength(0);
  });
});
