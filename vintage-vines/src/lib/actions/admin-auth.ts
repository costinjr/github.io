"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/session";
import { env } from "@/lib/env";

export interface MagicLinkState {
  sent?: boolean;
  error?: string;
}

const emailSchema = z.email();

/**
 * Always reports success, whether or not the email is a real admin
 * account (shouldCreateUser: false blocks self-registration, per
 * section 10's "no public sign-up" — but the response message must not
 * leak which emails exist, so we never say "not found").
 */
export async function requestAdminMagicLink(
  _prevState: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  try {
    const supabase = await createSessionClient();
    await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/admin/auth/callback`,
      },
    });
  } catch {
    // Fall through to the same generic message below.
  }

  return { sent: true };
}

export async function signOutAdmin() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
