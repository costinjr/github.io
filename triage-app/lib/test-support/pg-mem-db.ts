import { readFileSync } from "node:fs";
import { join } from "node:path";
import { newDb } from "pg-mem";
import type { QueryExecutor } from "../db";

const migrationSql = readFileSync(join(__dirname, "..", "..", "supabase", "migrations", "0001_init.sql"), "utf-8");

export function createTestDb(): QueryExecutor {
  const db = newDb();
  db.public.none(migrationSql);
  const { Pool } = db.adapters.createPg();
  return new Pool();
}
