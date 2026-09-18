import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set.");
    }
    pool = new Pool({
      connectionString,
      // Supabase requires TLS on both its direct connection and its pooler;
      // `pg` doesn't always infer that from the connection string alone.
      // Certificate validation stays on — see README for what to do if a
      // deployment target's CA bundle can't verify Supabase's chain.
      ssl: process.env.NODE_ENV === "production" ? true : undefined,
    });
  }
  return pool;
}
