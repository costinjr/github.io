import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

// Server-only: never import this from a Client Component. The API key is
// read from the environment and is never logged.
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}
