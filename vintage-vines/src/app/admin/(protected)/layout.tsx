import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOutAdmin } from "@/lib/actions/admin-auth";

// Authenticated, per-user content — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">Admin</p>
          <Link href="/admin" className="text-2xl text-ink">
            Vintage Vines
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-soft">
          <span>{session.email}</span>
          <form action={signOutAdmin}>
            <button type="submit" className="min-h-11 rounded-sm border border-line px-3">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
