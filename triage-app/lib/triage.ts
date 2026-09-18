import { applyTriageRules, TRIAGE_RULES_VERSION } from "@/config/triage-rules.v1";
import type { QueryExecutor } from "./db";
import { getPool } from "./db";
import { AnthropicModelCaller, runExtraction } from "./extraction";
import type { ModelCaller } from "./extraction";
import { applyTriageResultToReferral, setCurrentTriageRun } from "./referrals";
import { createTriageRun } from "./triage-runs";
import type { Referral } from "./types";

export type TriagePipelineOutcome =
  | { status: "ok"; triageRunId: string; priority: string; ruleHits: string[] }
  | { status: "needs_review"; triageRunId: string; reason: string };

// Ties Sessions 5 and 6 together: extraction proposes, this function's own
// rules call decides, and every run — successful or not — is persisted as
// an immutable triage_runs row before anything touches the referral itself.
export async function runTriagePipeline(
  referral: Referral,
  db: QueryExecutor = getPool(),
  caller: ModelCaller = new AnthropicModelCaller(),
): Promise<TriagePipelineOutcome> {
  const extractionOutcome = await runExtraction(referral.rawText, caller);

  if (extractionOutcome.status === "needs_review") {
    const run = await createTriageRun(
      {
        referralId: referral.id,
        model: null,
        promptVersion: null,
        rulesVersion: null,
        extractedJson: { needs_review: true, reason: extractionOutcome.reason },
        evidenceJson: null,
        confidence: null,
        ruleHits: null,
        finalPriority: null,
        finalRoute: null,
      },
      db,
    );
    // The referral's own facts stay untouched — unknown remains unknown —
    // but the detail page still needs to find this latest attempt.
    await setCurrentTriageRun(referral.id, run.id, db);
    return { status: "needs_review", triageRunId: run.id, reason: extractionOutcome.reason };
  }

  const { result, model, promptVersion } = extractionOutcome;
  const ruleOutcome = applyTriageRules({ extraction: result, receivedAt: referral.receivedAt });

  const run = await createTriageRun(
    {
      referralId: referral.id,
      model,
      promptVersion,
      rulesVersion: TRIAGE_RULES_VERSION,
      extractedJson: result,
      evidenceJson: result.evidence_quotes,
      confidence: result.confidence,
      ruleHits: ruleOutcome.ruleHits,
      finalPriority: ruleOutcome.priority,
      finalRoute: result.suggested_route,
    },
    db,
  );

  await applyTriageResultToReferral(
    referral.id,
    {
      serviceRequested: result.requested_service,
      priority: ruleOutcome.priority,
      ownerRole: ruleOutcome.ownerRole,
      dueAt: ruleOutcome.dueAt,
      completeness: result.completeness,
      missingFields: result.missing_fields,
      triageRunId: run.id,
    },
    db,
  );

  return { status: "ok", triageRunId: run.id, priority: ruleOutcome.priority, ruleHits: ruleOutcome.ruleHits };
}
