-- CP12A DRAFT ONLY - do not apply until reviewed against a brand-new Supabase project.
-- Purpose: production-oriented initial schema for Apex AI Copilot.
-- Safety: broad jsonb metadata is intentional for rapid studio iteration.

create extension if not exists pgcrypto;

create type public.user_role as enum (
  'owner_admin',
  'internal_team',
  'client',
  'partner',
  'viewer',
  'contractor',
  'finance',
  'sales',
  'field',
  'bim_manager',
  'project_manager'
);

create type public.evidence_level as enum (
  'CONFIRMED',
  'ASSUMPTION',
  'UNKNOWN',
  'ESTIMATED',
  'PHOTO_CONFIRMED',
  'USER_REPORTED',
  'NEEDS_LAWYER_REVIEW',
  'NEEDS_SAFETY_REVIEW',
  'GENERAL_GUIDANCE',
  'NEEDS_LOCAL_AUTHORITY'
);

create type public.source_confidence as enum (
  'CONFIRMED_SOURCE',
  'USER_PROVIDED',
  'USER_ENTERED',
  'SYSTEM_GENERATED',
  'IMPORTED_DOCUMENT',
  'ASSUMPTION',
  'PLACEHOLDER',
  'ESTIMATED_LOCAL',
  'UNKNOWN',
  'NEEDS_WEB_VERIFICATION',
  'NEEDS_ACCOUNTANT_REVIEW'
);

create type public.item_status as enum (
  'draft',
  'active',
  'open',
  'in_review',
  'submitted',
  'approved',
  'rejected',
  'needs_revision',
  'resolved',
  'done',
  'archived'
);

create type public.project_status as enum (
  'draft',
  'active',
  'on_hold',
  'completed',
  'archived'
);

create type public.severity_level as enum (
  'Low',
  'Medium',
  'High',
  'Critical'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_updated_at_trigger(table_name text)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists set_updated_at on public.%I', table_name);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
end;
$$;

-- Auth / profile / tenant
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  default_tenant_id uuid,
  status public.item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status public.item_status not null default 'active',
  plan text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.profiles
  add constraint profiles_default_tenant_fk
  foreign key (default_tenant_id) references public.tenants(id);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  role public.user_role not null unique,
  label text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  unique(role_id, permission_id)
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  status public.item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  unique(tenant_id, user_id, role)
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  project_id uuid,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_table text,
  entity_id uuid,
  evidence_level public.evidence_level default 'CONFIRMED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

-- Projects / workspace
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'active',
  language text default 'en',
  active_tool text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'viewer',
  status public.item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  unique(project_id, user_id, role)
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  file_kind text,
  source_confidence public.source_confidence default 'USER_PROVIDED',
  status public.item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  unique(bucket, storage_path)
);

