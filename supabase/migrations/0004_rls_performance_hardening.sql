-- CP14C - Supabase RLS/performance hardening
-- Safe intent:
-- - add missing foreign-key indexes used by joins/RLS
-- - optimize auth.uid() usage for RLS initplan warnings
-- - split broad ALL write policies where they overlap SELECT policies
-- - do not drop data
-- - do not disable RLS
-- - do not weaken tenant/project access rules
-- - do not drop unused indexes in this checkpoint

-- ---------------------------------------------------------------------------
-- RLS helper optimization
-- ---------------------------------------------------------------------------

create or replace function app_private.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'active'
  );
$$;

create or replace function app_private.has_tenant_role(
  target_tenant_id uuid,
  allowed_roles public.user_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role = any(allowed_roles)
      and tm.status = 'active'
  );
$$;

create or replace function app_private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
  )
  or exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and app_private.has_tenant_role(
        p.tenant_id,
        array['owner_admin', 'internal_team', 'project_manager']::public.user_role[]
      )
  );
$$;

create or replace function app_private.can_write_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = (select auth.uid())
      and pm.role = any(array['owner_admin', 'internal_team', 'project_manager', 'bim_manager', 'field']::public.user_role[])
      and pm.status = 'active'
  )
  or exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and app_private.has_tenant_role(
        p.tenant_id,
        array['owner_admin', 'internal_team', 'project_manager']::public.user_role[]
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Missing foreign-key indexes
-- ---------------------------------------------------------------------------

create index if not exists accounts_payable_expense_id_fk_idx on public.accounts_payable(expense_id);
create index if not exists accounts_receivable_invoice_id_fk_idx on public.accounts_receivable(invoice_id);
create index if not exists archvis_gallery_items_file_id_fk_idx on public.archvis_gallery_items(file_id);
create index if not exists archvis_gallery_items_output_id_fk_idx on public.archvis_gallery_items(output_id);
create index if not exists archvis_gallery_items_session_id_fk_idx on public.archvis_gallery_items(session_id);
create index if not exists archvis_outputs_generated_file_id_fk_idx on public.archvis_outputs(generated_file_id);
create index if not exists archvis_outputs_session_id_fk_idx on public.archvis_outputs(session_id);
create index if not exists archvis_outputs_source_file_id_fk_idx on public.archvis_outputs(source_file_id);
create index if not exists archvis_prompts_session_id_fk_idx on public.archvis_prompts(session_id);
create index if not exists archvis_revision_constraints_session_id_fk_idx on public.archvis_revision_constraints(session_id);
create index if not exists audit_logs_actor_id_fk_idx on public.audit_logs(actor_id);
create index if not exists bim_animation_paths_tour_id_fk_idx on public.bim_animation_paths(tour_id);
create index if not exists bim_corrections_finding_id_fk_idx on public.bim_corrections(finding_id);
create index if not exists bim_export_briefs_model_id_fk_idx on public.bim_export_briefs(model_id);
create index if not exists bim_findings_model_id_fk_idx on public.bim_findings(model_id);
create index if not exists bim_models_file_id_fk_idx on public.bim_models(file_id);
create index if not exists bim_saved_views_model_id_fk_idx on public.bim_saved_views(model_id);
create index if not exists bim_tours_model_id_fk_idx on public.bim_tours(model_id);
create index if not exists bim_viewer_sessions_model_id_fk_idx on public.bim_viewer_sessions(model_id);
create index if not exists budget_items_estimate_id_fk_idx on public.budget_items(estimate_id);
create index if not exists budget_scope_items_estimate_id_fk_idx on public.budget_scope_items(estimate_id);
create index if not exists contacts_company_id_fk_idx on public.contacts(company_id);
create index if not exists contract_clauses_contract_id_fk_idx on public.contract_clauses(contract_id);
create index if not exists contract_risks_contract_id_fk_idx on public.contract_risks(contract_id);
create index if not exists digital_twin_items_linked_model_id_fk_idx on public.digital_twin_items(linked_model_id);
create index if not exists directcut_gallery_items_file_id_fk_idx on public.directcut_gallery_items(file_id);
create index if not exists directcut_gallery_items_plan_id_fk_idx on public.directcut_gallery_items(plan_id);
create index if not exists directcut_gallery_items_session_id_fk_idx on public.directcut_gallery_items(session_id);
create index if not exists directcut_plans_session_id_fk_idx on public.directcut_plans(session_id);
create index if not exists directcut_scenes_plan_id_fk_idx on public.directcut_scenes(plan_id);
create index if not exists directcut_storyboards_plan_id_fk_idx on public.directcut_storyboards(plan_id);
create index if not exists expenses_vendor_company_id_fk_idx on public.expenses(vendor_company_id);
create index if not exists field_photos_file_id_fk_idx on public.field_photos(file_id);
create index if not exists invoices_company_id_fk_idx on public.invoices(company_id);
create index if not exists knowledge_items_approved_by_fk_idx on public.knowledge_items(approved_by);
create index if not exists leads_contact_id_fk_idx on public.leads(contact_id);
create index if not exists opportunities_company_id_fk_idx on public.opportunities(company_id);
create index if not exists opportunities_contact_id_fk_idx on public.opportunities(contact_id);
create index if not exists payments_invoice_id_fk_idx on public.payments(invoice_id);
create index if not exists permit_checklists_package_id_fk_idx on public.permit_checklists(package_id);
create index if not exists permit_documents_package_id_fk_idx on public.permit_documents(package_id);
create index if not exists procurement_items_supplier_id_fk_idx on public.procurement_items(supplier_id);
create index if not exists profiles_default_tenant_id_fk_idx on public.profiles(default_tenant_id);
create index if not exists project_exports_storage_file_id_fk_idx on public.project_exports(storage_file_id);
create index if not exists proposals_opportunity_id_fk_idx on public.proposals(opportunity_id);
create index if not exists rdo_activities_rdo_id_fk_idx on public.rdo_activities(rdo_id);
create index if not exists research_findings_session_id_fk_idx on public.research_findings(session_id);
create index if not exists schedule_dependencies_predecessor_task_id_fk_idx on public.schedule_dependencies(predecessor_task_id);
create index if not exists schedule_dependencies_successor_task_id_fk_idx on public.schedule_dependencies(successor_task_id);
create index if not exists sinapi_sources_file_id_fk_idx on public.sinapi_sources(file_id);
create index if not exists skill_exports_export_file_id_fk_idx on public.skill_exports(export_file_id);
create index if not exists skill_updates_source_file_id_fk_idx on public.skill_updates(source_file_id);
create index if not exists supplier_evaluations_supplier_id_fk_idx on public.supplier_evaluations(supplier_id);
create index if not exists twin_events_twin_id_fk_idx on public.twin_events(twin_id);
create index if not exists user_preferences_user_id_fk_idx on public.user_preferences(user_id);

-- ---------------------------------------------------------------------------
-- Direct auth.uid() policy optimization
-- ---------------------------------------------------------------------------

drop policy if exists audit_logs_authenticated_insert on public.audit_logs;
create policy audit_logs_authenticated_insert
on public.audit_logs
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (tenant_id is null or app_private.is_tenant_member(tenant_id))
);

