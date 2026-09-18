import { randomUUID } from "node:crypto";
import type { QueryExecutor } from "./db";
import { getPool } from "./db";
import type { OwnerRole, Referral, ReferralPriority } from "./types";

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

export type TriageResultUpdate = {
  serviceRequested: string | null;
  priority: ReferralPriority;
  ownerRole: OwnerRole;
  dueAt: string;
  completeness: "complete" | "incomplete";
  missingFields: string[];
  triageRunId: string;
};

// Applied after a successful extraction + rules pass. Never called for a
// needs_review outcome — an unresolved run must not overwrite already-known
// facts, and "unknown" fields must stay unknown rather than being guessed.
export async function applyTriageResultToReferral(
  referralId: string,
  update: TriageResultUpdate,
  db: QueryExecutor = getPool(),
): Promise<void> {
  await db.query(
    `update referrals
     set service_requested = $1, priority = $2, owner_role = $3, due_at = $4,
         completeness = $5, missing_fields = $6, current_triage_run_id = $7
     where id = $8`,
    [
      update.serviceRequested,
      update.priority,
      update.ownerRole,
      update.dueAt,
      update.completeness,
      update.missingFields,
      update.triageRunId,
      referralId,
    ],
  );
}

// Used for a needs_review outcome: the referral's own facts stay untouched,
// but the detail page still needs to find the latest (failed) run.
export async function setCurrentTriageRun(
  referralId: string,
  triageRunId: string,
  db: QueryExecutor = getPool(),
): Promise<void> {
  await db.query("update referrals set current_triage_run_id = $1 where id = $2", [triageRunId, referralId]);
}
