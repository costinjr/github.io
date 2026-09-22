import { randomUUID } from "crypto";

export const ORIGINALS_BUCKET = "inventory-originals";
export const PUBLIC_BUCKET = "inventory-public";

/**
 * Path convention assumed by the storage RLS policies in
 * supabase/migrations/0002_storage.sql: the item id is always the
 * second path segment (storage.foldername(name)[2]).
 */
export function buildImagePaths(inventoryItemId: string) {
  const imageId = randomUUID();
  return {
    imageId,
    originalKey: `inventory/${inventoryItemId}/${imageId}/original.jpg`,
    webpKey: `inventory/${inventoryItemId}/${imageId}/photo.webp`,
  };
}
