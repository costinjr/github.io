"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/session";
import { isJpeg, processInventoryPhoto } from "@/lib/image-processing";
import { MAX_PHOTOS_PER_ITEM, MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { ORIGINALS_BUCKET, PUBLIC_BUCKET, buildImagePaths } from "@/lib/storage-paths";
import { buildItemSlugBase, slugify } from "@/lib/slug";
import {
  draftItemSchema,
  optionalItemFieldsSchema,
  publishExtraSchema,
} from "@/lib/validation/inventory";
import type { InventoryStatus, VesselMaterial, Watering } from "@/types/database";

export interface ItemFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseLightLevels(formData: FormData): string[] {
  return formData.getAll("light_levels").map(String);
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = value?.toString().trim();
  return text ? text : null;
}

function parseVesselStyleTags(formData: FormData): string[] {
  const raw = String(formData.get("vessel_style_tags") ?? "");
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function processAndStoreImages(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  itemId: string,
  files: File[],
  coverIndex: number,
  altTextSeed: string,
) {
  for (const [index, file] of files.entries()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processInventoryPhoto(buffer);
    const { imageId, originalKey, webpKey } = buildImagePaths(itemId);

    const { error: originalUploadError } = await supabase.storage
      .from(ORIGINALS_BUCKET)
      .upload(originalKey, processed.original, { contentType: "image/jpeg" });
    if (originalUploadError) throw originalUploadError;

    const { error: webpUploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(webpKey, processed.webp, { contentType: "image/webp" });
    if (webpUploadError) throw webpUploadError;

    const { error: imageRowError } = await supabase.from("inventory_images").insert({
      id: imageId,
      inventory_item_id: itemId,
      storage_key: originalKey,
      derivative_keys: { webp: webpKey },
      sort_order: index,
      is_cover: index === coverIndex,
      width: processed.width,
      height: processed.height,
      // A starting suggestion, not the final word — section 10 requires
      // Libby to review alt text before publish, so it stays editable.
      alt_text: altTextSeed,
    });
    if (imageRowError) throw imageRowError;
  }
}

function collectUploadedFiles(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validateUploads(files: File[]): string | null {
  if (files.length > MAX_PHOTOS_PER_ITEM) {
    return `You can attach at most ${MAX_PHOTOS_PER_ITEM} photos at a time for now.`;
  }
  for (const file of files) {
    if (!isJpeg(file)) return "Only JPEG photos are accepted at launch.";
    if (file.size > MAX_UPLOAD_BYTES) return "One of those photos is larger than 15 MB.";
  }
  return null;
}

export async function createInventoryItem(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await requireAdmin();

  const draftFields = draftItemSchema.safeParse({
    display_name: formData.get("display_name"),
    plant_description: formData.get("plant_description"),
    price_cents: formData.get("price_cents"),
    size_class: formData.get("size_class"),
    light_levels: parseLightLevels(formData),
    care_difficulty: formData.get("care_difficulty"),
    pet_safety: formData.get("pet_safety") || "unknown",
  });

  if (!draftFields.success) {
    return { fieldErrors: draftFields.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const optionalFields = optionalItemFieldsSchema.parse({
    plant_botanical_name: formData.get("plant_botanical_name") || undefined,
    vessel_style_tags: parseVesselStyleTags(formData),
    dimensions_height_in: formData.get("dimensions_height_in") || undefined,
    dimensions_width_in: formData.get("dimensions_width_in") || undefined,
    featured: formData.get("featured") === "on",
  });

  const shouldPublish = formData.get("intent") === "publish";
  let publishFields: ReturnType<typeof publishExtraSchema.parse> | null = null;

  if (shouldPublish) {
    const parsedPublish = publishExtraSchema.safeParse({
      plant_common_name: formData.get("plant_common_name"),
      vessel_name: formData.get("vessel_name"),
      vessel_material: formData.get("vessel_material"),
      directional_placement: formData.get("directional_placement"),
      watering: formData.get("watering"),
    });
    if (!parsedPublish.success) {
      return {
        fieldErrors: parsedPublish.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    publishFields = parsedPublish.data;
  }

  const files = collectUploadedFiles(formData);
  const uploadError = validateUploads(files);
  if (uploadError) return { error: uploadError };

  const supabase = await createSessionClient();

  const slugBase = buildItemSlugBase(draftFields.data.display_name, draftFields.data.plant_description);
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const status: InventoryStatus = shouldPublish ? "available" : "draft";

  const { data: inserted, error: insertError } = await supabase
    .from("inventory_items")
    .insert({
      slug,
      status,
      display_name: draftFields.data.display_name,
      plant_description: draftFields.data.plant_description,
      price_cents: draftFields.data.price_cents,
      size_class: draftFields.data.size_class,
      light_levels: draftFields.data.light_levels,
      care_difficulty: draftFields.data.care_difficulty,
      pet_safety: draftFields.data.pet_safety,
      plant_common_name: publishFields?.plant_common_name ?? emptyToNull(formData.get("plant_common_name")),
      plant_botanical_name: optionalFields.plant_botanical_name ?? null,
      vessel_name: publishFields?.vessel_name ?? emptyToNull(formData.get("vessel_name")),
      vessel_material:
        publishFields?.vessel_material ?? (emptyToNull(formData.get("vessel_material")) as VesselMaterial | null),
      vessel_style_tags: optionalFields.vessel_style_tags,
      directional_placement:
        publishFields?.directional_placement ?? emptyToNull(formData.get("directional_placement")),
      watering: publishFields?.watering ?? (emptyToNull(formData.get("watering")) as Watering | null),
      dimensions_height_in: optionalFields.dimensions_height_in ?? null,
      dimensions_width_in: optionalFields.dimensions_width_in ?? null,
      featured: optionalFields.featured,
      sort_order: 0,
      published_at: shouldPublish ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Could not save this piece." };
  }

  try {
    const coverIndex = Number(formData.get("cover_index") ?? 0);
    const altTextSeed = `${draftFields.data.display_name} — ${draftFields.data.plant_description}`;
    await processAndStoreImages(supabase, inserted.id, files, coverIndex, altTextSeed);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Saved, but photo upload failed: ${error.message}`
          : "Saved, but photo upload failed.",
    };
  }

  revalidatePath("/admin");
  redirect(`/admin/items/${inserted.id}/edit`);
}

export async function updateInventoryItem(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing item id." };

  const draftFields = draftItemSchema.safeParse({
    display_name: formData.get("display_name"),
    plant_description: formData.get("plant_description"),
    price_cents: formData.get("price_cents"),
    size_class: formData.get("size_class"),
    light_levels: parseLightLevels(formData),
    care_difficulty: formData.get("care_difficulty"),
    pet_safety: formData.get("pet_safety") || "unknown",
  });
  if (!draftFields.success) {
    return { fieldErrors: draftFields.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const optionalFields = optionalItemFieldsSchema.parse({
    plant_botanical_name: formData.get("plant_botanical_name") || undefined,
    vessel_style_tags: parseVesselStyleTags(formData),
    dimensions_height_in: formData.get("dimensions_height_in") || undefined,
    dimensions_width_in: formData.get("dimensions_width_in") || undefined,
    featured: formData.get("featured") === "on",
  });

  const shouldPublish = formData.get("intent") === "publish";
  let publishFields: ReturnType<typeof publishExtraSchema.parse> | null = null;
  if (shouldPublish) {
    const parsedPublish = publishExtraSchema.safeParse({
      plant_common_name: formData.get("plant_common_name"),
      vessel_name: formData.get("vessel_name"),
      vessel_material: formData.get("vessel_material"),
      directional_placement: formData.get("directional_placement"),
      watering: formData.get("watering"),
    });
    if (!parsedPublish.success) {
      return {
        fieldErrors: parsedPublish.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    publishFields = parsedPublish.data;
  }

  const supabase = await createSessionClient();

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({
      display_name: draftFields.data.display_name,
      plant_description: draftFields.data.plant_description,
      price_cents: draftFields.data.price_cents,
      size_class: draftFields.data.size_class,
      light_levels: draftFields.data.light_levels,
      care_difficulty: draftFields.data.care_difficulty,
      pet_safety: draftFields.data.pet_safety,
      plant_common_name: publishFields?.plant_common_name ?? emptyToNull(formData.get("plant_common_name")),
      plant_botanical_name: optionalFields.plant_botanical_name ?? null,
      vessel_name: publishFields?.vessel_name ?? emptyToNull(formData.get("vessel_name")),
      vessel_material:
        publishFields?.vessel_material ?? (emptyToNull(formData.get("vessel_material")) as VesselMaterial | null),
      vessel_style_tags: optionalFields.vessel_style_tags,
      directional_placement:
        publishFields?.directional_placement ?? emptyToNull(formData.get("directional_placement")),
      watering: publishFields?.watering ?? (emptyToNull(formData.get("watering")) as Watering | null),
      dimensions_height_in: optionalFields.dimensions_height_in ?? null,
      dimensions_width_in: optionalFields.dimensions_width_in ?? null,
      featured: optionalFields.featured,
      ...(shouldPublish ? { status: "available", published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (updateError) {
    return { error: updateError.message };
  }

  const files = collectUploadedFiles(formData);
  const uploadError = validateUploads(files);
  if (uploadError) return { error: uploadError };

  if (files.length > 0) {
    try {
      const coverIndex = Number(formData.get("cover_index") ?? -1);
      const altTextSeed = `${draftFields.data.display_name} — ${draftFields.data.plant_description}`;
      await processAndStoreImages(supabase, id, files, coverIndex, altTextSeed);
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? `Saved, but photo upload failed: ${error.message}`
            : "Saved, but photo upload failed.",
      };
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/items/${id}/edit`);
  return {};
}

const liveStatuses: InventoryStatus[] = ["available", "checkout_hold", "sold"];

export async function setItemStatus(id: string, status: InventoryStatus) {
  await requireAdmin();
  const supabase = await createSessionClient();

  // The publish_requires_details CHECK constraint requires published_at
  // (and the other publish fields) whenever status is live — set it if
  // this is the first time the item goes live, e.g. an admin jumping
  // straight from draft to sold from the quick-status dropdown.
  let publishedAt: string | undefined;
  if (liveStatuses.includes(status)) {
    const { data: current } = await supabase
      .from("inventory_items")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (!current?.published_at) publishedAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from("inventory_items")
    .update(publishedAt ? { status, published_at: publishedAt } : { status })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function setItemPrice(id: string, priceCents: number) {
  await requireAdmin();
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    throw new Error("Price must be greater than zero.");
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.from("inventory_items").update({ price_cents: priceCents }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function archiveItems(ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return;
  const supabase = await createSessionClient();
  const { error } = await supabase.from("inventory_items").update({ status: "archived" }).in("id", ids);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function moveItem(id: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = await createSessionClient();

  const { data: rows, error } = await supabase
    .from("inventory_items")
    .select("id")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const orderedIds = (rows ?? []).map((row) => row.id);
  const index = orderedIds.indexOf(id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= orderedIds.length) return;

  [orderedIds[index], orderedIds[swapWith]] = [orderedIds[swapWith], orderedIds[index]];
  await reorderItems(orderedIds);
}

export async function reorderItems(orderedIds: string[]) {
  await requireAdmin();
  const supabase = await createSessionClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("inventory_items").update({ sort_order: index }).eq("id", id),
    ),
  );
  revalidatePath("/admin");
}

export async function duplicateItem(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();

  const { data: source, error: fetchError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !source) throw fetchError ?? new Error("Item not found.");

  const slug = `${slugify(source.display_name)}-copy-${Date.now().toString(36)}`;

  const { error: insertError } = await supabase.from("inventory_items").insert({
    slug,
    status: "draft",
    display_name: `${source.display_name} (copy)`,
    plant_description: source.plant_description,
    price_cents: source.price_cents,
    size_class: source.size_class,
    light_levels: source.light_levels,
    care_difficulty: source.care_difficulty,
    pet_safety: source.pet_safety,
    plant_common_name: source.plant_common_name,
    plant_botanical_name: source.plant_botanical_name,
    vessel_name: source.vessel_name,
    vessel_material: source.vessel_material,
    vessel_style_tags: source.vessel_style_tags,
    directional_placement: source.directional_placement,
    watering: source.watering,
    dimensions_height_in: source.dimensions_height_in,
    dimensions_width_in: source.dimensions_width_in,
    featured: false,
    sort_order: 0,
    published_at: null,
  });
  if (insertError) throw insertError;

  revalidatePath("/admin");
}

export async function deleteImage(imageId: string, itemId: string) {
  await requireAdmin();
  const supabase = await createSessionClient();

  const { data: image } = await supabase
    .from("inventory_images")
    .select("storage_key, derivative_keys")
    .eq("id", imageId)
    .maybeSingle();

  const { error } = await supabase.from("inventory_images").delete().eq("id", imageId);
  if (error) throw error;

  if (image) {
    await supabase.storage.from(ORIGINALS_BUCKET).remove([image.storage_key]);
    const webpKey = (image.derivative_keys as { webp?: string })?.webp;
    if (webpKey) await supabase.storage.from(PUBLIC_BUCKET).remove([webpKey]);
  }

  revalidatePath(`/admin/items/${itemId}/edit`);
}

export async function setCoverImage(imageId: string, itemId: string) {
  await requireAdmin();
  const supabase = await createSessionClient();

  await supabase.from("inventory_images").update({ is_cover: false }).eq("inventory_item_id", itemId);
  const { error } = await supabase.from("inventory_images").update({ is_cover: true }).eq("id", imageId);
  if (error) throw error;

  revalidatePath(`/admin/items/${itemId}/edit`);
}

export async function reorderImages(itemId: string, orderedImageIds: string[]) {
  await requireAdmin();
  const supabase = await createSessionClient();
  await Promise.all(
    orderedImageIds.map((imageId, index) =>
      supabase.from("inventory_images").update({ sort_order: index }).eq("id", imageId),
    ),
  );
  revalidatePath(`/admin/items/${itemId}/edit`);
}
