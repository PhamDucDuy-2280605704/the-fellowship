create or replace function private.is_active_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
 select private.is_platform_admin() or exists (
  select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id
  where m.workspace_id=p_workspace_id and m.user_id=(select auth.uid()) and m.status='active' and w.archived_at is null
 );
$function$;
create or replace function private.has_workspace_role(p_workspace_id uuid,p_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $function$
 select private.is_platform_admin() or exists (
  select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id
  where m.workspace_id=p_workspace_id and m.user_id=(select auth.uid()) and m.status='active' and m.role=any(p_roles) and w.archived_at is null
 );
$function$;
revoke all on function private.is_active_workspace_member(uuid) from public,anon,authenticated;
revoke all on function private.has_workspace_role(uuid,text[]) from public,anon,authenticated;
grant execute on function private.is_active_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid,text[]) to authenticated;
drop policy if exists workspaces_select_active_members on public.workspaces;
create policy workspaces_select_active_members on public.workspaces for select to authenticated using (
 private.is_platform_admin() or (archived_at is null and exists (
  select 1 from public.workspace_members m where m.workspace_id=workspaces.id and m.user_id=(select auth.uid()) and m.status='active'
 ))
);
drop policy if exists workspaces_update_owner_admin on public.workspaces;
create policy workspaces_update_owner_admin on public.workspaces for update to authenticated
using (private.is_platform_admin() or (archived_at is null and exists (
 select 1 from public.workspace_members m where m.workspace_id=workspaces.id and m.user_id=(select auth.uid()) and m.status='active' and m.role=any(array['owner','admin']::text[])
)))
with check (private.is_platform_admin() or (archived_at is null and exists (
 select 1 from public.workspace_members m where m.workspace_id=workspaces.id and m.user_id=(select auth.uid()) and m.status='active' and m.role=any(array['owner','admin']::text[])
)));
create or replace function private.admin_list_workspace_members(p_workspace_id uuid)
returns table(user_id uuid,email text,display_name text,workspace_role text,membership_status text,joined_at timestamptz,is_suspended boolean)
language plpgsql stable security definer set search_path = ''
as $function$
begin
 if not private.is_platform_admin() then raise exception 'Platform administrator access required.' using errcode='42501'; end if;
 if p_workspace_id is null or not exists(select 1 from public.workspaces where id=p_workspace_id) then raise exception 'Workspace not found.' using errcode='P0002'; end if;
 return query select m.user_id,u.email::text,coalesce(p.display_name,''),m.role,m.status,m.joined_at,coalesce(s.is_suspended,false)
 from public.workspace_members m join auth.users u on u.id=m.user_id
 left join public.profiles p on p.id=m.user_id left join private.platform_user_status s on s.user_id=m.user_id
 where m.workspace_id=p_workspace_id order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,m.joined_at asc;
end;
$function$;
revoke all on function private.admin_list_workspace_members(uuid) from public,anon,authenticated;
grant execute on function private.admin_list_workspace_members(uuid) to authenticated;
create or replace function public.admin_list_workspace_members(p_workspace_id uuid)
returns table(user_id uuid,email text,display_name text,workspace_role text,membership_status text,joined_at timestamptz,is_suspended boolean)
language sql stable security invoker set search_path = ''
as $function$ select * from private.admin_list_workspace_members(p_workspace_id); $function$;
revoke all on function public.admin_list_workspace_members(uuid) from public,anon,authenticated;
grant execute on function public.admin_list_workspace_members(uuid) to authenticated;
