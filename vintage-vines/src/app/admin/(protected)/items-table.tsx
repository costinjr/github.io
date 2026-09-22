"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveItems,
  duplicateItem,
  moveItem,
  reorderItems,
  setItemPrice,
  setItemStatus,
} from "@/lib/actions/admin-items";
import type { InventoryStatus } from "@/types/database";

interface Row {
  id: string;
  displayName: string;
  plantDescription: string;
  status: InventoryStatus;
  priceCents: number;
  featured: boolean;
  coverUrl: string | null;
}

const statusOptions: InventoryStatus[] = ["draft", "available", "checkout_hold", "sold", "archived"];

export function ItemsTable({ items }: { items: Row[] }) {
  const [order, setOrder] = useState(items);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(() => router.refresh());
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const fromIndex = order.findIndex((row) => row.id === dragId);
    const toIndex = order.findIndex((row) => row.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    setDragId(null);
    await reorderItems(next.map((row) => row.id));
    refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    await moveItem(id, direction);
    refresh();
  }

  return (
    <div className="mt-6">
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-sm border border-line bg-paper px-3 py-2 text-sm">
          <span>{selected.size} selected</span>
          <button
            type="button"
            className="rounded-sm border border-terracotta px-3 py-1 text-terracotta"
            onClick={() =>
              startTransition(async () => {
                await archiveItems([...selected]);
                setSelected(new Set());
                router.refresh();
              })
            }
          >
            Archive selected
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2" aria-label="Inventory items, in display order">
        {order.map((row, index) => (
          <li
            key={row.id}
            draggable
            onDragStart={() => setDragId(row.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(row.id)}
            className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-paper p-3"
          >
            <input
              type="checkbox"
              aria-label={`Select ${row.displayName}`}
              checked={selected.has(row.id)}
              onChange={() => toggleSelected(row.id)}
              className="h-5 w-5"
            />

            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-cream-deep">
              {row.coverUrl ? (
                <Image src={row.coverUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-ink-soft">No photo</span>
              )}
            </div>

            <div className="min-w-40 flex-1">
              <p className="font-serif text-lg text-ink">{row.displayName}</p>
              <p className="text-sm text-ink-soft">{row.plantDescription}</p>
              {row.featured && <span className="text-xs text-brass">Featured</span>}
            </div>

            <label className="flex flex-col text-xs text-ink-soft">
              Status
              <select
                defaultValue={row.status}
                disabled={pending}
                onChange={(event) => {
                  const nextStatus = event.target.value as InventoryStatus;
                  startTransition(async () => {
                    try {
                      await setItemStatus(row.id, nextStatus);
                      router.refresh();
                    } catch {
                      alert(
                        "Couldn't change status — this piece is missing a field required to go live (plant name, vessel name, vessel material, directional placement, or watering). Edit it first.",
                      );
                      router.refresh();
                    }
                  });
                }}
                className="min-h-11 rounded-sm border border-line bg-cream px-2 text-sm text-ink"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <form
              className="flex flex-col text-xs text-ink-soft"
              action={(formData) =>
                startTransition(async () => {
                  await setItemPrice(row.id, Number(formData.get("price_cents")));
                  router.refresh();
                })
              }
            >
              Price (cents)
              <div className="flex gap-1">
                <input
                  name="price_cents"
                  type="number"
                  min={1}
                  defaultValue={row.priceCents}
                  className="min-h-11 w-24 rounded-sm border border-line bg-cream px-2 text-sm text-ink"
                />
                <button type="submit" className="min-h-11 rounded-sm border border-line px-2 text-ink">
                  Save
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                aria-label={`Move ${row.displayName} up`}
                disabled={index === 0}
                onClick={() => handleMove(row.id, "up")}
                className="min-h-9 min-w-9 rounded-sm border border-line disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${row.displayName} down`}
                disabled={index === order.length - 1}
                onClick={() => handleMove(row.id, "down")}
                className="min-h-9 min-w-9 rounded-sm border border-line disabled:opacity-40"
              >
                ↓
              </button>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <Link href={`/admin/items/${row.id}/edit`} className="text-green underline">
                Edit
              </Link>
              <button
                type="button"
                className="text-left text-ink-soft underline"
                onClick={() =>
                  startTransition(async () => {
                    await duplicateItem(row.id);
                    router.refresh();
                  })
                }
              >
                Duplicate
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
