import { careDifficultyLabels, lightLevelLabels, wateringLabels } from "@/lib/display-labels";
import { formatPriceCents } from "@/lib/format";
import type { ScoredCandidate, MatchPreferences } from "./types";

// Section 6's AI output contract: "headline │ Short sentence, maximum
// 70 characters." This fallback reuses the same contract so Phase 7
// can swap the AI-generated headline in without changing the shape.
const MAX_HEADLINE_LENGTH = 70;

function truncateToHeadline(preferred: string, displayName: string): string {
  if (preferred.length <= MAX_HEADLINE_LENGTH) return preferred;
  const shorter = `${displayName} is a great fit.`;
  if (shorter.length <= MAX_HEADLINE_LENGTH) return shorter;
  return `${displayName.slice(0, MAX_HEADLINE_LENGTH - 1)}…`;
}

export interface MatchExplanation {
  headline: string;
  reason: string;
  careNote: string;
  constraintNotes: string[];
}

// Exact copy from section 6's empty/error states. Do not call the AI
// for this state — there's nothing to match against.
export const NO_INVENTORY_MESSAGE =
  "The potting bench is between batches. Tell Libby what you're looking for, or follow along for the next drop.";

export function explainNoCompatibleResult(limitingReason: string): string {
  if (limitingReason === "pet safety") {
    return "Nothing available today is confirmed pet-safe, so I don't want to guess — message Libby and she'll let you know what's coming.";
  }
  if (limitingReason === "budget") {
    return "Nothing available today fits that budget. Message Libby — she may know of something close, or when the next batch will land.";
  }
  return "Nothing available today fits what you described. Message Libby directly and she'll help you find the right piece.";
}

/**
 * The deterministic explanation for a real match — used directly now
 * (Phase 6), and reused as-is by Phase 7 whenever the AI wrapper is
 * unavailable or its output fails validation ("AI unavailable: run
 * deterministic matching ... and use templated copy," section 6).
 * Every sentence here is built from the item's own stored facts —
 * nothing is invented.
 */
export function explainMatch(
  candidate: ScoredCandidate,
  preferences: MatchPreferences,
): MatchExplanation {
  const { item } = candidate;
  const facts: string[] = [];

  if (preferences.light !== "unknown") {
    facts.push(`tolerates ${lightLevelLabels[preferences.light].toLowerCase()}`);
  }
  if (preferences.careTolerance !== "unknown") {
    facts.push(careDifficultyLabels[item.care_difficulty].toLowerCase());
  }
  if (preferences.watering !== "unknown" && item.watering) {
    facts.push(wateringLabels[item.watering].toLowerCase());
  }

  const factSentence =
    facts.length > 0
      ? `This piece ${facts.join(", ")}.`
      : `${item.plant_description} — ${formatPriceCents(item.price_cents)}.`;

  const headline = truncateToHeadline(`${item.display_name} could be a great fit.`, item.display_name);
  const reason = `${factSentence} It's available now for ${formatPriceCents(item.price_cents)}.`;
  const careNote =
    item.directional_placement ??
    `Care level: ${careDifficultyLabels[item.care_difficulty].toLowerCase()}.`;

  return { headline, reason, careNote, constraintNotes: [] };
}
