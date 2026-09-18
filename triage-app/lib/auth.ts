import { createHash } from "node:crypto";

export const DEMO_SESSION_COOKIE = "triage_demo_session";

export function getDemoPasscode(): string | undefined {
  return process.env.DEMO_PASSCODE;
}

export function passcodeToken(passcode: string): string {
  return createHash("sha256").update(passcode).digest("hex");
}

export function isSessionValid(cookieValue: string | undefined): boolean {
  const expected = getDemoPasscode();
  if (!expected || !cookieValue) return false;
  return cookieValue === passcodeToken(expected);
}
