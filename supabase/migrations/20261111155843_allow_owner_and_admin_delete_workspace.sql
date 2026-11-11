-- Allow an account to permanently delete only the workspace it created and still owns.
-- Platform Admins may permanently delete any workspace.
-- All workspace-owned records are removed through the existing ON DELETE CASCADE foreign keys.

create or replace function private.delete_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_created_by uuid;
  v_role text;
  v_is_admin boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  if p_workspace_id is null then
    raise exception 'A workspace is required.' using errcode = '22004';
  end if;

  if not private.is_platform_user_active() then
    raise exception 'An active platform account is required.' using errcode = '42501';
  end if;

  v_is_admin := private.is_platform_admin();

  -- Lock the workspace row so its identity cannot change during authorization/deletion.
  select workspace.created_by
    into v_created_by
    from public.workspaces as workspace
   where workspace.id = p_workspace_id
   for update;

  if not found then
    raise exception 'Workspace not found.' using errcode = 'P0002';
  end if;

  if not v_is_admin then
    -- A regular account may delete only the workspace created by that same account.
    if v_created_by is distinct from v_user_id then
      raise exception 'You may only delete a workspace created by your own account.'
        using errcode = '42501';
    end if;

    -- The creator must still be the active workspace Owner.
    select member.role
      into v_role
      from public.workspace_members as member
     where member.workspace_id = p_workspace_id
       and member.user_id = v_user_id
       and member.status = 'active'
     for update;

    if v_role is distinct from 'owner' then
      raise exception 'Active workspace Owner access is required to delete this workspace.'
        using errcode = '42501';
    end if;
  end if;

  delete from public.workspaces
   where id = p_workspace_id;

  if not found then
    raise exception 'Workspace not found.' using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function private.delete_workspace(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.delete_workspace(uuid) to authenticated;

create or replace function public.delete_workspace(p_workspace_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.delete_workspace(p_workspace_id);
$function$;

revoke all on function public.delete_workspace(uuid) from public, anon, authenticated;
grant execute on function public.delete_workspace(uuid) to authenticated;

comment on function private.delete_workspace(uuid) is
  'Permanently deletes a workspace. Only its active creator-Owner or a Platform Admin may invoke it.';
