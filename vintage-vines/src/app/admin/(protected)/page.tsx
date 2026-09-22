import Link from "next/link";
import type { Metadata } from "next";
import { getAllInventoryForAdmin } from "@/lib/admin-inventory";
import { env } from "@/lib/env";
import { coverPhotoUrl } from "@/lib/storage-url";
import { ItemsTable } from "./items-table";

export const metadata: Metadata = { title: "Inventory", robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const items = await getAllInventoryForAdmin();

  const rows = items.map((item) => ({
    id: item.id,
    displayName: item.display_name,
    plantDescription: item.plant_description,
    status: item.status,
    priceCents: item.price_cents,
    featured: item.featured,
    coverUrl: coverPhotoUrl(env.NEXT_PUBLIC_SUPABASE_URL, item.inventory_images),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-ink">Inventory</h1>
        <Link
          href="/admin/items/new"
          className="inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream"
        >
          Add a piece
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-ink-soft">
          Nothing yet. Drop in a photo to add the first piece.
        </p>
      ) : (
        <ItemsTable items={rows} />
      )}
    </div>
  );
}
