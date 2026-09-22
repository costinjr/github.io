import { formatPriceCents } from "@/lib/format";
import type { CandidateFacts } from "./provider";
import type { AiBlurbOutput } from "./schemas";

export interface BlurbValidationContext {
  selected: CandidateFacts;
  alternates: CandidateFacts[];
  /** Constraint notes Phase 6 already determined are required (e.g. a closest_safe light mismatch) — the AI's own notes must not silently drop these. */
  requiredConstraintNotes: string[];
}

export interface BlurbValidationResult {
  valid: boolean;
  reason?: string;
}

const CARE_WORDS: Record<string, string[]> = {
  easy: ["easy", "low maintenance", "low-maintenance", "forgiving"],
  moderate: ["moderate care", "some attention"],
  involved: ["involved", "high maintenance", "high-maintenance", "demanding", "fussy"],
};

const MAX_REASON_WORDS = 90;

/**
 * Section 6: "Server-side checks must reject IDs not in the candidate
 * set, unsupported care claims, wrong prices, and missing constraint
 * notes. On validation failure, use a deterministic explanation
 * template rather than exposing an AI error." This is that check —
 * every rejection here should fall back to templates.ts, never surface
 * the AI's raw output or a raw AI error to the visitor.
 */
export function validateBlurb(
  blurb: AiBlurbOutput,
  context: BlurbValidationContext,
): BlurbValidationResult {
  if (blurb.selectedInventoryId !== context.selected.id) {
    return { valid: false, reason: "selectedInventoryId does not match the provided candidate" };
  }

  const validAlternateIds = new Set(context.alternates.map((a) => a.id));
  for (const id of blurb.alternateInventoryIds) {
    if (!validAlternateIds.has(id)) {
      return { valid: false, reason: `alternate id ${id} was not in the candidate set` };
    }
  }

  if (blurb.headline.length > 70) {
    return { valid: false, reason: "headline exceeds 70 characters" };
  }

  const reasonWordCount = blurb.reason.trim().split(/\s+/).filter(Boolean).length;
  if (reasonWordCount > MAX_REASON_WORDS) {
    return { valid: false, reason: "reason exceeds 90 words" };
  }

  const priceCheck = checkPriceClaims(blurb.reason, context.selected.priceCents);
  if (!priceCheck.valid) return priceCheck;

  const careCheck = checkCareClaims(`${blurb.reason} ${blurb.careNote}`, context.selected.careDifficulty);
  if (!careCheck.valid) return careCheck;

  if (context.requiredConstraintNotes.length > 0 && blurb.constraintNotes.length === 0) {
    return { valid: false, reason: "dropped a required constraint note" };
  }

  return { valid: true };
}

function checkPriceClaims(text: string, actualPriceCents: number): BlurbValidationResult {
  const mentioned = text.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g);
  if (!mentioned) return { valid: true };

  const actual = formatPriceCents(actualPriceCents);
  const actualDollarsOnly = actual.replace(/\.00$/, "");

  for (const price of mentioned) {
    const normalized = price.replace(/\s/g, "");
    if (normalized !== actual && normalized !== actualDollarsOnly) {
      return { valid: false, reason: `mentions ${price}, but the actual price is ${actual}` };
    }
  }
  return { valid: true };
}

function checkCareClaims(text: string, actualCareDifficulty: string): BlurbValidationResult {
  const lower = text.toLowerCase();
  for (const [level, phrases] of Object.entries(CARE_WORDS)) {
    if (level === actualCareDifficulty) continue;
    for (const phrase of phrases) {
      if (lower.includes(phrase)) {
        return { valid: false, reason: `claims "${phrase}" but care_difficulty is ${actualCareDifficulty}` };
      }
    }
  }
  return { valid: true };
}
