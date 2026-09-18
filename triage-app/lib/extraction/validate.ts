import { EVIDENCE_BACKED_FIELDS } from "./schema";
import type { ExtractionResult } from "./schema";

export type SemanticValidationResult = { ok: true } | { ok: false; reason: string };

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isVerbatimQuote(rawText: string, quote: string): boolean {
  return normalizeWhitespace(rawText).includes(normalizeWhitespace(quote));
}

// Enforces the extraction contract's evidence requirement: every non-null
// conclusion needs a matching, verifiably-verbatim quote from the source
// text. This is the check "invalid structure" retries and "Needs review"
// are for — a schema-valid response can still fail this.
export function validateExtractionEvidence(rawText: string, result: ExtractionResult): SemanticValidationResult {
  for (const quote of result.evidence_quotes) {
    if (!isVerbatimQuote(rawText, quote.quote)) {
      return { ok: false, reason: `Evidence quote for "${quote.field}" does not appear verbatim in the referral text.` };
    }
  }

  for (const field of EVIDENCE_BACKED_FIELDS) {
    if (result[field] === null) continue;
    const hasEvidence = result.evidence_quotes.some((quote) => quote.field === field);
    if (!hasEvidence) {
      return { ok: false, reason: `"${field}" was set to a value but has no supporting evidence quote.` };
    }
  }

  for (const clue of [...result.urgency_clues, ...result.contradictions]) {
    if (!isVerbatimQuote(rawText, clue)) {
      return { ok: false, reason: `"${clue}" does not appear verbatim in the referral text.` };
    }
  }

  return { ok: true };
}
