/**
 * Section 12: "Observability: server errors, AI validation failures,
 * upload failures, and claim conflicts. Never log secrets or full
 * free-text matchmaker submissions."
 *
 * No error-monitoring account (Sentry or similar) is connected — see
 * HANDOFF.md. This exists so wiring one up later is a one-line change
 * here instead of touching every call site: today it's console.error,
 * tomorrow it can also forward to a real provider's SDK.
 */
export function logError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  console.error(`[error] ${context}:`, error, extra ?? "");
}
