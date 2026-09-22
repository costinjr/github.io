import type { InventoryItemRow } from "@/types/database";

// Section 6's preference-object table, field for field. This type is
// parser-independent (Phase 6's own build-order label): nothing in this
// file knows or cares whether the object came from an AI parser
// (Phase 7), an explicit filter form, or a test fixture.

export type LightPreference = "low" | "medium" | "high" | "unknown";
export type CareTolerance = "easy" | "moderate" | "involved" | "unknown";

// Spec's preference vocabulary says "small, medium, large" — our
// inventory_items.size_class enum (established in Phase 1/2, matching
// the $10/$20/$40 pricing tier names) says "small, standard, large".
// mapSizePreferenceToSizeClass() below is the single place that
// reconciles the two; nothing else in this module should compare them
// directly.
export type SizePreference = "small" | "medium" | "large" | "unknown";
export type WateringPreference = "infrequent" | "regular" | "frequent" | "unknown";
export type Occasion =
  | "self"
  | "closing_gift"
  | "birthday"
  | "sympathy"
  | "host"
  | "office"
  | "other"
  | "unknown";
export type VesselStylePreference =
  | "brass"
  | "ceramic"
  | "stoneware"
  | "cottage"
  | "minimal"
  | "colorful"
  | "neutral"
  | "other"
  | "unknown";

export interface MatchPreferences {
  light: LightPreference;
  /** Hard filter when true. "unknown" and false are both non-blocking. */
  petSafetyRequired: boolean | "unknown";
  careTolerance: CareTolerance;
  size: SizePreference;
  watering: WateringPreference;
  /** Copy and tie-breaker per section 6 — see score.ts for how this is reconciled with its own 10-point line in the scoring table. */
  occasion: Occasion;
  vesselStyle: VesselStylePreference;
  /** Cents, to match price_cents. null when no budget was stated. */
  budgetMax: number | null;
  /** Explanation/tie-breaking only — never a scoring or filter input. */
  keywords: string[];
}

export type MatchConfidence = "strong" | "good" | "limited";

export interface ScoreBreakdown {
  light: number;
  careAndWatering: number;
  size: number;
  vesselStyle: number;
  occasion: number;
  featured: number;
  total: number;
  /** Sum of the weights that were actually in play (see confidence.ts) — excludes dimensions whose preference was "unknown". */
  possibleMax: number;
}

export interface ScoredCandidate {
  item: InventoryItemRow;
  breakdown: ScoreBreakdown;
}

export type MatchOutcome =
  | { kind: "no_inventory" }
  | { kind: "no_compatible_result"; limitingReason: string }
  | {
      kind: "matched" | "closest_safe";
      selected: ScoredCandidate;
      alternates: ScoredCandidate[];
      confidence: MatchConfidence;
      /** Explicit, named caveats — e.g. a light mismatch on a closest_safe result. Never silent about a compromise. */
      constraintNotes: string[];
    };
