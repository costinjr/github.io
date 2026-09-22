import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth cookie on every proxied request and reports
 * whether a user is currently signed in. This only decides whether to
 * redirect toward /admin/login (an optimistic check, per Next's proxy
 * guidance) — the real authorization check lives in the DAL
 * (src/lib/auth.ts) and RLS, both of which re-verify on the server.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response, user: null };
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, user };
  } catch (error) {
    // Every request in the app passes through this, not just /admin —
    // an Auth outage here must not take down the whole site. Treat it
    // as signed out; requireAdmin() will send a real admin to sign in
    // again, which is a much smaller problem than every route 500ing.
    console.error("[proxy] session check failed, treating as signed out:", error);
    return { response, user: null };
  }
}
