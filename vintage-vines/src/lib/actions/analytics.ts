"use server";

import { logEvent } from "@/lib/analytics/log-event";
import type { AnalyticsEventType } from "@/types/database";

/** The only analytics entry point client components should call — everything else logs directly from server code. */
export async function trackEvent(eventType: AnalyticsEventType, path?: string): Promise<void> {
  await logEvent(eventType, { path });
}
