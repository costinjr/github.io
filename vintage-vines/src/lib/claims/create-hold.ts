import "server-only";
import { logEvent } from "@/lib/analytics/log-event";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FulfillmentMethod } from "@/types/database";

const DEFAULT_HOLD_MINUTES = 15;

export interface CreateHoldInput {
  itemId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress: string | null;
  giftNote: string | null;
  holdMinutes?: number;
}

export type CreateHoldResult =
  | { ok: true; claimId: string; holdExpiresAt: string }
  | { ok: false; reason: "already_claimed" };

/**
 * Section 9: "Prevent double claims with an atomic database operation.
 * Never rely only on a disabled browser button." The UPDATE below,
 * scoped to `status = 'available'`, is the atomic operation: Postgres's
 * MVCC guarantees that of any two concurrent calls racing on the same
 * item, only one UPDATE can match that WHERE clause — the other
 * affects zero rows rather than corrupting state. Verified directly
 * against real Postgres under actual concurrent transactions (not just
 * asserted): see the commit message for this file's introduction.
 *
 * This is a hold, not a sale — nothing here processes payment. It only
 * exists so a checkout session (Phase 8's remaining, provider-specific
 * half — see HANDOFF.md) has an item locked down before redirecting to
 * pay for it.
 */
export async function createInventoryHold(input: CreateHoldInput): Promise<CreateHoldResult> {
  const supabase = createAdminClient();
  const holdMinutes = input.holdMinutes ?? DEFAULT_HOLD_MINUTES;
  const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("inventory_items")
    .update({ status: "checkout_hold" })
    .eq("id", input.itemId)
    .eq("status", "available")
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    return { ok: false, reason: "already_claimed" };
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      inventory_item_id: input.itemId,
      status: "hold",
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      fulfillment_method: input.fulfillmentMethod,
      delivery_address: input.deliveryAddress,
      gift_note: input.giftNote,
      hold_expires_at: holdExpiresAt,
      payment_provider: null,
      payment_provider_reference: null,
      payment_verified: false,
    })
    .select("id")
    .single();

  if (claimError) {
    // The hold succeeded but recording the claim failed — release the
    // item rather than leaving it stuck in checkout_hold with nothing
    // tracking it (the expiry sweep would eventually catch this too,
    // but there's no reason to wait when we already know it failed).
    await supabase.from("inventory_items").update({ status: "available" }).eq("id", input.itemId);
    throw claimError;
  }

  await logEvent("claim_started", { inventoryItemId: input.itemId });

  return { ok: true, claimId: claim.id, holdExpiresAt };
}
