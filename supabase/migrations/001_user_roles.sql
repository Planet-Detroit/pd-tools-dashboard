-- User roles table for Planet Detroit editorial tools
-- Links to Supabase Auth users via auth.users(id)
-- Roles: admin, editor, reporter

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('admin', 'editor', 'reporter')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_roles_user_id_unique unique (user_id),
  constraint user_roles_email_unique unique (email)
);

-- Index for quick lookups by user_id (used on every auth check)
create index idx_user_roles_user_id on public.user_roles(user_id);

-- Row Level Security: only authenticated users can read roles
alter table public.user_roles enable row level security;

-- Policy: any authenticated user can read all roles (needed for editors to see reporter names)
create policy "Authenticated users can read roles"
  on public.user_roles for select
  to authenticated
  using (true);

-- Policy: only admins can insert/update/delete roles
create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Auto-update updated_at on changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_roles_updated_at
  before update on public.user_roles
  for each row execute function public.handle_updated_at();

-- Seed initial team members
-- NOTE: Run this AFTER creating the auth users via Supabase dashboard or API.
-- Replace the UUIDs below with the actual auth.users IDs after account creation.
--
-- INSERT INTO public.user_roles (user_id, email, display_name, role) VALUES
--   ('<nina-uuid>',     'nina@planetdetroit.org',     'Nina',     'admin'),
--   ('<dustin-uuid>',   'dustin@planetdetroit.org',   'Dustin',   'editor'),
--   ('<ashley-uuid>',   'ashley@planetdetroit.org',   'Ashley',   'editor'),
--   ('<brian-uuid>',    'brian@planetdetroit.org',     'Brian',    'reporter'),
--   ('<ethan-uuid>',    'ethan@planetdetroit.org',     'Ethan',    'reporter'),
--   ('<isabelle-uuid>', 'isabelle@planetdetroit.org', 'Isabelle', 'reporter');
