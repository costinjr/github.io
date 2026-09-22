-- Storage buckets for inventory photos (section 10, section 12).
--
-- inventory-originals: private. Holds the original uploaded JPEG after
-- metadata stripping. Only admins can read it; all writes go through
-- server code using the service-role key (signed uploads / upload
-- tokens per section 12), never a public insert policy.
--
-- inventory-public: public. Holds the responsive/WebP/AVIF derivatives
-- actually served on the site. Readable only for images that belong to
-- a currently available item, mirroring the inventory_images RLS policy
-- at the storage layer.
--
-- Object paths are expected as: inventory/{inventory_item_id}/{image_id}/{file}

insert into storage.buckets (id, name, public)
values
  ('inventory-originals', 'inventory-originals', false),
  ('inventory-public', 'inventory-public', true);

create policy "admins_read_original_photos" on storage.objects
  for select
  using (
    bucket_id = 'inventory-originals'
    and is_approved_admin()
  );

create policy "admins_write_original_photos" on storage.objects
  for insert
  with check (
    bucket_id = 'inventory-originals'
    and is_approved_admin()
  );

create policy "admins_update_original_photos" on storage.objects
  for update
  using (bucket_id = 'inventory-originals' and is_approved_admin())
  with check (bucket_id = 'inventory-originals' and is_approved_admin());

create policy "admins_delete_original_photos" on storage.objects
  for delete
  using (bucket_id = 'inventory-originals' and is_approved_admin());

create policy "public_read_published_derivative_photos" on storage.objects
  for select
  using (
    bucket_id = 'inventory-public'
    and exists (
      select 1 from inventory_items ii
      where ii.id::text = (storage.foldername(name))[2]
      and ii.status = 'available'
    )
  );

create policy "admins_read_all_derivative_photos" on storage.objects
  for select
  using (bucket_id = 'inventory-public' and is_approved_admin());

create policy "admins_write_derivative_photos" on storage.objects
  for insert
  with check (bucket_id = 'inventory-public' and is_approved_admin());

create policy "admins_update_derivative_photos" on storage.objects
  for update
  using (bucket_id = 'inventory-public' and is_approved_admin())
  with check (bucket_id = 'inventory-public' and is_approved_admin());

create policy "admins_delete_derivative_photos" on storage.objects
  for delete
  using (bucket_id = 'inventory-public' and is_approved_admin());
