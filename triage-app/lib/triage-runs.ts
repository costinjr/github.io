import { randomUUID } from "node:crypto";
import type { QueryExecutor } from "./db";
import { getPool } from "./db";
import type { TriageRun } from "./types";

type TriageRunRow = {
  id: string;
  referral_id: string;
  created_at: string;
  model: string | null;
  prompt_version: string | null;
  rules_version: string | null;
  extracted_json: unknown;
  evidence_json: unknown;
  confidence: number | null;
  rule_hits: unknown;
  final_priority: string | null;
  final_route: string | null;
};

function mapRow(row: TriageRunRow): TriageRun {
  return {
    id: row.id,
    referralId: row.referral_id,
    createdAt: row.created_at,
    model: row.model,
    promptVersion: row.prompt_version,
    rulesVersion: row.rules_version,
    extractedJson: row.extracted_json,
    evidenceJson: row.evidence_json,
    confidence: row.confidence,
    ruleHits: row.rule_hits,
    finalPriority: row.final_priority,
    finalRoute: row.final_route,
  };
}

export async function listTriageRuns(referralId: string, db: QueryExecutor = getPool()): Promise<TriageRun[]> {
  const { rows } = await db.query<TriageRunRow>(
    "select * from triage_runs where referral_id = $1 order by created_at desc",
    [referralId],
  );
  return rows.map(mapRow);
}

export type NewTriageRun = {
  referralId: string;
  model: string | null;
  promptVersion: string | null;
  rulesVersion: string | null;
  extractedJson: unknown;
  evidenceJson: unknown;
  confidence: number | null;
  ruleHits: string[] | null;
  finalPriority: string | null;
  finalRoute: string | null;
};

// Immutable: a triage run is only ever inserted, never updated. Re-running
// triage creates a new row rather than overwriting this one.
export async function createTriageRun(input: NewTriageRun, db: QueryExecutor = getPool()): Promise<TriageRun> {
  const { rows } = await db.query<TriageRunRow>(
    `insert into triage_runs
       (id, referral_id, model, prompt_version, rules_version, extracted_json, evidence_json, confidence, rule_hits, final_priority, final_route)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning *`,
    [
      randomUUID(),
      input.referralId,
      input.model,
      input.promptVersion,
      input.rulesVersion,
      // jsonb columns: pg does not auto-serialize JS objects/arrays — verified
      // empirically against real Postgres (a raw array/object here produces a
      // malformed value pg's own array serializer mangles before Postgres
      // even sees it as JSON).
      input.extractedJson === null ? null : JSON.stringify(input.extractedJson),
      input.evidenceJson === null ? null : JSON.stringify(input.evidenceJson),
      input.confidence,
      input.ruleHits === null ? null : JSON.stringify(input.ruleHits),
      input.finalPriority,
      input.finalRoute,
    ],
  );
  return mapRow(rows[0]);
}
