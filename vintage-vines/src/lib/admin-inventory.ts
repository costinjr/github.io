import "server-only";
import { createSessionClient } from "@/lib/supabase/session";
import type { InventoryImageRow, InventoryItemRow } from "@/types/database";

export interface AdminInventoryItem extends InventoryItemRow {
  inventory_images: InventoryImageRow[];
}

/** All items regardless of status, in manual sort order. Relies on the
 * admins_read_all_items RLS policy — returns nothing for a non-admin. */
export async function getAllInventoryForAdmin(): Promise<AdminInventoryItem[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*, inventory_images(*)")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as AdminInventoryItem[];
}

export async function getInventoryItemForAdmin(id: string): Promise<AdminInventoryItem | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*, inventory_images(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as AdminInventoryItem | null;
}
