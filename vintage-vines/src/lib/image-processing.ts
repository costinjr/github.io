import "server-only";
import sharp from "sharp";

export interface ProcessedImage {
  original: Buffer;
  webp: Buffer;
  width: number;
  height: number;
}

/**
 * Re-encodes an uploaded JPEG. Not calling withMetadata() means sharp
 * drops EXIF/IPTC/XMP (including GPS) from every output by default —
 * that's the metadata-stripping step from section 10, not an
 * afterthought bolted on.
 */
export async function processInventoryPhoto(
  input: Buffer,
  manualRotationDegrees: 0 | 90 | 180 | 270 = 0,
): Promise<ProcessedImage> {
  // .rotate() with no args auto-orients from the EXIF tag before that
  // tag gets stripped; the manual rotate (admin's "rotate" control) is
  // applied on top of that, not instead of it.
  let image = sharp(input, { failOn: "none" }).rotate();
  if (manualRotationDegrees) {
    image = image.rotate(manualRotationDegrees);
  }

  const original = await image.clone().jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  const webp = await image.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();

  // Read dimensions back from the finished buffer, not the pipeline:
  // sharp's metadata() on a queued .rotate() reports pre-rotation
  // width/height, which is swapped for any portrait EXIF orientation.
  const finalMetadata = await sharp(original).metadata();

  return {
    original,
    webp,
    width: finalMetadata.width ?? 0,
    height: finalMetadata.height ?? 0,
  };
}

export function isJpeg(file: File): boolean {
  return file.type === "image/jpeg" || file.type === "image/jpg";
}
