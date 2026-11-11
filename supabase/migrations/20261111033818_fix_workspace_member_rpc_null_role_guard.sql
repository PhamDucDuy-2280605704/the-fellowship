-- Reject callers with no active workspace role before evaluating privileged member actions.
-- SQL three-valued logic makes NULL NOT IN (...) evaluate to NULL, not TRUE.

create or replace function private.update_workspace_member_role(
  p_workspace_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_role text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select role into v_actor_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = (select auth.uid())
    and status = 'active';

  if not coalesce(v_actor_role in ('owner','admin'), false)
     and not private.is_platform_admin() then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('admin','member','viewer') then
    raise exception 'Invalid workspace role.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id and role = 'owner'
  ) then
    raise exception 'The workspace owner role is protected.' using errcode = '42501';
  end if;

  if p_role = 'admin'
     and not coalesce(v_actor_role = 'owner', false)
     and not private.is_platform_admin() then
    raise exception 'Only the owner can promote a workspace admin.' using errcode = '42501';
  end if;

  update public.workspace_members
  set role = p_role
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and status = 'active';

  if not found then
    raise exception 'Active member not found.' using errcode = 'P0002';
  end if;
end;
$function$;

create or replace function private.remove_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_role text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select role into v_actor_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = (select auth.uid())
    and status = 'active';

  if not coalesce(v_actor_role in ('owner','admin'), false)
     and not private.is_platform_admin() then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id and role = 'owner'
  ) then
    raise exception 'The workspace owner cannot be removed.' using errcode = '42501';
  end if;

  if coalesce(v_actor_role = 'admin', false) and exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id and role = 'admin'
  ) then
    raise exception 'An admin cannot remove another admin.' using errcode = '42501';
  end if;

  update public.workspace_members
  set status = 'removed'
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and status = 'active';

  if not found then
    raise exception 'Active member not found.' using errcode = 'P0002';
  end if;
end;
$function$;

create or replace function private.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role text,
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation_id uuid;
  v_is_owner boolean;
begin
  if (select auth.uid()) is null
     or not private.has_workspace_role(p_workspace_id, array['owner','admin']) then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;

  if p_email is null
     or char_length(btrim(p_email)) > 254
     or lower(btrim(p_email)) !~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' then
    raise exception 'A valid email address is required.' using errcode = '22023';
  end if;

  if p_role is null or p_role not in ('admin','member','viewer') then
    raise exception 'Invalid workspace role.' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = 'owner'
  ) or private.is_platform_admin() into v_is_owner;

  if p_role = 'admin' and not v_is_owner then
    raise exception 'Only the workspace owner can invite an admin.' using errcode = '42501';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid invitation token.' using errcode = '22023';
  end if;

  insert into public.workspace_invitations(workspace_id,email,role,token_hash,invited_by)
  values(p_workspace_id,lower(btrim(p_email)),p_role,p_token_hash,(select auth.uid()))
  returning id into v_invitation_id;

  return v_invitation_id;
end;
$function$;

revoke all on function private.update_workspace_member_role(uuid,uuid,text) from public, anon;
revoke all on function private.remove_workspace_member(uuid,uuid) from public, anon;
revoke all on function private.create_workspace_invitation(uuid,text,text,text) from public, anon;
grant execute on function private.update_workspace_member_role(uuid,uuid,text) to authenticated;
grant execute on function private.remove_workspace_member(uuid,uuid) to authenticated;
grant execute on function private.create_workspace_invitation(uuid,text,text,text) to authenticated;