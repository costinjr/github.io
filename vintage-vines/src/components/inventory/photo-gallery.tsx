"use client";

import Image from "next/image";
import { useState } from "react";

export function PhotoGallery({
  photos,
  alt,
}: {
  photos: { url: string; altText: string | null }[];
  alt: string;
}) {
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-sm bg-cream-deep text-ink-soft">
        Photo coming soon
      </div>
    );
  }

  const active = photos[selected];

  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-sm bg-cream-deep">
        <Image
          src={active.url}
          alt={active.altText ?? alt}
          width={800}
          height={800}
          priority
          className="h-full w-full object-cover"
        />
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === selected}
              className={`h-16 w-16 overflow-hidden rounded-sm border-2 ${
                index === selected ? "border-green" : "border-transparent"
              }`}
            >
              <Image
                src={photo.url}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
