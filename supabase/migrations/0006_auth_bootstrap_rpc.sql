-- CP15B - Safe auth bootstrap RPC
-- Purpose:
-- - allow a signed-in user to create their own profile row when missing
-- - create a first private workspace only when the user has no active tenant membership
-- - assign Owner/Admin only for that newly-created workspace
-- - avoid service_role in browser/client code
-- - avoid arbitrary role escalation or arbitrary tenant assignment

create or replace function public.bootstrap_user_workspace()
returns table (
  profile_id uuid,
  tenant_id uuid,
  role public.user_role,
  bootstrap_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_profile_id uuid;
  v_existing_tenant_id uuid;
  v_existing_role public.user_role;
  v_tenant_id uuid;
begin
  if v_user_id is null then
    raise exception 'bootstrap_user_workspace requires an authenticated user';
  end if;

  select u.email
    into v_email
  from auth.users u
  where u.id = v_user_id;

  if v_email is null then
    v_email := concat(v_user_id::text, '@unknown.local');
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    status,
    created_by,
    metadata
  )
  values (
    v_user_id,
    v_email,
    v_email,
    'active',
    v_user_id,
    jsonb_build_object('bootstrap_source', 'bootstrap_user_workspace')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now(),
        metadata = public.profiles.metadata || jsonb_build_object('bootstrap_last_seen', now())
  returning id into v_profile_id;

  select tm.tenant_id, tm.role
    into v_existing_tenant_id, v_existing_role
  from public.tenant_members tm
  where tm.user_id = v_user_id
    and tm.status = 'active'
  order by tm.created_at asc
  limit 1;

  if v_existing_tenant_id is not null then
    update public.profiles
       set default_tenant_id = coalesce(default_tenant_id, v_existing_tenant_id),
           updated_at = now()
     where id = v_user_id;

    profile_id := v_profile_id;
    tenant_id := v_existing_tenant_id;
    role := v_existing_role;
    bootstrap_status := 'existing-membership';
    return next;
    return;
  end if;

  insert into public.tenants (
    name,
    slug,
    status,
    plan,
    created_by,
    metadata
  )
  values (
    'Apex Workspace',
    concat('apex-', replace(v_user_id::text, '-', '')),
    'active',
    'internal',
    v_user_id,
    jsonb_build_object('bootstrap_source', 'bootstrap_user_workspace')
  )
  returning id into v_tenant_id;

  insert into public.tenant_members (
    tenant_id,
    user_id,
    role,
    status,
    created_by,
    metadata
  )
  values (
    v_tenant_id,
    v_user_id,
    'owner_admin',
    'active',
    v_user_id,
    jsonb_build_object('bootstrap_source', 'bootstrap_user_workspace')
  );

  update public.profiles
     set default_tenant_id = v_tenant_id,
         updated_at = now()
   where id = v_user_id;

  profile_id := v_profile_id;
  tenant_id := v_tenant_id;
  role := 'owner_admin';
  bootstrap_status := 'created-owner-workspace';
  return next;
end;
$$;

revoke execute on function public.bootstrap_user_workspace() from anon;
revoke execute on function public.bootstrap_user_workspace() from public;
grant execute on function public.bootstrap_user_workspace() to authenticated;
