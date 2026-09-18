import { randomUUID } from "node:crypto";
import type { QueryExecutor } from "./db";
import { getPool } from "./db";
import type { ReferralStatus, WorkflowEvent } from "./types";

type WorkflowEventRow = {
  id: string;
  referral_id: string;
  created_at: string;
  event_type: WorkflowEvent["eventType"];
  from_value: string | null;
  to_value: string | null;
  note: string | null;
};

function mapRow(row: WorkflowEventRow): WorkflowEvent {
  return {
    id: row.id,
    referralId: row.referral_id,
    createdAt: row.created_at,
    eventType: row.event_type,
    fromValue: row.from_value,
    toValue: row.to_value,
    note: row.note,
  };
}

export async function listWorkflowEvents(referralId: string, db: QueryExecutor = getPool()): Promise<WorkflowEvent[]> {
  const { rows } = await db.query<WorkflowEventRow>(
    "select * from workflow_events where referral_id = $1 order by created_at asc",
    [referralId],
  );
  return rows.map(mapRow);
}

export async function changeReferralStatus(
  referralId: string,
  fromStatus: ReferralStatus,
  toStatus: ReferralStatus,
  db: QueryExecutor = getPool(),
): Promise<void> {
  await db.query("update referrals set status = $1 where id = $2", [toStatus, referralId]);
  await db.query(
    `insert into workflow_events (id, referral_id, event_type, from_value, to_value)
     values ($1, $2, 'status_change', $3, $4)`,
    [randomUUID(), referralId, fromStatus, toStatus],
  );
}

export async function addWorkflowNote(referralId: string, note: string, db: QueryExecutor = getPool()): Promise<void> {
  await db.query(
    `insert into workflow_events (id, referral_id, event_type, note)
     values ($1, $2, 'note', $3)`,
    [randomUUID(), referralId, note],
  );
}

export function describeWorkflowEvent(event: WorkflowEvent): string {
  if (event.eventType === "status_change") {
    return `Status changed from ${event.fromValue} to ${event.toValue}.`;
  }
  return `Note: ${event.note}`;
}
