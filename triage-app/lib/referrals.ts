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
  missing_fields: string[];
  current_triage_run_id: string | null;
  is_synthetic: boolean;
};

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
    missingFields: row.missing_fields,
    currentTriageRunId: row.current_triage_run_id,
    isSynthetic: row.is_synthetic,
  };
}

export async function listReferrals(): Promise<Referral[]> {
  const { rows } = await getPool().query<ReferralRow>("select * from referrals");
  return rows.map(mapRow);
}
