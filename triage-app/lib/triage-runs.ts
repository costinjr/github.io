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

// Always empty until a later session adds AI extraction and rules, but the
// referral detail page needs a real (if currently empty) history to render.
export async function listTriageRuns(referralId: string, db: QueryExecutor = getPool()): Promise<TriageRun[]> {
  const { rows } = await db.query<TriageRunRow>(
    "select * from triage_runs where referral_id = $1 order by created_at desc",
    [referralId],
  );
  return rows.map(mapRow);
}
