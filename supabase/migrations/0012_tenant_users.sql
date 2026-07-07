create table if not exists public.tenant_users (
    id uuid default gen_random_uuid() primary key,
    auth_user_id uuid references auth.users(id) on delete cascade,
    email text not null,
    role text not null default 'viewer',
    status text not null default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.tenant_users enable row level security;

-- Policies
create policy "Admins can view all tenant users"
on public.tenant_users
for select
to authenticated
using (
    exists (
        select 1 from public.tenant_users tu 
        where tu.auth_user_id = auth.uid() 
        and tu.role in ('owner_admin', 'admin')
    )
    or auth_user_id = auth.uid()
);

create policy "Admins can insert tenant users"
on public.tenant_users
for insert
to authenticated
with check (
    exists (
        select 1 from public.tenant_users tu 
        where tu.auth_user_id = auth.uid() 
        and tu.role in ('owner_admin', 'admin')
    )
);

create policy "Admins can update tenant users"
on public.tenant_users
for update
to authenticated
using (
    exists (
        select 1 from public.tenant_users tu 
        where tu.auth_user_id = auth.uid() 
        and tu.role in ('owner_admin', 'admin')
    )
);

create policy "Admins can delete tenant users"
on public.tenant_users
for delete
to authenticated
using (
    exists (
        select 1 from public.tenant_users tu 
        where tu.auth_user_id = auth.uid() 
        and tu.role in ('owner_admin', 'admin')
    )
);
