"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteImage, reorderImages, setCoverImage } from "@/lib/actions/admin-items";

interface ExistingPhoto {
  id: string;
  url: string | null;
  isCover: boolean;
}

export function ExistingPhotos({ itemId, photos }: { itemId: string; photos: ExistingPhoto[] }) {
  const [order, setOrder] = useState(photos);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(() => router.refresh());
  }

  function move(id: string, direction: "left" | "right") {
    const index = order.findIndex((photo) => photo.id === id);
    const swapWith = direction === "left" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= order.length) return;
    const next = [...order];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setOrder(next);
    startTransition(async () => {
      await reorderImages(itemId, next.map((photo) => photo.id));
      router.refresh();
    });
  }

  if (order.length === 0) {
    return <p className="text-sm text-ink-soft">No photos yet.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {order.map((photo, index) => (
        <li key={photo.id} className="w-32 rounded-sm border border-line bg-paper p-2">
          <div className="h-28 w-full overflow-hidden rounded-sm bg-cream-deep">
            {photo.url && (
              <Image src={photo.url} alt="" width={128} height={112} className="h-full w-full object-cover" />
            )}
          </div>
          <label className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
            <input
              type="radio"
              name="existing_cover"
              checked={photo.isCover}
              onChange={() =>
                startTransition(async () => {
                  await setCoverImage(photo.id, itemId);
                  router.refresh();
                })
              }
            />
            Cover
          </label>
          <div className="mt-1 flex flex-wrap gap-1 text-xs">
            <button type="button" onClick={() => move(photo.id, "left")} disabled={index === 0}>
              ←
            </button>
            <button type="button" onClick={() => move(photo.id, "right")} disabled={index === order.length - 1}>
              →
            </button>
            <button
              type="button"
              className="text-terracotta"
              onClick={() =>
                startTransition(async () => {
                  await deleteImage(photo.id, itemId);
                  refresh();
                })
              }
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
