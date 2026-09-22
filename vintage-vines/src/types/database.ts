/**
 * Hand-written to match supabase/migrations/0001_init.sql and 0002_storage.sql.
 * Regenerate with `supabase gen types typescript` once a live project
 * exists, and keep this file's shape as the target.
 */

export type InventoryStatus = "draft" | "available" | "checkout_hold" | "sold" | "archived";
export type SizeClass = "small" | "standard" | "large";
export type LightLevel = "low" | "medium" | "high";
export type CareDifficulty = "easy" | "moderate" | "involved";
export type PetSafety = "pet_safe" | "toxic" | "unknown";
export type VesselMaterial = "brass" | "ceramic" | "stoneware" | "other";
export type Watering = "infrequent" | "regular" | "frequent";
export type ClaimStatus = "hold" | "expired" | "paid" | "cancelled";
export type FulfillmentMethod = "pickup" | "delivery";

export interface InventoryItemRow {
  id: string;
  slug: string;
  status: InventoryStatus;
  display_name: string;
  plant_description: string;
  price_cents: number;
  size_class: SizeClass;
  light_levels: LightLevel[];
  care_difficulty: CareDifficulty;
  pet_safety: PetSafety;
  plant_common_name: string | null;
  plant_botanical_name: string | null;
  vessel_name: string | null;
  vessel_material: VesselMaterial | null;
  vessel_style_tags: string[];
  directional_placement: string | null;
  watering: Watering | null;
  dimensions_height_in: number | null;
  dimensions_width_in: number | null;
  featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InventoryItemInsert = Omit<
  InventoryItemRow,
  "id" | "created_at" | "updated_at"
> &
  Partial<Pick<InventoryItemRow, "id">>;

export type InventoryItemUpdate = Partial<InventoryItemInsert>;

export interface InventoryImageRow {
  id: string;
  inventory_item_id: string;
  storage_key: string;
  derivative_keys: Record<string, unknown>;
  sort_order: number;
  is_cover: boolean;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export type InventoryImageInsert = Omit<InventoryImageRow, "id" | "created_at"> &
  Partial<Pick<InventoryImageRow, "id">>;

export type InventoryImageUpdate = Partial<InventoryImageInsert>;

export interface ClaimRow {
  id: string;
  inventory_item_id: string;
  status: ClaimStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  fulfillment_method: FulfillmentMethod | null;
  delivery_address: string | null;
  gift_note: string | null;
  hold_expires_at: string;
  payment_provider: string | null;
  payment_provider_reference: string | null;
  payment_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type ClaimInsert = Omit<ClaimRow, "id" | "created_at" | "updated_at"> &
  Partial<Pick<ClaimRow, "id">>;

export type ClaimUpdate = Partial<ClaimInsert>;

export interface AdminUserRow {
  email: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      inventory_items: {
        Row: InventoryItemRow;
        Insert: InventoryItemInsert;
        Update: InventoryItemUpdate;
      };
      inventory_images: {
        Row: InventoryImageRow;
        Insert: InventoryImageInsert;
        Update: InventoryImageUpdate;
      };
      claims: {
        Row: ClaimRow;
        Insert: ClaimInsert;
        Update: ClaimUpdate;
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: AdminUserRow;
        Update: Partial<AdminUserRow>;
      };
    };
  };
}
