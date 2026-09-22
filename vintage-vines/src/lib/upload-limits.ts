// Technical safety ceiling, not the business answer — section 18 leaves
// "maximum upload size and desired number of photos per piece" PENDING.
// Tighten these once Libby decides; business.uploads documents the
// pending fields. Kept dependency-free so client components can import
// it without pulling in server-only image-processing code (e.g. sharp).
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_PHOTOS_PER_ITEM = 12;
