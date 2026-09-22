import type { MatchPreferences } from "@/lib/matching/types";
import type { AiBlurbOutput } from "./schemas";

export interface CandidateFacts {
  id: string;
  displayName: string;
  plantDescription: string;
  priceCents: number;
  lightLevels: string[];
  careDifficulty: string;
  petSafety: string;
  watering: string | null;
  directionalPlacement: string | null;
}

export interface BlurbRequest {
  visitorText: string;
  selected: CandidateFacts;
  alternates: CandidateFacts[];
}

export interface AiCallResult<T> {
  data: T;
  /** Real usage from the provider's response, for cost-cap accounting — never estimated. */
  costCents: number;
}

/**
 * Section 12: "AI: provider adapter called only from server code. Model
 * and provider configured by environment variables." Anything that
 * wants AI parsing or prose talks to this interface, never to a
 * specific SDK directly — swapping providers means implementing this
 * once more, not touching the callers.
 */
export interface AiProvider {
  parsePreferences(visitorText: string): Promise<AiCallResult<MatchPreferences>>;
  writeBlurb(request: BlurbRequest): Promise<AiCallResult<AiBlurbOutput>>;
}
