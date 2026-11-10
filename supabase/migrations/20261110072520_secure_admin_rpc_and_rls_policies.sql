-- Harden platform-admin SQL routines.
-- Privileged routines live in the unexposed private schema; public wrappers execute as the caller.

alter table private.platform_admins disable row level security;
alter table private.platform_user_status disable row level security;

create index if not exists platform_user_status_updated_by_idx
  on private.platform_user_status (updated_by);

grant usage on schema private to authenticated;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from private.platform_admins as admins
    where admins.user_id = (select auth.uid())
  );
$function$;

create or replace function private.is_platform_user_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select not exists (
    select 1
    from private.platform_user_status as status
    where status.user_id = (select auth.uid())
      and status.is_suspended = true
  );
$function$;

create or replace function private.admin_list_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_suspended boolean,
  suspension_reason text,
  platform_role text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not private.is_platform_admin() then
    raise exception 'Platform administrator access required.'
      using errcode = '42501';
  end if;

  return query
  select
    users.id,
    users.email::text,
    coalesce(profiles.display_name, ''),
    users.created_at,
    users.last_sign_in_at,
    users.email_confirmed_at,
    coalesce(status.is_suspended, false),
    status.suspension_reason,
    case when admins.user_id is not null then 'admin' else 'user' end::text
  from auth.users as users
  left join public.profiles as profiles on profiles.id = users.id
  left join private.platform_user_status as status on status.user_id = users.id
  left join private.platform_admins as admins on admins.user_id = users.id
  order by users.created_at desc;
end;
$function$;

create or replace function private.admin_list_workspaces()
returns table (
  workspace_id uuid,
  name text,
  slug text,
  description text,
  created_at timestamptz,
  created_by uuid,
  creator_email text,
  active_member_count bigint,
  is_archived boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not private.is_platform_admin() then
    raise exception 'Platform administrator access required.'
      using errcode = '42501';
  end if;

  return query
  select
    workspaces.id,
    workspaces.name,
    workspaces.slug,
    workspaces.description,
    workspaces.created_at,
    workspaces.created_by,
    users.email::text,
    count(members.user_id) filter (where members.status = 'active'),
    workspaces.archived_at is not null
  from public.workspaces as workspaces
  left join auth.users as users on users.id = workspaces.created_by
  left join public.workspace_members as members on members.workspace_id = workspaces.id
  group by workspaces.id, users.email
  order by workspaces.created_at desc;
end;
$function$;

create or replace function private.admin_set_user_suspension(
  p_user_id uuid,
  p_is_suspended boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_platform_admin() then
    raise exception 'Platform administrator access required.'
      using errcode = '42501';
  end if;

  if p_user_id is null or p_is_suspended is null then
    raise exception 'A user and suspension state are required.'
      using errcode = '22004';
  end if;

  if exists (
    select 1
    from private.platform_admins as admins
    where admins.user_id = p_user_id
  ) then
    raise exception 'The platform administrator cannot suspend their own account.'
      using errcode = '42501';
  end if;

  if p_reason is not null and char_length(p_reason) > 500 then
    raise exception 'Suspension reason must be 500 characters or fewer.'
      using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found.'
      using errcode = 'P0002';
  end if;

  insert into private.platform_user_status (
    user_id,
    is_suspended,
    suspension_reason,
    updated_at,
    updated_by
  )
  values (
    p_user_id,
    p_is_suspended,
    case when p_is_suspended then nullif(pg_catalog.btrim(p_reason), '') else null end,
    pg_catalog.now(),
    (select auth.uid())
  )
  on conflict (user_id) do update
  set
    is_suspended = excluded.is_suspended,
    suspension_reason = excluded.suspension_reason,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;
end;
$function$;

create or replace function private.admin_set_workspace_archived(
  p_workspace_id uuid,
  p_is_archived boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_platform_admin() then
    raise exception 'Platform administrator access required.'
      using errcode = '42501';
  end if;

  if p_workspace_id is null or p_is_archived is null then
    raise exception 'A workspace and archive state are required.'
      using errcode = '22004';
  end if;

  update public.workspaces
  set archived_at = case
    when p_is_archived then coalesce(archived_at, pg_catalog.now())
    else null
  end
  where id = p_workspace_id;

  if not found then
    raise exception 'Workspace not found.'
      using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function private.is_platform_admin() from public, anon, authenticated;
revoke all on function private.is_platform_user_active() from public, anon, authenticated;
revoke all on function private.admin_list_users() from public, anon, authenticated;
revoke all on function private.admin_list_workspaces() from public, anon, authenticated;
revoke all on function private.admin_set_user_suspension(uuid, boolean, text) from public, anon, authenticated;
revoke all on function private.admin_set_workspace_archived(uuid, boolean) from public, anon, authenticated;

grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.is_platform_user_active() to authenticated;
grant execute on function private.admin_list_users() to authenticated;
grant execute on function private.admin_list_workspaces() to authenticated;
grant execute on function private.admin_set_user_suspension(uuid, boolean, text) to authenticated;
grant execute on function private.admin_set_workspace_archived(uuid, boolean) to authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.is_platform_admin();
$function$;

create or replace function public.is_platform_user_active()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.is_platform_user_active();
$function$;

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_suspended boolean,
  suspension_reason text,
  platform_role text
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from private.admin_list_users();
$function$;

create or replace function public.admin_list_workspaces()
returns table (
  workspace_id uuid,
  name text,
  slug text,
  description text,
  created_at timestamptz,
  created_by uuid,
  creator_email text,
  active_member_count bigint,
  is_archived boolean
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from private.admin_list_workspaces();
$function$;

create or replace function public.admin_set_user_suspension(
  p_user_id uuid,
  p_is_suspended boolean,
  p_reason text default null
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.admin_set_user_suspension(p_user_id, p_is_suspended, p_reason);
$function$;

create or replace function public.admin_set_workspace_archived(
  p_workspace_id uuid,
  p_is_archived boolean
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.admin_set_workspace_archived(p_workspace_id, p_is_archived);
$function$;

drop policy if exists profiles_select_platform_admin on public.profiles;
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.is_platform_admin())
);

drop policy if exists workspaces_select_platform_admin on public.workspaces;
drop policy if exists workspaces_select_active_members on public.workspaces;
create policy workspaces_select_active_members
on public.workspaces
for select
to authenticated
using (
  (select public.is_platform_admin())
  or exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = workspaces.id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  )
);

drop policy if exists workspaces_update_platform_admin on public.workspaces;
drop policy if exists workspaces_update_owner_admin on public.workspaces;
create policy workspaces_update_owner_admin
on public.workspaces
for update
to authenticated
using (
  (select public.is_platform_admin())
  or exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = workspaces.id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
)
with check (
  (select public.is_platform_admin())
  or exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = workspaces.id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
);

drop policy if exists workspace_members_select_platform_admin on public.workspace_members;
drop policy if exists workspace_members_select_self on public.workspace_members;
create policy workspace_members_select_self
on public.workspace_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_platform_admin())
);

revoke all on function public.is_platform_admin() from public, anon, authenticated;
revoke all on function public.is_platform_user_active() from public, anon, authenticated;
revoke all on function public.admin_list_users() from public, anon, authenticated;
revoke all on function public.admin_list_workspaces() from public, anon, authenticated;
revoke all on function public.admin_set_user_suspension(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_set_workspace_archived(uuid, boolean) from public, anon, authenticated;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_user_active() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_list_workspaces() to authenticated;
grant execute on function public.admin_set_user_suspension(uuid, boolean, text) to authenticated;
grant execute on function public.admin_set_workspace_archived(uuid, boolean) to authenticated;
