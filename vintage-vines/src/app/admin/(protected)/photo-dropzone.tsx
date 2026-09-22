"use client";

import { useRef, useState } from "react";
import { rotateImageFile } from "@/lib/rotate-image";

interface StagedPhoto {
  id: string;
  file: File;
  url: string;
}

function isJpegFile(file: File) {
  return file.type === "image/jpeg" || file.type === "image/jpg";
}

export function PhotoDropzone({ maxPhotos }: { maxPhotos: number }) {
  const [staged, setStaged] = useState<StagedPhoto[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function syncHiddenInput(next: StagedPhoto[]) {
    const dataTransfer = new DataTransfer();
    for (const photo of next) dataTransfer.items.add(photo.file);
    if (inputRef.current) inputRef.current.files = dataTransfer.files;
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const additions = Array.from(fileList)
      .filter(isJpegFile)
      .map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));

    const next = [...staged, ...additions].slice(0, maxPhotos);
    setStaged(next);
    syncHiddenInput(next);
    if (!coverId && next.length > 0) setCoverId(next[0].id);
  }

  function removePhoto(id: string) {
    const next = staged.filter((photo) => photo.id !== id);
    setStaged(next);
    syncHiddenInput(next);
    if (coverId === id) setCoverId(next[0]?.id ?? null);
  }

  function move(id: string, direction: "left" | "right") {
    const index = staged.findIndex((photo) => photo.id === id);
    const swapWith = direction === "left" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= staged.length) return;
    const next = [...staged];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setStaged(next);
    syncHiddenInput(next);
  }

  async function rotate(id: string) {
    const target = staged.find((photo) => photo.id === id);
    if (!target) return;
    const rotated = await rotateImageFile(target.file);
    const next = staged.map((photo) =>
      photo.id === id ? { ...photo, file: rotated, url: URL.createObjectURL(rotated) } : photo,
    );
    setStaged(next);
    syncHiddenInput(next);
  }

  const coverIndex = staged.findIndex((photo) => photo.id === coverId);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="photos"
        accept="image/jpeg"
        multiple
        hidden
        onChange={(event) => addFiles(event.target.files)}
      />
      <input type="hidden" name="cover_index" value={coverIndex} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={staged.length >= maxPhotos}
        className="min-h-11 rounded-sm border border-line px-4 text-sm text-ink disabled:opacity-50"
      >
        Add JPEG photos
      </button>
      <p className="mt-1 text-xs text-ink-soft">Up to {maxPhotos} photos, JPEG only.</p>

      {staged.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {staged.map((photo, index) => (
            <li key={photo.id} className="w-32 rounded-sm border border-line bg-paper p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a servable asset */}
              <img
                src={photo.url}
                alt={`Staged photo ${index + 1}`}
                className="h-28 w-full rounded-sm object-cover"
              />
              <label className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                <input
                  type="radio"
                  name="cover_choice"
                  checked={coverId === photo.id}
                  onChange={() => setCoverId(photo.id)}
                />
                Cover
              </label>
              <div className="mt-1 flex flex-wrap gap-1 text-xs">
                <button type="button" onClick={() => move(photo.id, "left")} disabled={index === 0}>
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(photo.id, "right")}
                  disabled={index === staged.length - 1}
                >
                  →
                </button>
                <button type="button" onClick={() => rotate(photo.id)}>
                  Rotate
                </button>
                <button type="button" onClick={() => removePhoto(photo.id)} className="text-terracotta">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
