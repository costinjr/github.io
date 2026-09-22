import type { Metadata } from "next";
import { createInventoryItem } from "@/lib/actions/admin-items";
import { ItemForm } from "../../item-form";

export const metadata: Metadata = { title: "Add a piece", robots: { index: false, follow: false } };

export default function NewItemPage() {
  return (
    <div>
      <h1 className="text-2xl text-ink">Add a piece</h1>
      <div className="mt-6">
        <ItemForm action={createInventoryItem} />
      </div>
    </div>
  );
}
