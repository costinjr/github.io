import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/log-error";
import type { AnalyticsEventType } from "@/types/database";

export interface LogEventInput {
  path?: string;
  inventoryItemId?: string;
  resultState?: string;
}

/**
 * Section 15: "privacy-minded analytics." First-party, no third-party
 * tracker, and never the visitor's free-text input — just a named
 * event, optionally an inventory id and a broad result state.
 *
 * Fire-and-forget: a failure here must never break the feature it's
 * measuring. Errors are logged, not thrown — the same posture as the
 * rate limiter and cost cap, and for the same reason.
 */
export async function logEvent(eventType: AnalyticsEventType, input: LogEventInput = {}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventType,
      inventory_item_id: input.inventoryItemId ?? null,
      path: input.path ?? null,
      result_state: input.resultState ?? null,
    });
    if (error) throw error;
  } catch (error) {
    logError(`analytics failed to log ${eventType}`, error);
  }
}
