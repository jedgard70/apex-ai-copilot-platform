-- CP16A - Stripe subscriptions and billing tables
-- Purpose: track Stripe customers, subscriptions, invoices and plan assignments per tenant

create type public.subscription_status as enum (
  'trialing',
  'active',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

create table public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status public.subscription_status not null default 'active',
  plan_name text not null default 'Starter',
  plan_interval text default 'month',
  plan_amount_cents integer default 0,
  plan_currency text default 'usd',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stripe_invoice_id text unique,
  stripe_customer_id text not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount_cents integer not null default 0,
  currency text default 'usd',
  status text default 'draft',
  hosted_invoice_url text,
  invoice_pdf_url text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists stripe_customers_tenant_id_idx on public.stripe_customers(tenant_id);
create index if not exists stripe_customers_user_id_idx on public.stripe_customers(user_id);
create index if not exists subscriptions_tenant_id_idx on public.subscriptions(tenant_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists invoices_tenant_id_idx on public.invoices(tenant_id);
create index if not exists invoices_subscription_id_idx on public.invoices(subscription_id);

create or replace function public.create_updated_at_trigger(table_name text)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists set_updated_at on public.%I', table_name);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
end;
$$;

select public.create_updated_at_trigger('stripe_customers');
select public.create_updated_at_trigger('subscriptions');
select public.create_updated_at_trigger('invoices');

-- RLS policies
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;

-- Users can read their own tenant's billing data
drop policy if exists "Users can read own tenant stripe customers" on public.stripe_customers;
drop policy if exists Users can read own tenant stripe customers on public.stripe_customers for select;
create policy Users can read own tenant stripe customers on public.stripe_customers for select
  to authenticated
  using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid() and tm.status = 'active'
    )
  );

drop policy if exists "Users can read own tenant subscriptions" on public.subscriptions;
drop policy if exists Users can read own tenant subscriptions on public.subscriptions for select;
create policy Users can read own tenant subscriptions on public.subscriptions for select
  to authenticated
  using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid() and tm.status = 'active'
    )
  );

drop policy if exists "Users can read own tenant invoices" on public.invoices;
drop policy if exists Users can read own tenant invoices on public.invoices for select;
create policy Users can read own tenant invoices on public.invoices for select
  to authenticated
  using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid() and tm.status = 'active'
    )
  );

-- Only server (service role) can insert/update billing records
-- No insert/update/delete policies for authenticated users on billing tables


