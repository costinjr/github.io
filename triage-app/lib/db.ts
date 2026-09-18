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
      // Certificate verification is relaxed rather than left on: Vercel's
      // Node runtime doesn't ship the CA needed to verify Supabase's chain,
      // which surfaces as "self-signed certificate in certificate chain".
      // This is Supabase's own documented guidance for serverless clients —
      // see README for the tradeoff it carries.
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}
