import type { Metadata } from "next";
import { getAvailableInventory } from "@/lib/inventory";
import { EmptyInventoryState } from "@/components/inventory/empty-inventory-state";
import { InventoryGrid } from "@/components/inventory/inventory-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory",
  description: "The current Vintage Vines collection — locally propagated houseplants in thrifted vintage vessels.",
};

export default async function InventoryPage() {
  const items = await getAvailableInventory();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">Inventory</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">The current collection</h1>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">
          One-of-one plants in thrifted vintage vessels. What you see is what&apos;s here — no
          two alike, and none restocked.
        </p>
      </div>

      <div className="mt-10">
        {items.length === 0 ? <EmptyInventoryState /> : <InventoryGrid items={items} showFilters={false} />}
      </div>
    </div>
  );
}
