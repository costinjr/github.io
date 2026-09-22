import { CONFIDENCE_THRESHOLDS, MIN_SPECIFIED_PREFERENCES_FOR_CONFIDENCE } from "./config";
import type { MatchConfidence, MatchPreferences, ScoreBreakdown } from "./types";

function countSpecifiedPreferences(preferences: MatchPreferences): number {
  let count = 0;
  if (preferences.light !== "unknown") count += 1;
  if (preferences.careTolerance !== "unknown") count += 1;
  if (preferences.watering !== "unknown") count += 1;
  if (preferences.size !== "unknown") count += 1;
  if (preferences.vesselStyle !== "unknown") count += 1;
  if (preferences.petSafetyRequired !== "unknown") count += 1;
  if (preferences.budgetMax !== null) count += 1;
  return count;
}

/**
 * "Return a match confidence of strong, good, or limited based on
 * satisfied constraints, not an invented percentage" (section 6). The
 * ratio is achieved-vs-possible score among dimensions the visitor
 * actually specified — "unknown" dimensions neither help nor hurt it.
 * A near-perfect ratio from barely anything specified is still
 * "limited": matching 100% of one stated preference isn't a strong
 * match, it's a coin flip that happened to land right.
 */
export function computeConfidence(
  breakdown: ScoreBreakdown,
  preferences: MatchPreferences,
): MatchConfidence {
  if (countSpecifiedPreferences(preferences) < MIN_SPECIFIED_PREFERENCES_FOR_CONFIDENCE) {
    return "limited";
  }

  const ratio = breakdown.possibleMax === 0 ? 0 : breakdown.total / breakdown.possibleMax;

  if (ratio >= CONFIDENCE_THRESHOLDS.strong) return "strong";
  if (ratio >= CONFIDENCE_THRESHOLDS.good) return "good";
  return "limited";
}
