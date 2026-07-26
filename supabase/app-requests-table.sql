-- Run once in Supabase SQL Editor.
-- Lets visitors request an app that isn't in the catalog yet.

create table if not exists public.app_requests (
  id uuid primary key default gen_random_uuid(),
  requested_name text not null,
  note text,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending', -- pending / added / rejected
  created_at timestamptz default now()
);

alter table public.app_requests enable row level security;

-- anyone (even logged out) can submit a request
create policy "anyone can submit a request"
  on public.app_requests for insert
  with check (true);

-- only admins can view/manage requests
create policy "admins can view requests"
  on public.app_requests for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "admins can update requests"
  on public.app_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "admins can delete requests"
  on public.app_requests for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
