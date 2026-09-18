"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, getDemoPasscode, passcodeToken } from "@/lib/auth";

export type GateState = { error: string } | null;

export async function unlock(prevState: GateState, formData: FormData): Promise<GateState> {
  const candidate = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/");
  const expected = getDemoPasscode();

  if (!expected || candidate !== expected) {
    return { error: "Incorrect passcode." };
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, passcodeToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(next.startsWith("/") ? next : "/");
}
