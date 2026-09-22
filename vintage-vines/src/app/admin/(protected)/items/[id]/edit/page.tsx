import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInventoryItemForAdmin } from "@/lib/admin-inventory";
import { updateInventoryItem } from "@/lib/actions/admin-items";
import { env } from "@/lib/env";
import { photoUrl } from "@/lib/storage-url";
import { ItemForm } from "../../../item-form";

export const metadata: Metadata = { title: "Edit piece", robots: { index: false, follow: false } };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getInventoryItemForAdmin(id);
  if (!item) notFound();

  const existingPhotos = item.inventory_images
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      id: image.id,
      url: photoUrl(env.NEXT_PUBLIC_SUPABASE_URL, image),
      isCover: image.is_cover,
    }));

  return (
    <div>
      <h1 className="text-2xl text-ink">Edit {item.display_name}</h1>
      <p className="mt-1 text-sm text-ink-soft">Status: {item.status}</p>
      <div className="mt-6">
        <ItemForm action={updateInventoryItem} item={item} existingPhotos={existingPhotos} />
      </div>
    </div>
  );
}
