-- CP12A apply against a brand-new Supabase project.
-- Purpose: tenant/project RLS policy for Apex AI Copilot.
-- Security note: authorization is database-owned through tenant_members/project_members,

create schema if not exists app_private;
revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create or replace function app_private.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function app_private.has_tenant_role(target_tenant_id uuid, allowed_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
      and tm.role = any(allowed_roles)
      and tm.status = 'active'
  );
$$;

create or replace function app_private.can_access_project(target_tenant_id uuid, target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    app_private.has_tenant_role(target_tenant_id, array['owner_admin','internal_team','project_manager']::public.user_role[])
    or exists (
      select 1
      from public.project_members pm
      where pm.tenant_id = target_tenant_id
        and pm.project_id = target_project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    );
$$;

create or replace function app_private.can_write_project(target_tenant_id uuid, target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    app_private.has_tenant_role(target_tenant_id, array['owner_admin','internal_team','project_manager']::public.user_role[])
    or exists (
      select 1
      from public.project_members pm
      where pm.tenant_id = target_tenant_id
        and pm.project_id = target_project_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner_admin','internal_team','partner','contractor','finance','sales','field','bim_manager','project_manager')
        and pm.status = 'active'
    );
$$;

create or replace function app_private.can_access_finance(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select app_private.has_tenant_role(target_tenant_id, array['owner_admin','finance']::public.user_role[]);
$$;

create or replace function app_private.can_access_crm(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select app_private.has_tenant_role(target_tenant_id, array['owner_admin','sales','internal_team']::public.user_role[]);
$$;

create or replace function app_private.can_access_field(target_tenant_id uuid, target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    app_private.has_tenant_role(target_tenant_id, array['owner_admin','internal_team','field','project_manager']::public.user_role[])
    or app_private.can_access_project(target_tenant_id, target_project_id);
$$;

create or replace function app_private.can_access_bim(target_tenant_id uuid, target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    app_private.has_tenant_role(target_tenant_id, array['owner_admin','internal_team','bim_manager','project_manager']::public.user_role[])
    or app_private.can_access_project(target_tenant_id, target_project_id);
$$;

-- Enable RLS on every public table.
do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Profiles: a user reads/updates self; tenant admins can read members through tenant membership.
drop policy if exists profiles_select_self_or_tenant_admin on public.profiles;
drop policy if exists profiles_select_self_or_tenant_admin on public.profiles for select;\ncreate policy profiles_select_self_or_tenant_admin on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.tenant_members admin_member
    join public.tenant_members target_member on target_member.tenant_id = admin_member.tenant_id
    where admin_member.user_id = auth.uid()
      and admin_member.role = 'owner_admin'
      and admin_member.status = 'active'
      and target_member.user_id = profiles.id
  )
);

drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles for update;\ncreate policy profiles_update_self on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Tenants and membership.
drop policy if exists tenants_member_select on public.tenants;
drop policy if exists tenants_member_select on public.tenants for select;\ncreate policy tenants_member_select on public.tenants for select
to authenticated
using (app_private.is_tenant_member(id));

drop policy if exists tenants_owner_admin_write on public.tenants;
drop policy if exists tenants_owner_admin_write on public.tenants for all;\ncreate policy tenants_owner_admin_write on public.tenants for all
to authenticated
using (app_private.has_tenant_role(id, array['owner_admin']::public.user_role[]))
with check (created_by = auth.uid() or app_private.has_tenant_role(id, array['owner_admin']::public.user_role[]));

drop policy if exists tenant_members_member_select on public.tenant_members;
drop policy if exists tenant_members_member_select on public.tenant_members for select;\ncreate policy tenant_members_member_select on public.tenant_members for select
to authenticated
using (app_private.is_tenant_member(tenant_id));

drop policy if exists tenant_members_owner_admin_write on public.tenant_members;
drop policy if exists tenant_members_owner_admin_write on public.tenant_members for all;\ncreate policy tenant_members_owner_admin_write on public.tenant_members for all
to authenticated
using (app_private.has_tenant_role(tenant_id, array['owner_admin']::public.user_role[]))
with check (app_private.has_tenant_role(tenant_id, array['owner_admin']::public.user_role[]));

-- Roles and permissions are readable to authenticated users; writes are reserved for service/admin setup.
drop policy if exists roles_authenticated_read on public.roles;
drop policy if exists roles_authenticated_read on public.roles for select to authenticated using (true);;\ncreate policy roles_authenticated_read on public.roles for select to authenticated using (true);
drop policy if exists permissions_authenticated_read on public.permissions;
drop policy if exists permissions_authenticated_read on public.permissions for select to authenticated using (true);;\ncreate policy permissions_authenticated_read on public.permissions for select to authenticated using (true);
drop policy if exists role_permissions_authenticated_read on public.role_permissions;
drop policy if exists role_permissions_authenticated_read on public.role_permissions for select to authenticated using (true);;\ncreate policy role_permissions_authenticated_read on public.role_permissions for select to authenticated using (true);

-- Project base tables.
drop policy if exists projects_select_assigned on public.projects;
drop policy if exists projects_select_assigned on public.projects for select;\ncreate policy projects_select_assigned on public.projects for select
to authenticated
using (app_private.can_access_project(tenant_id, id));

drop policy if exists projects_insert_tenant_staff on public.projects;
drop policy if exists projects_insert_tenant_staff on public.projects for insert;\ncreate policy projects_insert_tenant_staff on public.projects for insert
to authenticated
with check (
  app_private.has_tenant_role(tenant_id, array['owner_admin','internal_team','project_manager','sales']::public.user_role[])
);

drop policy if exists projects_update_assigned_staff on public.projects;
drop policy if exists projects_update_assigned_staff on public.projects for update;\ncreate policy projects_update_assigned_staff on public.projects for update
to authenticated
using (app_private.can_write_project(tenant_id, id))
with check (app_private.can_write_project(tenant_id, id));

drop policy if exists project_members_select_assigned on public.project_members;
drop policy if exists project_members_select_assigned on public.project_members for select;\ncreate policy project_members_select_assigned on public.project_members for select
to authenticated
using (app_private.can_access_project(tenant_id, project_id));

drop policy if exists project_members_admin_write on public.project_members;
drop policy if exists project_members_admin_write on public.project_members for all;\ncreate policy project_members_admin_write on public.project_members for all
to authenticated
using (app_private.has_tenant_role(tenant_id, array['owner_admin','project_manager']::public.user_role[]))
with check (app_private.has_tenant_role(tenant_id, array['owner_admin','project_manager']::public.user_role[]));

-- Generic project-owned table policies.
do $$
declare
  t text;
  project_tables text[] := array[
    'project_files','project_messages','project_exports','project_activity','project_preferences',
    'archvis_sessions','archvis_outputs','archvis_prompts','archvis_revision_constraints','archvis_gallery_items',
    'directcut_sessions','directcut_plans','directcut_scenes','directcut_storyboards','directcut_gallery_items',
    'budget_estimates','budget_items','budget_scope_items','pricing_sources','sinapi_sources','evm_records',
    'schedule_tasks','schedule_dependencies','milestones','contracts','contract_clauses','contract_risks',
    'permit_packages','permit_documents','permit_checklists','document_trackers','research_sessions',
    'research_findings','source_evidence','market_reports','proposal_outputs','procurement_items',
    'alerts','ai_usage_records','ai_cost_thresholds','knowledge_items','skill_updates','skill_exports',
    'platform_audits','devops_tasks','repo_reviews','digital_twin_items','twin_events','metrics_records',
    'health_checks','pwa_settings','sync_queue_items'
  ];
begin
  foreach t in array project_tables
  loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t)
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'project_id')
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'tenant_id') then
      execute format('drop policy if exists %I on public.%I', t || '_project_select', t);
      execute format('create policy %I on public.%I for select to authenticated using ((project_id is null and app_private.is_tenant_member(tenant_id)) or app_private.can_access_project(tenant_id, project_id))', t || '_project_select', t);
      execute format('drop policy if exists %I on public.%I', t || '_project_insert', t);
      execute format('create policy %I on public.%I for insert to authenticated with check ((project_id is null and app_private.has_tenant_role(tenant_id, array[''owner_admin'',''internal_team'',''project_manager'']::public.user_role[])) or app_private.can_write_project(tenant_id, project_id))', t || '_project_insert', t);
      execute format('drop policy if exists %I on public.%I', t || '_project_update', t);
      execute format('create policy %I on public.%I for update to authenticated using ((project_id is null and app_private.has_tenant_role(tenant_id, array[''owner_admin'',''internal_team'',''project_manager'']::public.user_role[])) or app_private.can_write_project(tenant_id, project_id)) with check ((project_id is null and app_private.has_tenant_role(tenant_id, array[''owner_admin'',''internal_team'',''project_manager'']::public.user_role[])) or app_private.can_write_project(tenant_id, project_id))', t || '_project_update', t);
      execute format('drop policy if exists %I on public.%I', t || '_project_delete', t);
      execute format('create policy %I on public.%I for delete to authenticated using (app_private.has_tenant_role(tenant_id, array[''owner_admin'',''project_manager'']::public.user_role[]))', t || '_project_delete', t);
    end if;
  end loop;
end $$;

-- BIM, Field and Finance/CRM role-specific overlays. These do not weaken project policies;
-- they add explicit reads/writes for module roles where project assignment exists.
do $$
declare
  t text;
begin
  foreach t in array array['bim_models','bim_viewer_sessions','bim_findings','bim_corrections','bim_saved_views','bim_tours','bim_animation_paths','bim_export_briefs']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_bim_role_access', t);
    execute format('create policy %I on public.%I for all to authenticated using (app_private.can_access_bim(tenant_id, project_id)) with check (app_private.can_access_bim(tenant_id, project_id))', t || '_bim_role_access', t);
  end loop;

  foreach t in array array['rdos','rdo_activities','field_photos','field_issues','punch_items','safety_checklists','quality_checklists','nr_compliance_items','corrective_actions']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_field_role_access', t);
    execute format('create policy %I on public.%I for all to authenticated using (app_private.can_access_field(tenant_id, project_id)) with check (app_private.can_access_field(tenant_id, project_id))', t || '_field_role_access', t);
  end loop;
end $$;

-- Tenant-scoped CRM, finance, accounting and suppliers.
do $$
declare
  t text;
begin
  foreach t in array array['companies','contacts','leads','opportunities','proposals','service_catalog','suppliers','supplier_evaluations']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_crm_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (app_private.can_access_crm(tenant_id))', t || '_crm_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_crm_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (app_private.can_access_crm(tenant_id)) with check (app_private.can_access_crm(tenant_id))', t || '_crm_write', t);
  end loop;

  foreach t in array array['invoices','payments','expenses','accounting_entries','accounts_receivable','accounts_payable','accountant_packages','tax_prep_items']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_finance_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (app_private.can_access_finance(tenant_id))', t || '_finance_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_finance_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (app_private.can_access_finance(tenant_id)) with check (app_private.can_access_finance(tenant_id))', t || '_finance_write', t);
  end loop;
end $$;

-- Audit logs: members read tenant audit; inserts are allowed for authenticated actions.
drop policy if exists audit_logs_tenant_read on public.audit_logs;
drop policy if exists audit_logs_tenant_read on public.audit_logs for select;\ncreate policy audit_logs_tenant_read on public.audit_logs for select
to authenticated
using (tenant_id is not null and app_private.is_tenant_member(tenant_id));

drop policy if exists audit_logs_authenticated_insert on public.audit_logs;
drop policy if exists audit_logs_authenticated_insert on public.audit_logs for insert;\ncreate policy audit_logs_authenticated_insert on public.audit_logs for insert
to authenticated
with check (created_by = auth.uid() and (tenant_id is null or app_private.is_tenant_member(tenant_id)));

-- User preferences: self-owned, with optional tenant membership.
drop policy if exists user_preferences_self on public.user_preferences;
drop policy if exists user_preferences_self on public.user_preferences for all;\ncreate policy user_preferences_self on public.user_preferences for all
to authenticated
using (user_id = auth.uid() and (tenant_id is null or app_private.is_tenant_member(tenant_id)))
with check (user_id = auth.uid() and (tenant_id is null or app_private.is_tenant_member(tenant_id)));

-- No policies are granted to anon. No public writes in this draft.