create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null,
  content text not null,
  attachments jsonb not null default '[]'::jsonb,
  source_confidence public.source_confidence default 'USER_ENTERED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.project_exports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  export_type text not null,
  format text,
  storage_file_id uuid references public.project_files(id),
  status public.item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.project_activity (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_type text not null,
  summary text,
  evidence_level public.evidence_level default 'CONFIRMED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.project_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

-- Studio/session tables. Detailed studio state lives in metadata/payload columns first.
create table public.archvis_sessions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text, mode text, status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.archvis_outputs (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, session_id uuid references public.archvis_sessions(id) on delete cascade, output_type text, prompt text, negative_prompt text, source_file_id uuid references public.project_files(id), generated_file_id uuid references public.project_files(id), source_confidence public.source_confidence default 'SYSTEM_GENERATED', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.archvis_prompts (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, session_id uuid references public.archvis_sessions(id) on delete cascade, prompt text not null, negative_prompt text, style text, camera text, source_confidence public.source_confidence default 'SYSTEM_GENERATED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.archvis_revision_constraints (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, session_id uuid references public.archvis_sessions(id) on delete cascade, constraint_text text not null, locked boolean not null default true, evidence_level public.evidence_level default 'USER_REPORTED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.archvis_gallery_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, session_id uuid references public.archvis_sessions(id) on delete cascade, output_id uuid references public.archvis_outputs(id) on delete set null, file_id uuid references public.project_files(id), prompt text, negative_prompt text, status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.directcut_sessions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text, video_mode text, status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.directcut_plans (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, session_id uuid references public.directcut_sessions(id) on delete cascade, title text, objective text, duration_seconds integer, aspect_ratio text, provider_status text default 'planning-only', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.directcut_scenes (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, plan_id uuid references public.directcut_plans(id) on delete cascade, scene_order integer not null default 0, title text, description text, camera_movement text, evidence_level public.evidence_level default 'ASSUMPTION', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.directcut_storyboards (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, plan_id uuid references public.directcut_plans(id) on delete cascade, script text, prompt text, negative_prompt text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.directcut_gallery_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, session_id uuid references public.directcut_sessions(id) on delete cascade, plan_id uuid references public.directcut_plans(id) on delete set null, file_id uuid references public.project_files(id), provider_status text default 'planning-only', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.bim_models (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, file_id uuid references public.project_files(id), format text, viewer_status text, parser_status text, evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_viewer_sessions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, model_id uuid references public.bim_models(id) on delete cascade, viewer_state jsonb not null default '{}'::jsonb, status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_findings (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, model_id uuid references public.bim_models(id) on delete cascade, title text not null, description text, category text, severity public.severity_level default 'Medium', evidence_level public.evidence_level default 'UNKNOWN', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_corrections (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, finding_id uuid references public.bim_findings(id) on delete set null, title text not null, description text, priority public.severity_level default 'Medium', evidence_level public.evidence_level default 'UNKNOWN', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_saved_views (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, model_id uuid references public.bim_models(id) on delete cascade, name text not null, description text, camera_state jsonb not null default '{}'::jsonb, purpose text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_tours (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, model_id uuid references public.bim_models(id) on delete cascade, title text, objective text, tour_steps jsonb not null default '[]'::jsonb, narration text, provider_status text default 'planning-only', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_animation_paths (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, tour_id uuid references public.bim_tours(id) on delete cascade, keyframes jsonb not null default '[]'::jsonb, provider_status text default 'planning-only', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.bim_export_briefs (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, model_id uuid references public.bim_models(id) on delete cascade, target text not null, brief text, provider_status text default 'planning-only', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

-- Business, operations, knowledge, metrics and planning tables use compact columns plus metadata.
create table public.budget_estimates (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text not null, currency text default 'USD', total numeric(14,2), source_confidence public.source_confidence default 'PLACEHOLDER', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.budget_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, estimate_id uuid references public.budget_estimates(id) on delete cascade, item text not null, unit text, quantity numeric(14,4), unit_price numeric(14,2), subtotal numeric(14,2), source_confidence public.source_confidence default 'PLACEHOLDER', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.budget_scope_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, estimate_id uuid references public.budget_estimates(id) on delete cascade, scope_type text not null, description text not null, status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.pricing_sources (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, source_name text not null, source_type text, source_date date, source_confidence public.source_confidence default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.sinapi_sources (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, file_id uuid references public.project_files(id), region text, source_date date, source_confidence public.source_confidence default 'USER_PROVIDED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.evm_records (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, pv numeric(14,2), ev numeric(14,2), ac numeric(14,2), cpi numeric(10,4), spi numeric(10,4), eac numeric(14,2), evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.schedule_tasks (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text not null, start_date date, end_date date, progress_percent numeric(5,2), responsible_party text, evidence_level public.evidence_level default 'UNKNOWN', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.schedule_dependencies (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, predecessor_task_id uuid references public.schedule_tasks(id) on delete cascade, successor_task_id uuid references public.schedule_tasks(id) on delete cascade, dependency_type text default 'finish-to-start', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.milestones (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text not null, due_date date, status public.item_status default 'open', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

-- Generic create pattern for the remaining domain tables.
create table public.contracts (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, document_type text, status public.item_status default 'draft', source_confidence public.source_confidence default 'USER_PROVIDED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.contract_clauses (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, contract_id uuid references public.contracts(id) on delete cascade, title text, clause_text text, evidence_level public.evidence_level default 'UNKNOWN', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.contract_risks (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, contract_id uuid references public.contracts(id) on delete cascade, issue text not null, severity public.severity_level default 'Medium', evidence_level public.evidence_level default 'NEEDS_LAWYER_REVIEW', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.permit_packages (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, region text, jurisdiction text, package_type text, status public.item_status default 'draft', evidence_level public.evidence_level default 'GENERAL_GUIDANCE', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.permit_documents (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, package_id uuid references public.permit_packages(id) on delete cascade, document_name text not null, responsible_party text, status public.item_status default 'draft', evidence_level public.evidence_level default 'NEEDS_LOCAL_AUTHORITY', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.permit_checklists (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, package_id uuid references public.permit_packages(id) on delete cascade, category text, item text not null, status public.item_status default 'open', evidence_level public.evidence_level default 'NEEDS_LOCAL_AUTHORITY', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.document_trackers (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, document_name text not null, responsible_party text, due_date date, status public.item_status default 'open', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.rdos (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, report_date date not null default current_date, weather text, status public.item_status default 'draft', evidence_level public.evidence_level default 'USER_REPORTED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.rdo_activities (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, rdo_id uuid references public.rdos(id) on delete cascade, activity text not null, responsible_party text, evidence_level public.evidence_level default 'USER_REPORTED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.field_photos (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, file_id uuid references public.project_files(id), caption text, location text, evidence_level public.evidence_level default 'PHOTO_CONFIRMED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.field_issues (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, title text not null, location text, severity public.severity_level default 'Medium', evidence_level public.evidence_level default 'UNKNOWN', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.punch_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, title text not null, location text, severity public.severity_level default 'Medium', status public.item_status default 'open', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.safety_checklists (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, checklist_date date default current_date, risk_level public.severity_level default 'Medium', evidence_level public.evidence_level default 'USER_REPORTED', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.quality_checklists (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, checklist_date date default current_date, evidence_level public.evidence_level default 'USER_REPORTED', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.nr_compliance_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, nr_code text not null, item text not null, evidence_level public.evidence_level default 'GENERAL_GUIDANCE', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.corrective_actions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, responsible_party text, due_date date, severity public.severity_level default 'Medium', evidence_level public.evidence_level default 'UNKNOWN', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.research_sessions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, query text not null, research_type text, provider_status text default 'web-not-connected', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.research_findings (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, session_id uuid references public.research_sessions(id) on delete cascade, claim text not null, source_confidence public.source_confidence default 'NEEDS_WEB_VERIFICATION', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.source_evidence (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, source_title text not null, source_url text, checked_at timestamptz, source_confidence public.source_confidence default 'NEEDS_WEB_VERIFICATION', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.market_reports (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, report text, source_confidence public.source_confidence default 'ASSUMPTION', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.proposal_outputs (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, content text, status public.item_status default 'draft', source_confidence public.source_confidence default 'SYSTEM_GENERATED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.companies (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, company_type text, status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.contacts (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, company_id uuid references public.companies(id) on delete set null, name text not null, email text, phone text, status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.leads (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, contact_id uuid references public.contacts(id) on delete set null, source text, status public.item_status default 'open', expected_value numeric(14,2), currency text default 'USD', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.opportunities (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, company_id uuid references public.companies(id) on delete set null, contact_id uuid references public.contacts(id) on delete set null, stage text default 'New Lead', expected_value numeric(14,2), probability numeric(5,2), currency text default 'USD', status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.proposals (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, opportunity_id uuid references public.opportunities(id) on delete set null, title text not null, amount numeric(14,2), currency text default 'USD', status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.service_catalog (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, category text, base_price numeric(14,2), currency text default 'USD', source_confidence public.source_confidence default 'PLACEHOLDER', status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.invoices (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, company_id uuid references public.companies(id) on delete set null, invoice_number text, amount numeric(14,2), currency text default 'USD', due_date date, status public.item_status default 'draft', source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.payments (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, invoice_id uuid references public.invoices(id) on delete set null, amount numeric(14,2), currency text default 'USD', paid_at timestamptz, status public.item_status default 'draft', source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.expenses (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, vendor_company_id uuid references public.companies(id) on delete set null, amount numeric(14,2), currency text default 'USD', expense_date date, tax_category text, source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.accounting_entries (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, entry_date date not null default current_date, account_code text, debit numeric(14,2), credit numeric(14,2), source_confidence public.source_confidence default 'NEEDS_ACCOUNTANT_REVIEW', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.accounts_receivable (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, invoice_id uuid references public.invoices(id) on delete set null, amount numeric(14,2), due_date date, status public.item_status default 'open', source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.accounts_payable (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, expense_id uuid references public.expenses(id) on delete set null, amount numeric(14,2), due_date date, status public.item_status default 'open', source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.accountant_packages (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, period_start date, period_end date, status public.item_status default 'draft', source_confidence public.source_confidence default 'NEEDS_ACCOUNTANT_REVIEW', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.tax_prep_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, item text not null, tax_category text, status public.item_status default 'open', source_confidence public.source_confidence default 'NEEDS_ACCOUNTANT_REVIEW', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.suppliers (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, category text, region text, rating numeric(3,2), status public.item_status default 'active', source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.procurement_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, supplier_id uuid references public.suppliers(id) on delete set null, item text not null, quantity numeric(14,4), unit text, required_date date, status public.item_status default 'open', source_confidence public.source_confidence default 'PLACEHOLDER', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.supplier_evaluations (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, supplier_id uuid references public.suppliers(id) on delete cascade, evaluation_date date default current_date, score numeric(5,2), source_confidence public.source_confidence default 'USER_ENTERED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.alerts (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, description text, severity public.severity_level default 'Medium', due_date date, status public.item_status default 'open', evidence_level public.evidence_level default 'USER_REPORTED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.ai_usage_records (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, module text not null, model text, request_count integer default 1, estimated_tokens integer, estimated_cost numeric(14,6), source_confidence public.source_confidence default 'ESTIMATED_LOCAL', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.ai_cost_thresholds (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, threshold_name text not null, amount numeric(14,2), currency text default 'USD', status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.knowledge_items (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, source_type text not null, domain text, scope text not null default 'project', approved_by uuid references auth.users(id), source_confidence public.source_confidence default 'USER_PROVIDED', status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.skill_updates (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, source_file_id uuid references public.project_files(id), update_id text, target_domain text, approval_type text, status public.item_status default 'draft', source_confidence public.source_confidence default 'USER_PROVIDED', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.skill_exports (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, target_platform text not null, format text, export_file_id uuid references public.project_files(id), status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.platform_audits (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, audit_type text, status public.item_status default 'draft', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.devops_tasks (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, title text not null, task_type text, status public.item_status default 'open', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.repo_reviews (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, repo_url text, title text not null, status public.item_status default 'draft', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

create table public.digital_twin_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text not null, linked_model_id uuid references public.bim_models(id) on delete set null, provider_status text default 'planning-only/local-model-state', status public.item_status default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.twin_events (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, twin_id uuid references public.digital_twin_items(id) on delete cascade, event_type text not null, evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.metrics_records (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, metric_name text not null, metric_value numeric(18,6), source_confidence public.source_confidence default 'ESTIMATED_LOCAL', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.health_checks (id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, check_name text not null, status public.item_status default 'open', evidence_level public.evidence_level default 'UNKNOWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.pwa_settings (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, install_status text default 'not-validated', offline_plan jsonb not null default '{}'::jsonb, status public.item_status default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);
create table public.sync_queue_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade, operation text not null, payload jsonb not null default '{}'::jsonb, status public.item_status default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), metadata jsonb not null default '{}'::jsonb);

-- Seed role labels only. Permissions remain review-specific.
insert into public.roles(role, label, description) values
  ('owner_admin', 'Owner/Admin', 'Tenant owner and administrator'),
  ('internal_team', 'Internal Team', 'Internal Apex production team'),
  ('client', 'Client', 'Client workspace user'),
  ('partner', 'Partner', 'Partner collaborator'),
  ('viewer', 'Viewer', 'Read-only project viewer'),
  ('contractor', 'Contractor', 'Assigned contractor'),
  ('finance', 'Finance', 'Finance and accounting user'),
  ('sales', 'Sales', 'CRM and sales user'),
  ('field', 'Field', 'Field operations user'),
  ('bim_manager', 'BIM Manager', 'BIM and model coordination user'),
  ('project_manager', 'Project Manager', 'Project delivery manager')
on conflict (role) do nothing;

-- Indexes: broad tenant/project/user/status access paths for first production review.
do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not in ('schema_migrations')
  loop
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'tenant_id') then
      execute format('create index if not exists %I on public.%I(tenant_id)', t || '_tenant_id_idx', t);
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'project_id') then
      execute format('create index if not exists %I on public.%I(project_id)', t || '_project_id_idx', t);
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'created_by') then
      execute format('create index if not exists %I on public.%I(created_by)', t || '_created_by_idx', t);
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'status') then
      execute format('create index if not exists %I on public.%I(status)', t || '_status_idx', t);
    end if;
    perform public.create_updated_at_trigger(t);
  end loop;
end $$;
