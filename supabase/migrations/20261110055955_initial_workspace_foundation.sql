-- The Fellowship: initial workspace foundation.
-- This project is isolated from little-story-world.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint profiles_display_name_length
    check (char_length(display_name) <= 80)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint workspaces_name_length
    check (char_length(btrim(name)) between 2 and 80),
  constraint workspaces_slug_length
    check (char_length(slug) between 3 and 48),
  constraint workspaces_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint workspaces_description_length
    check (description is null or char_length(description) <= 1000),
  constraint workspaces_slug_unique unique (slug)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  status text not null default 'active',
  joined_at timestamptz not null default pg_catalog.now(),
  created_at timestamptz not null default pg_catalog.now(),
  constraint workspace_members_pkey primary key (workspace_id, user_id),
  constraint workspace_members_role_check
    check (role in ('owner', 'admin', 'member', 'viewer')),
  constraint workspace_members_status_check
    check (status in ('active', 'removed'))
);

create index workspace_members_user_status_workspace_idx
  on public.workspace_members (user_id, status, workspace_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_display_name text;
begin
  requested_display_name :=
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Member'
    );

  insert into public.profiles (id, display_name)
  values (new.id, requested_display_name)
  on conflict (id) do nothing;

  return new;
end;
$function$;

create function private.provision_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'active');

  return new;
end;
$function$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.provision_workspace_owner() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create trigger on_workspace_created
after insert on public.workspaces
for each row execute function private.provision_workspace_owner();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy workspaces_select_active_members
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = workspaces.id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  )
);

create policy workspaces_insert_self
on public.workspaces
for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy workspaces_update_owner_admin
on public.workspaces
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = workspaces.id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = workspaces.id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
);

create policy workspace_members_select_self
on public.workspace_members
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.workspaces from public, anon, authenticated;
revoke all on table public.workspace_members from public, anon, authenticated;

grant usage on schema public to authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_path) on table public.profiles to authenticated;

grant select, insert on table public.workspaces to authenticated;
grant update (name, slug, description, archived_at)
  on table public.workspaces to authenticated;

grant select on table public.workspace_members to authenticated;

comment on table public.profiles is
  'Private profile data for The Fellowship. Authorization is never derived from profile metadata.';
comment on table public.workspaces is
  'Tenant boundary for goals, quests, membership, activity, and knowledge.';
comment on table public.workspace_members is
  'Workspace-scoped role and membership status. Direct client writes are intentionally not granted in the foundation migration.';
