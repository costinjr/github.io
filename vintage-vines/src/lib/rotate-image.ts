// Browser-only. Rotates a JPEG file 90 degrees clockwise using canvas, so
// the admin's "rotate" control produces a genuinely re-oriented file
// before it's ever uploaded.
export async function rotateImageFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.height;
  canvas.height = bitmap.width;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) return file;

  return new File([blob], file.name, { type: "image/jpeg" });
}
