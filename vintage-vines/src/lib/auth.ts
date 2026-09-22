import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/session";

export interface AdminSession {
  userId: string;
  email: string;
}

/**
 * Returns the current admin session, or null if the visitor isn't signed
 * in or isn't an approved admin. The admin_users RLS policy
 * (admins_read_admin_users) already only returns a row when
 * is_approved_admin() is true for the caller's own JWT, so a non-empty
 * result here *is* the authorization check, not just an identity check.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return null;

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("email")
      .maybeSingle();

    if (!adminRow) return null;

    return { userId: user.id, email: user.email };
  } catch {
    // Supabase not configured, or the auth server is unreachable: treat
    // as signed out rather than crashing the admin area.
    return null;
  }
});

/** Call at the top of every protected admin page, layout, and Server Action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