drop policy if exists profiles_select_self_or_tenant_admin on public.profiles;
create policy profiles_select_self_or_tenant_admin
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.tenant_members admin_member
    join public.tenant_members target_member
      on target_member.tenant_id = admin_member.tenant_id
    where admin_member.user_id = (select auth.uid())
      and admin_member.role = 'owner_admin'
      and admin_member.status = 'active'
      and target_member.user_id = profiles.id
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists user_preferences_self on public.user_preferences;
-- ensure idempotency: drop the exact select policy if present
drop policy if exists user_preferences_self_select on public.user_preferences;
create policy user_preferences_self_select
on public.user_preferences
for select
to authenticated
using (
  user_id = (select auth.uid())
  and (tenant_id is null or app_private.is_tenant_member(tenant_id))
);

drop policy if exists user_preferences_self_insert on public.user_preferences;
create policy user_preferences_self_insert
on public.user_preferences
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (tenant_id is null or app_private.is_tenant_member(tenant_id))
);

drop policy if exists user_preferences_self_update on public.user_preferences;
create policy user_preferences_self_update
on public.user_preferences
for update
to authenticated
using (
  user_id = (select auth.uid())
  and (tenant_id is null or app_private.is_tenant_member(tenant_id))
)
with check (
  user_id = (select auth.uid())
  and (tenant_id is null or app_private.is_tenant_member(tenant_id))
);

drop policy if exists user_preferences_self_delete on public.user_preferences;
create policy user_preferences_self_delete
on public.user_preferences
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and (tenant_id is null or app_private.is_tenant_member(tenant_id))
);

-- ---------------------------------------------------------------------------
-- Split broad ALL write policies to reduce multiple permissive SELECT overlap
-- ---------------------------------------------------------------------------

