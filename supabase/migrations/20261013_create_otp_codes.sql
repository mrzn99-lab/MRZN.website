-- supabase/migrations/20261013_create_otp_codes.sql
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create index if not exists otp_codes_email_idx
  on public.otp_codes (email);

create index if not exists otp_codes_email_expires_idx
  on public.otp_codes (email, expires_at);
