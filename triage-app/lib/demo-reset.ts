import { DEMO_CASES_V1 } from "@/config/demo-cases.v1";

export interface QueryExecutor {
  query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

export async function resetDemoData(db: QueryExecutor): Promise<{ count: number }> {
  await db.query("delete from referrals");

  const now = Date.now();
  for (const demoCase of DEMO_CASES_V1) {
    const receivedAt = new Date(now - demoCase.receivedOffsetMinutes * 60_000).toISOString();
    await db.query(
      `insert into referrals (id, source, raw_text, received_at, status, is_synthetic)
       values ($1, $2, $3, $4, 'New', true)`,
      [demoCase.id, demoCase.source, demoCase.rawText, receivedAt],
    );
  }

  const { rows } = await db.query<{ count: number }>(
    "select count(*)::int as count from referrals where is_synthetic = true",
  );
  return { count: Number(rows[0]?.count ?? 0) };
}
