// Approximate per-token pricing for cost-cap accounting (section 6:
// "Enforce a hard monthly AI API spend cap"). These are cents per
// million tokens — update to match current Anthropic pricing at
// anthropic.com/pricing before relying on the cap in production; being
// stale makes the cap loose, not wrong in the dangerous direction, but
// it should still be kept current.
export const INPUT_COST_CENTS_PER_MILLION_TOKENS = 80; // Haiku-class input pricing
export const OUTPUT_COST_CENTS_PER_MILLION_TOKENS = 400; // Haiku-class output pricing

export function estimateCostCents(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_CENTS_PER_MILLION_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_CENTS_PER_MILLION_TOKENS;
  return Math.ceil(inputCost + outputCost);
}
