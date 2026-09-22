-- Vintage Vines — initial schema.
-- Follows spec section 11 (data model) and section 12 (security rules).
--
-- business_content is deliberately omitted: section 11 explicitly allows
-- keeping content in a single typed configuration file for v1
-- (src/config/business.ts), which is what Phase 1 already did.

create table admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'available', 'checkout_hold', 'sold', 'archived')),

  -- Draft-minimum fields (section 10: "the shortest valid path to a draft").
  display_name text not null,
  plant_description text not null,
  price_cents integer not null check (price_cents > 0),
  size_class text not null check (size_class in ('small', 'standard', 'large')),
  light_levels text[] not null
    check (light_levels <@ array['low', 'medium', 'high']::text[])
    check (array_length(light_levels, 1) >= 1),
  care_difficulty text not null check (care_difficulty in ('easy', 'moderate', 'involved')),
  pet_safety text not null default 'unknown'
    check (pet_safety in ('pet_safe', 'toxic', 'unknown')),

  -- Publish-minimum fields: nullable so a draft can omit them, but
  -- inventory_items_publish_requires_details below enforces them before
  -- an item can go live.
  plant_common_name text,
  plant_botanical_name text,
  vessel_name text,
  vessel_material text check (vessel_material is null or vessel_material in ('brass', 'ceramic', 'stoneware', 'other')),
  vessel_style_tags text[] not null default '{}',
  directional_placement text,
  watering text check (watering is null or watering in ('infrequent', 'regular', 'frequent')),
  dimensions_height_in numeric,
  dimensions_width_in numeric,

  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint inventory_items_publish_requires_details check (
    status not in ('available', 'checkout_hold', 'sold')
    or (
      plant_common_name is not null
      and vessel_name is not null
      and vessel_material is not null
      and directional_placement is not null
      and watering is not null
      and published_at is not null
    )
  )
);

create index inventory_items_status_idx on inventory_items (status);
create index inventory_items_sort_order_idx on inventory_items (sort_order);
create index inventory_items_featured_idx on inventory_items (featured) where featured;

create table inventory_images (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items (id) on delete cascade,
  storage_key text not null,
  derivative_keys jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  alt_text text,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index inventory_images_item_id_idx on inventory_images (inventory_item_id);
-- At most one cover image per item.
create unique index inventory_images_one_cover_idx on inventory_images (inventory_item_id) where is_cover;

create table claims (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items (id),
  status text not null default 'hold' check (status in ('hold', 'expired', 'paid', 'cancelled')),

  contact_name text,
  contact_email text,
  contact_phone text,
  fulfillment_method text check (fulfillment_method is null or fulfillment_method in ('pickup', 'delivery')),
  delivery_address text,
  gift_note text,

  hold_expires_at timestamptz not null,
  payment_provider text,
  payment_provider_reference text,
  payment_verified boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claims_inventory_item_id_idx on claims (inventory_item_id);
create index claims_status_idx on claims (status);
create index claims_hold_expires_at_idx on claims (hold_expires_at);

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventory_items_set_updated_at
  before update on inventory_items
  for each row execute function set_updated_at();

create trigger claims_set_updated_at
  before update on claims
  for each row execute function set_updated_at();

-- Row-level security -----------------------------------------------------
-- section 12: "Public users can read only published, available inventory
-- fields and public images." / "Only authenticated approved admins can
-- access the inventory upload flow... create, edit, sort, publish, or
-- change status." / claims: "keep it out of public queries."

alter table admin_users enable row level security;
alter table inventory_items enable row level security;
alter table inventory_images enable row level security;
alter table claims enable row level security;

-- security definer: admin_users has its own RLS policy that calls this
-- function, so without security definer (running as the owning,
-- RLS-bypassing role) the check would recurse into itself.
create function is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users au
    where au.email = (auth.jwt() ->> 'email')
  );
$$;

-- admin_users: no public access at all; admins can see the allowlist.
create policy "admins_read_admin_users" on admin_users
  for select
  using (is_approved_admin());

-- inventory_items
create policy "public_read_available_items" on inventory_items
  for select
  using (status = 'available');

create policy "admins_read_all_items" on inventory_items
  for select
  using (is_approved_admin());

create policy "admins_insert_items" on inventory_items
  for insert
  with check (is_approved_admin());

create policy "admins_update_items" on inventory_items
  for update
  using (is_approved_admin())
  with check (is_approved_admin());

-- No delete policy: "no easy permanent delete" (section 10). Bulk archive
-- uses status='archived' via the update policy above instead.

-- inventory_images
create policy "public_read_published_item_images" on inventory_images
  for select
  using (
    exists (
      select 1 from inventory_items ii
      where ii.id = inventory_images.inventory_item_id
      and ii.status = 'available'
    )
  );

create policy "admins_read_all_images" on inventory_images
  for select
  using (is_approved_admin());

create policy "admins_insert_images" on inventory_images
  for insert
  with check (is_approved_admin());

create policy "admins_update_images" on inventory_images
  for update
  using (is_approved_admin())
  with check (is_approved_admin());

create policy "admins_delete_images" on inventory_images
  for delete
  using (is_approved_admin());

-- claims: no public policy at all. Claims are created and read by
-- server code using the service-role key (section 12), which bypasses
-- RLS by design. Admins get read access for order review.
create policy "admins_read_claims" on claims
  for select
  using (is_approved_admin());
