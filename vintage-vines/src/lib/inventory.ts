import "server-only";
import { createPublicClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import type { InventoryImageRow, InventoryItemRow } from "@/types/database";

export interface InventoryItemWithImages extends InventoryItemRow {
  inventory_images: InventoryImageRow[];
}

/**
 * A visitor can only ever see the piece grid or an empty state — never a
 * stack trace (section 9: "Empty can still feel alive"). A misconfigured
 * or unreachable Supabase project degrades to the same empty state a
 * genuinely empty catalog shows; the real error still goes to the server
 * log for anyone watching it.
 */
function logInventoryError(context: string, error: unknown) {
  logError(`inventory ${context} failed, falling back to empty`, error);
}

/**
 * All currently available items, in Libby's manual sort order. RLS
 * (public_read_available_items) is the actual enforcement; the status
 * filter here just keeps the query intent explicit.
 */
export async function getAvailableInventory(): Promise<InventoryItemWithImages[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*, inventory_images(*)")
      .eq("status", "available")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as InventoryItemWithImages[];
  } catch (error) {
    logInventoryError("getAvailableInventory", error);
    return [];
  }
}

/**
 * Up to `limit` available items in manual sort order, for the landing
 * page's "Available now" section (section 5 — not filtered by the
 * `featured` flag, which is a matchmaker scoring boost, section 6).
 */
export async function getLandingInventory(limit = 6): Promise<InventoryItemWithImages[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*, inventory_images(*)")
      .eq("status", "available")
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as InventoryItemWithImages[];
  } catch (error) {
    logInventoryError("getLandingInventory", error);
    return [];
  }
}

/** A single available item for its detail page, or null if not found/not available/unreachable. */
export async function getInventoryItemBySlug(
  slug: string,
): Promise<InventoryItemWithImages | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*, inventory_images(*)")
      .eq("slug", slug)
      .eq("status", "available")
      .maybeSingle();

    if (error) throw error;
    return data as InventoryItemWithImages | null;
  } catch (error) {
    logInventoryError(`getInventoryItemBySlug(${slug})`, error);
    return null;
  }
}
