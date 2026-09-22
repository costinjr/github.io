import type { Metadata } from "next";
import { getAvailableInventory } from "@/lib/inventory";
import { EmptyInventoryState } from "@/components/inventory/empty-inventory-state";
import { InventoryGrid } from "@/components/inventory/inventory-grid";

// Live availability, not a stale build: section 16 requires sold pieces
// to disappear promptly, not whenever the next deploy happens to run.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse and claim exact available one-of-one pieces from Vintage Vines.",
};

export default async function PurchasePage() {
  const items = await getAvailableInventory();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">Shop</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Claim this exact piece</h1>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">
          Every photo is the exact plant and vessel you&apos;ll take home — never a
          representative stock photo.
        </p>
      </div>

      <div className="mt-10">
        {items.length === 0 ? <EmptyInventoryState /> : <InventoryGrid items={items} />}
      </div>
    </div>
  );
}
