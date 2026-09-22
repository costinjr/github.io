/**
 * Section 6: "set model timeouts." Applied here to any external call in
 * the matchmaker path, not just the AI provider itself — an unbounded
 * call to Supabase (or anything else) is exactly as capable of hanging
 * the whole request as an unbounded AI call is.
 */
// Accepts PromiseLike, not just Promise — Supabase's query builders are
// thenables (awaitable) but aren't strict Promise instances.
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}
