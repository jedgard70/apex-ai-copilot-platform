-- CP12A - apply in a new Supabase project.
-- Purpose: storage buckets and RLS policy draft for Apex AI Copilot.
-- Path convention for protected buckets:
--   <tenant_id>/<project_id>/<file_id-or-safe-name>
-- Tenant/project access is checked through app_private helpers from 0002.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-uploads', 'project-uploads', false, 104857600, null),
  ('archvis-images', 'archvis-images', false, 104857600, array['image/png','image/jpeg','image/webp','image/gif','image/heic','image/heif']),
  ('generated-images', 'generated-images', false, 104857600, array['image/png','image/jpeg','image/webp']),
  ('directcut-media', 'directcut-media', false, 524288000, null),
  ('bim-models', 'bim-models', false, 1073741824, null),
  ('documents', 'documents', false, 104857600, null),
  ('field-photos', 'field-photos', false, 104857600, array['image/png','image/jpeg','image/webp','image/gif','image/heic','image/heif']),
  ('exports', 'exports', false, 524288000, null),
  ('skill-files', 'skill-files', false, 104857600, null),
  ('public-assets', 'public-assets', true, 104857600, null)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Protected project buckets: authenticated users can read/write only if they can access/write the project
-- encoded in the object path.
drop policy if exists protected_project_files_select on storage.objects;
drop policy if exists protected_project_files_select on storage.objects for select;\ncreate policy protected_project_files_select on storage.objects for select
to authenticated
using (
  bucket_id in (
    'project-uploads',
    'archvis-images',
    'generated-images',
    'directcut-media',
    'bim-models',
    'documents',
    'field-photos',
    'exports',
    'skill-files'
  )
  and app_private.can_access_project(
    nullif(split_part(name, '/', 1), '')::uuid,
    nullif(split_part(name, '/', 2), '')::uuid
  )
);

drop policy if exists protected_project_files_insert on storage.objects;
drop policy if exists protected_project_files_insert on storage.objects for insert;\ncreate policy protected_project_files_insert on storage.objects for insert
to authenticated
with check (
  bucket_id in (
    'project-uploads',
    'archvis-images',
    'generated-images',
    'directcut-media',
    'bim-models',
    'documents',
    'field-photos',
    'exports',
    'skill-files'
  )
  and app_private.can_write_project(
    nullif(split_part(name, '/', 1), '')::uuid,
    nullif(split_part(name, '/', 2), '')::uuid
  )
);

drop policy if exists protected_project_files_update on storage.objects;
drop policy if exists protected_project_files_update on storage.objects for update;\ncreate policy protected_project_files_update on storage.objects for update
to authenticated
using (
  bucket_id in (
    'project-uploads',
    'archvis-images',
    'generated-images',
    'directcut-media',
    'bim-models',
    'documents',
    'field-photos',
    'exports',
    'skill-files'
  )
  and app_private.can_write_project(
    nullif(split_part(name, '/', 1), '')::uuid,
    nullif(split_part(name, '/', 2), '')::uuid
  )
)
with check (
  bucket_id in (
    'project-uploads',
    'archvis-images',
    'generated-images',
    'directcut-media',
    'bim-models',
    'documents',
    'field-photos',
    'exports',
    'skill-files'
  )
  and app_private.can_write_project(
    nullif(split_part(name, '/', 1), '')::uuid,
    nullif(split_part(name, '/', 2), '')::uuid
  )
);

drop policy if exists protected_project_files_delete on storage.objects;
drop policy if exists protected_project_files_delete on storage.objects for delete;\ncreate policy protected_project_files_delete on storage.objects for delete
to authenticated
using (
  bucket_id in (
    'project-uploads',
    'archvis-images',
    'generated-images',
    'directcut-media',
    'bim-models',
    'documents',
    'field-photos',
    'exports',
    'skill-files'
  )
  and app_private.has_tenant_role(
    nullif(split_part(name, '/', 1), '')::uuid,
    array['owner_admin','project_manager']::public.user_role[]
  )
);

-- Public assets: public read is allowed for app branding/static material only.
-- Public writes remain forbidden.
drop policy if exists public_assets_read on storage.objects;
drop policy if exists public_assets_read on storage.objects for select;\ncreate policy public_assets_read on storage.objects for select
to anon, authenticated
using (bucket_id = 'public-assets');

drop policy if exists public_assets_admin_write on storage.objects;
drop policy if exists public_assets_admin_write on storage.objects for all;\ncreate policy public_assets_admin_write on storage.objects for all
to authenticated
using (
  bucket_id = 'public-assets'
  and app_private.has_tenant_role(
    nullif(split_part(name, '/', 1), '')::uuid,
    array['owner_admin']::public.user_role[]
  )
)
with check (
  bucket_id = 'public-assets'
  and app_private.has_tenant_role(
    nullif(split_part(name, '/', 1), '')::uuid,
    array['owner_admin']::public.user_role[]
  )
);

