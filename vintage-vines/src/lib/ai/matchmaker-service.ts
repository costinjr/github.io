import "server-only";
import { getAvailableInventory, type InventoryItemWithImages } from "@/lib/inventory";
import { matchInventory } from "@/lib/matching/match";
import { explainMatch, explainNoCompatibleResult, NO_INVENTORY_MESSAGE } from "@/lib/matching/templates";
import type { InventoryItemRow } from "@/types/database";
import { getAiProvider } from "./anthropic-provider";
import { isUnderMonthlySpendCap, recordAiUsage } from "./cost-cap";
import { parsePreferencesDeterministically } from "./fallback-parser";
import type { CandidateFacts } from "./provider";
import { checkAndRecordRateLimit, hashClientKey } from "./rate-limit";
import { validateBlurb } from "./validate-blurb";
import { MAX_MATCHMAKER_TEXT_LENGTH } from "./limits";

export interface MatchmakerResult {
  headline: string;
  reason: string;
  careNote: string;
  constraintNotes: string[];
  selectedItem: InventoryItemWithImages;
  alternateItems: InventoryItemWithImages[];
  confidence: "strong" | "good" | "limited";
}

export type MatchmakerOutcome =
  | { kind: "matched"; result: MatchmakerResult }
  | { kind: "no_inventory"; message: string }
  | { kind: "no_compatible_result"; message: string }
  | { kind: "rate_limited" };

function toCandidateFacts(item: InventoryItemRow): CandidateFacts {
  return {
    id: item.id,
    displayName: item.display_name,
    plantDescription: item.plant_description,
    priceCents: item.price_cents,
    lightLevels: item.light_levels,
    careDifficulty: item.care_difficulty,
    petSafety: item.pet_safety,
    watering: item.watering,
    directionalPlacement: item.directional_placement,
  };
}

/**
 * Section 6's full pipeline, steps 1–7, with the privacy/cost controls
 * from the same section wrapped around it. This is the only entry
 * point the matchmaker UI should call — everything about whether AI
 * was available, valid, or affordable this month is handled here, not
 * by the caller.
 */
export async function runMatchmaker(
  rawVisitorText: string,
  clientIdentifier: string,
): Promise<MatchmakerOutcome> {
  const clientKey = hashClientKey(clientIdentifier);
  const { allowed } = await checkAndRecordRateLimit(clientKey, "matchmaker");
  if (!allowed) {
    return { kind: "rate_limited" };
  }

  const visitorText = rawVisitorText.slice(0, MAX_MATCHMAKER_TEXT_LENGTH);

  const items = await getAvailableInventory();
  if (items.length === 0) {
    // Section 6: "No inventory ... Do not call the AI."
    return { kind: "no_inventory", message: NO_INVENTORY_MESSAGE };
  }

  const preferences = await resolvePreferences(visitorText);
  const outcome = matchInventory(items, preferences);

  if (outcome.kind === "no_inventory") {
    return { kind: "no_inventory", message: NO_INVENTORY_MESSAGE };
  }
  if (outcome.kind === "no_compatible_result") {
    return { kind: "no_compatible_result", message: explainNoCompatibleResult(outcome.limitingReason) };
  }

  const explanation = await resolveExplanation(visitorText, outcome);

  return {
    kind: "matched",
    result: {
      headline: explanation.headline,
      reason: explanation.reason,
      careNote: explanation.careNote,
      constraintNotes: [...outcome.constraintNotes, ...explanation.constraintNotes],
      // matchInventory only ever narrows its own view of the type to
      // InventoryItemRow; the actual objects flowing through are
      // whatever getAvailableInventory produced (with images attached).
      selectedItem: outcome.selected.item as InventoryItemWithImages,
      alternateItems: outcome.alternates.map((a) => a.item as InventoryItemWithImages),
      confidence: outcome.confidence,
    },
  };
}

async function resolvePreferences(visitorText: string) {
  const provider = getAiProvider();
  if (!provider || !(await isUnderMonthlySpendCap())) {
    return parsePreferencesDeterministically(visitorText);
  }

  try {
    const { data, costCents } = await provider.parsePreferences(visitorText);
    await recordAiUsage("matchmaker", costCents);
    return data;
  } catch {
    // Invalid output, timeout, or provider error: section 6's AI
    // unavailable path — deterministic matching from explicit criteria.
    return parsePreferencesDeterministically(visitorText);
  }
}

async function resolveExplanation(
  visitorText: string,
  outcome: Extract<ReturnType<typeof matchInventory>, { kind: "matched" | "closest_safe" }>,
) {
  const provider = getAiProvider();
  const deterministicFallback = () => explainMatch(outcome.selected, parsePreferencesDeterministically(visitorText));

  if (!provider || !(await isUnderMonthlySpendCap())) {
    return deterministicFallback();
  }

  try {
    const { data, costCents } = await provider.writeBlurb({
      visitorText,
      selected: toCandidateFacts(outcome.selected.item),
      alternates: outcome.alternates.map((a) => toCandidateFacts(a.item)),
    });

    const validation = validateBlurb(data, {
      selected: toCandidateFacts(outcome.selected.item),
      alternates: outcome.alternates.map((a) => toCandidateFacts(a.item)),
      requiredConstraintNotes: outcome.constraintNotes,
    });

    if (!validation.valid) {
      return deterministicFallback();
    }

    await recordAiUsage("matchmaker", costCents);
    return {
      headline: data.headline,
      reason: data.reason,
      careNote: data.careNote,
      constraintNotes: data.constraintNotes,
    };
  } catch {
    return deterministicFallback();
  }
}
