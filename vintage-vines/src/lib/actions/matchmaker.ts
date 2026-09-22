"use server";

import { headers } from "next/headers";
import { runMatchmaker, type MatchmakerOutcome } from "@/lib/ai/matchmaker-service";

export async function requestPlantMatch(visitorText: string): Promise<MatchmakerOutcome> {
  const headersList = await headers();
  // Best-effort client identifier for rate limiting only — hashed
  // immediately inside runMatchmaker, never stored raw.
  const clientIdentifier = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return runMatchmaker(visitorText, clientIdentifier);
}
