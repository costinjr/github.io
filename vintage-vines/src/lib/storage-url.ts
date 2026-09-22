import { PUBLIC_BUCKET } from "@/lib/storage-paths";
import type { InventoryImageRow } from "@/types/database";

export function photoUrl(supabaseUrl: string | undefined, image: InventoryImageRow): string | null {
  if (!supabaseUrl) return null;
  const webpKey = (image.derivative_keys as { webp?: string } | null)?.webp;
  if (!webpKey) return null;
  return `${supabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${webpKey}`;
}

export function coverPhotoUrl(
  supabaseUrl: string | undefined,
  images: InventoryImageRow[],
): string | null {
  if (!supabaseUrl) return null;
  const cover = images.find((image) => image.is_cover) ?? images[0];
  const webpKey = (cover?.derivative_keys as { webp?: string } | null)?.webp;
  if (!webpKey) return null;
  return `${supabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${webpKey}`;
}
