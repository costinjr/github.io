import { randomUUID } from "node:crypto";
import type { QueryExecutor } from "./db";
import { getPool } from "./db";
import type { Referral } from "./types";

type ReferralRow = {
  id: string;
  source: string;
  raw_text: string;
  received_at: string;
  service_requested: string | null;
  status: Referral["status"];
  priority: Referral["priority"];
  owner_role: Referral["ownerRole"];
  due_at: string | null;
  completeness: Referral["completeness"];
  missing_fields: string[] | string;
  current_triage_run_id: string | null;
  is_synthetic: boolean;
};

// The real `pg` driver parses a text[] column into a JS array already; this
// only has work to do against a driver that returns the raw Postgres array
// literal as a string instead (observed with pg-mem in tests).
function parsePgTextArray(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  const inner = value.slice(1, -1);
  return inner.length === 0 ? [] : inner.split(",").map((entry) => entry.trim());
}

function mapRow(row: ReferralRow): Referral {
  return {
    id: row.id,
    source: row.source,
    rawText: row.raw_text,
    receivedAt: row.received_at,
    serviceRequested: row.service_requested,
    status: row.status,
    priority: row.priority,
    ownerRole: row.owner_role,
    dueAt: row.due_at,
    completeness: row.completeness,
    missingFields: parsePgTextArray(row.missing_fields),
    currentTriageRunId: row.current_triage_run_id,
    isSynthetic: row.is_synthetic,
  };
}

export async function listReferrals(db: QueryExecutor = getPool()): Promise<Referral[]> {
  const { rows } = await db.query<ReferralRow>("select * from referrals");
  return rows.map(mapRow);
}

export async function getReferralById(id: string, db: QueryExecutor = getPool()): Promise<Referral | null> {
  const { rows } = await db.query<ReferralRow>("select * from referrals where id = $1", [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export type NewReferral = {
  source: string;
  rawText: string;
};

export async function createReferral(input: NewReferral, db: QueryExecutor = getPool()): Promise<Referral> {
  const { rows } = await db.query<ReferralRow>(
    `insert into referrals (id, source, raw_text, received_at, status, is_synthetic)
     values ($1, $2, $3, now(), 'New', true)
     returning *`,
    [randomUUID(), input.source, input.rawText],
  );
  return mapRow(rows[0]);
}