drop policy if exists tenants_owner_admin_write on public.tenants;
drop policy if exists tenants_owner_admin_insert on public.tenants;
create policy tenants_owner_admin_insert
on public.tenants
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  or app_private.has_tenant_role(id, array['owner_admin']::public.user_role[])
);

drop policy if exists tenants_owner_admin_update on public.tenants;
create policy tenants_owner_admin_update
on public.tenants
for update
to authenticated
using (app_private.has_tenant_role(id, array['owner_admin']::public.user_role[]))
with check (app_private.has_tenant_role(id, array['owner_admin']::public.user_role[]));

drop policy if exists tenants_owner_admin_delete on public.tenants;
create policy tenants_owner_admin_delete
on public.tenants
for delete
to authenticated
using (app_private.has_tenant_role(id, array['owner_admin']::public.user_role[]));

drop policy if exists tenant_members_owner_admin_write on public.tenant_members;
create policy tenant_members_owner_admin_insert
on public.tenant_members
for insert
to authenticated
with check (app_private.has_tenant_role(tenant_id, array['owner_admin']::public.user_role[]));

create policy tenant_members_owner_admin_update
on public.tenant_members
for update
to authenticated
using (app_private.has_tenant_role(tenant_id, array['owner_admin']::public.user_role[]))
with check (app_private.has_tenant_role(tenant_id, array['owner_admin']::public.user_role[]));

create policy tenant_members_owner_admin_delete
on public.tenant_members
for delete
to authenticated
using (app_private.has_tenant_role(tenant_id, array['owner_admin']::public.user_role[]));

drop policy if exists project_members_admin_write on public.project_members;
create policy project_members_admin_insert
on public.project_members
for insert
to authenticated
with check (
  app_private.has_tenant_role(tenant_id, array['owner_admin', 'project_manager']::public.user_role[])
);

drop policy if exists project_members_admin_update on public.project_members;
create policy project_members_admin_update
on public.project_members
for update
to authenticated
using (
  app_private.has_tenant_role(tenant_id, array['owner_admin', 'project_manager']::public.user_role[])
)
with check (
  app_private.has_tenant_role(tenant_id, array['owner_admin', 'project_manager']::public.user_role[])
);

drop policy if exists project_members_admin_delete on public.project_members;
create policy project_members_admin_delete
on public.project_members
for delete
to authenticated
using (
  app_private.has_tenant_role(tenant_id, array['owner_admin', 'project_manager']::public.user_role[])
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'companies',
    'contacts',
    'leads',
    'opportunities',
    'proposals',
    'service_catalog',
    'suppliers',
    'supplier_evaluations'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_crm_write', table_name);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app_private.can_access_crm(tenant_id))',
      table_name || '_crm_insert',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (app_private.can_access_crm(tenant_id)) with check (app_private.can_access_crm(tenant_id))',
      table_name || '_crm_update',
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (app_private.can_access_crm(tenant_id))',
      table_name || '_crm_delete',
      table_name
    );
  end loop;

  foreach table_name in array array[
    'invoices',
    'payments',
    'expenses',
    'accounting_entries',
    'accounts_receivable',
    'accounts_payable',
    'accountant_packages',
    'tax_prep_items'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_finance_write', table_name);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app_private.can_access_finance(tenant_id))',
      table_name || '_finance_insert',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (app_private.can_access_finance(tenant_id)) with check (app_private.can_access_finance(tenant_id))',
      table_name || '_finance_update',
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (app_private.can_access_finance(tenant_id))',
      table_name || '_finance_delete',
      table_name
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage policy overlap reduction
-- ---------------------------------------------------------------------------

drop policy if exists public_assets_admin_write on storage.objects;

drop policy if exists public_assets_admin_insert on storage.objects;
create policy public_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'public-assets'
  and app_private.has_tenant_role(
    nullif((storage.foldername(name))[1], '')::uuid,
    array['owner_admin']::public.user_role[]
  )
);

drop policy if exists public_assets_admin_update on storage.objects;
create policy public_assets_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'public-assets'
  and app_private.has_tenant_role(
    nullif((storage.foldername(name))[1], '')::uuid,
    array['owner_admin']::public.user_role[]
  )
)
with check (
  bucket_id = 'public-assets'
  and app_private.has_tenant_role(
    nullif((storage.foldername(name))[1], '')::uuid,
    array['owner_admin']::public.user_role[]
  )
);

drop policy if exists public_assets_admin_delete on storage.objects;
create policy public_assets_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'public-assets'
  and app_private.has_tenant_role(
    nullif((storage.foldername(name))[1], '')::uuid,
    array['owner_admin']::public.user_role[]
  )
);
