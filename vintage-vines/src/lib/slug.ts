export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildItemSlugBase(displayName: string, plantDescription: string): string {
  const base = slugify(`${displayName}-${plantDescription}`);
  return base || "piece";
}
