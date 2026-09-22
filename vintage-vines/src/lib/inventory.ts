import "server-only";
import { createPublicClient } from "@/lib/supabase/server";
import type { InventoryImageRow, InventoryItemRow } from "@/types/database";

export interface InventoryItemWithImages extends InventoryItemRow {
  inventory_images: InventoryImageRow[];
}

/**
 * All currently available items, in Libby's manual sort order. RLS
 * (public_read_available_items) is the actual enforcement; the status
 * filter here just keeps the query intent explicit.
 */
export async function getAvailableInventory(): Promise<InventoryItemWithImages[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*, inventory_images(*)")
    .eq("status", "available")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as InventoryItemWithImages[];
}

/**
 * Up to `limit` available items in manual sort order, for the landing
 * page's "Available now" section (section 5 — not filtered by the
 * `featured` flag, which is a matchmaker scoring boost, section 6).
 */
export async function getLandingInventory(limit = 6): Promise<InventoryItemWithImages[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*, inventory_images(*)")
    .eq("status", "available")
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as InventoryItemWithImages[];
}

/** A single available item for its detail page, or null if not found/not available. */
export async function getInventoryItemBySlug(
  slug: string,
): Promise<InventoryItemWithImages | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*, inventory_images(*)")
    .eq("slug", slug)
    .eq("status", "available")
    .maybeSingle();

  if (error) throw error;
  return data as InventoryItemWithImages | null;
}
