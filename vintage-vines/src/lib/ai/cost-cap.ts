import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { AiEndpoint } from "@/types/database";
import { logError } from "@/lib/log-error";
import { withTimeout } from "./with-timeout";

const TIMEOUT_MS = 3000;

/**
 * Section 6: "Enforce a hard monthly AI API spend cap across the
 * matchmaker and 'Help my plant.' When the cap is reached, stop model
 * calls and fall back gracefully to deterministic matching, templated
 * explanations, and the care-troubleshooting checklist." Shared across
 * both features by design — the cap is one number, not one per feature.
 *
 * Fails closed: if the spend log can't be read, we can't prove we're
 * under the cap, so treat that as "over" and skip the AI call rather
 * than risk uncapped spend during an outage. The matchmaker itself
 * still works — it just runs deterministic-only, exactly like the
 * cap-reached case.
 */
export async function isUnderMonthlySpendCap(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { data, error } = await withTimeout(
      supabase.from("ai_usage_log").select("estimated_cost_cents").gte("created_at", monthStart.toISOString()),
      TIMEOUT_MS,
      "spend cap check",
    );
    if (error) throw error;

    const spent = (data ?? []).reduce((sum, row) => sum + row.estimated_cost_cents, 0);
    return spent < env.AI_MONTHLY_SPEND_CAP_CENTS;
  } catch (error) {
    logError("cost-cap check failed, failing closed (AI disabled this request)", error);
    return false;
  }
}

/** Best-effort logging — a failure here must not undo an otherwise-successful AI response. */
export async function recordAiUsage(endpoint: AiEndpoint, costCents: number): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await withTimeout(
      supabase.from("ai_usage_log").insert({ endpoint, estimated_cost_cents: costCents }),
      TIMEOUT_MS,
      "usage log write",
    );
    if (error) throw error;
  } catch (error) {
    logError("cost-cap failed to record AI usage", error);
  }
}
