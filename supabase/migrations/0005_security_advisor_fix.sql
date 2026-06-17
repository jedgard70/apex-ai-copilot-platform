-- CP14D - Supabase security advisor fix
-- Safe intent:
-- - set fixed search_path on updated_at helper functions
-- - broad public object listing policy from public-assets
-- - direct client execution from public.rls_auto_enable()
-- - do not drop data
-- - do not disable RLS
-- - do not weaken tenant/project policies

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_updated_at_trigger(table_name text)
returns void
language plpgsql
set search_path = public
as $$
begin
  execute format('drop trigger if exists set_updated_at on public.%I', table_name);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
end;
$$;

-- Public buckets can still serve public object URLs without a broad SELECT
-- policy that allows bucket listing through the Data API.
drop policy if exists public_assets_read on storage.objects;

-- rls_auto_enable is an administrative helper and should not be callable by
-- anon/authenticated clients through REST RPC. The block keeps local resets safe
-- if the function is absent in a fresh environment.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from anon;
    revoke execute on function public.rls_auto_enable() from authenticated;
    revoke execute on function public.rls_auto_enable() from public;
  end if;
end $$;
