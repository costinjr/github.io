import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Section 9: "release expired holds." Meant to run on a schedule — see
 * src/app/api/cron/expire-holds/route.ts and HANDOFF.md for wiring up
 * the actual scheduler, which is a Vercel project setting, not
 * something this code can turn on by itself.
 */
export async function sweepExpiredHolds(): Promise<{ released: number }> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired, error: findError } = await supabase
    .from("claims")
    .select("id, inventory_item_id")
    .eq("status", "hold")
    .lt("hold_expires_at", now);

  if (findError) throw findError;
  if (!expired || expired.length === 0) return { released: 0 };

  const claimIds = expired.map((c) => c.id);
  const itemIds = expired.map((c) => c.inventory_item_id);

  const { error: claimsError } = await supabase.from("claims").update({ status: "expired" }).in("id", claimIds);
  if (claimsError) throw claimsError;

  // Only release items still in checkout_hold — one could have been
  // independently marked sold or archived by an admin in the meantime,
  // and this sweep has no business overwriting that.
  const { error: itemsError } = await supabase
    .from("inventory_items")
    .update({ status: "available" })
    .in("id", itemIds)
    .eq("status", "checkout_hold");
  if (itemsError) throw itemsError;

  return { released: expired.length };
}
