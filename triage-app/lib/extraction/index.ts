import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../anthropic-client";
import { TRIAGE_PROMPT, TRIAGE_PROMPT_VERSION } from "./prompt";
import { ExtractionResultSchema } from "./schema";
import type { ExtractionResult } from "./schema";
import { validateExtractionEvidence } from "./validate";

export const TRIAGE_MODEL = "claude-opus-5";

export interface ModelCaller {
  extract(rawText: string): Promise<ExtractionResult | null>;
}

// The real model call, isolated behind ModelCaller so tests can mock it
// (per the build spec: "Mock the model in tests") without hitting the
// network or spending real tokens.
export class AnthropicModelCaller implements ModelCaller {
  async extract(rawText: string): Promise<ExtractionResult | null> {
    const response = await getAnthropicClient().messages.parse({
      model: TRIAGE_MODEL,
      max_tokens: 16000,
      system: TRIAGE_PROMPT,
      messages: [{ role: "user", content: rawText }],
      output_config: { format: zodOutputFormat(ExtractionResultSchema) },
    });
    return response.parsed_output;
  }
}

export type ExtractionOutcome =
  | { status: "ok"; result: ExtractionResult; model: string; promptVersion: string }
  | { status: "needs_review"; reason: string };

const MAX_ATTEMPTS = 2;

// Never logs rawText, the extraction result, or any API credential — both
// can contain synthetic patient details or evidence quotes drawn from the
// intake text.
export async function runExtraction(
  rawText: string,
  caller: ModelCaller = new AnthropicModelCaller(),
): Promise<ExtractionOutcome> {
  let lastReason = "The model did not return a valid, schema-conforming extraction.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const parsed = await caller.extract(rawText);
    if (!parsed) {
      continue;
    }

    const semanticCheck = validateExtractionEvidence(rawText, parsed);
    if (semanticCheck.ok) {
      return { status: "ok", result: parsed, model: TRIAGE_MODEL, promptVersion: TRIAGE_PROMPT_VERSION };
    }
    lastReason = semanticCheck.reason;
  }

  return { status: "needs_review", reason: lastReason };
}
