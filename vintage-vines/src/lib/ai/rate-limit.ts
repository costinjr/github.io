import "server-only";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/log-error";
import { withTimeout } from "./with-timeout";

const WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 5;
const TIMEOUT_MS = 3000;

/** Never store the raw IP/session — section 6's privacy controls extend to the visitor's identifier, not just their free text. */
export function hashClientKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Section 6: "Rate-limit each public AI endpoint by IP and session."
 * Applies to the whole matchmaker call, not just the AI portion of it —
 * the endpoint is rate-limited, whether or not a given request ends up
 * needing the AI provider.
 *
 * Fails open: a broken or unreachable rate-limit store should degrade
 * to "allow," not take the whole matchmaker down with it. An outage in
 * an abuse-prevention mechanism is a much smaller problem than an
 * outage in the feature it's protecting.
 */
export async function checkAndRecordRateLimit(
  clientKey: string,
  endpoint: "matchmaker" | "help_my_plant",
): Promise<{ allowed: boolean }> {
  try {
    const supabase = createAdminClient();
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await withTimeout(
      supabase
        .from("ai_requests")
        .select("id", { count: "exact", head: true })
        .eq("client_key", clientKey)
        .eq("endpoint", endpoint)
        .gte("created_at", windowStart),
      TIMEOUT_MS,
      "rate limit check",
    );
    if (countError) throw countError;

    if ((count ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false };
    }

    const { error: insertError } = await withTimeout(
      supabase.from("ai_requests").insert({ client_key: clientKey, endpoint }),
      TIMEOUT_MS,
      "rate limit record",
    );
    if (insertError) throw insertError;

    return { allowed: true };
  } catch (error) {
    logError("rate-limit check failed, failing open", error);
    return { allowed: true };
  }
}
