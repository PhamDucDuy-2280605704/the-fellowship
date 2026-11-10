-- Activity timeline and workspace membership lifecycle.
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('goal','quest','note','proposal')),
  entity_id uuid not null,
  action text not null check (action in ('created','updated','status_changed')),
  title text not null default '',
  created_at timestamptz not null default pg_catalog.now()
);
create index activity_events_workspace_time_idx on public.activity_events(workspace_id,created_at desc);
alter table public.activity_events enable row level security;
revoke all on table public.activity_events from public,anon,authenticated;
grant select on table public.activity_events to authenticated;
create policy activity_events_select_workspace
on public.activity_events for select to authenticated
using (private.is_active_workspace_member(workspace_id));

create or replace function private.log_workspace_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_new jsonb := pg_catalog.to_jsonb(new);
  v_old jsonb;
  v_workspace_id uuid;
  v_entity_id uuid;
  v_actor_id uuid;
  v_entity_type text;
  v_action text;
  v_title text;
begin
  if tg_op = 'UPDATE' then v_old := pg_catalog.to_jsonb(old); end if;
  v_workspace_id := (v_new ->> 'workspace_id')::uuid;
  v_entity_id := (v_new ->> 'id')::uuid;
  v_actor_id := coalesce((select auth.uid()), nullif(v_new ->> 'created_by','')::uuid);
  v_title := coalesce(v_new ->> 'title', v_new ->> 'name', 'Workspace activity');
  v_entity_type := case tg_table_name
    when 'goals' then 'goal'
    when 'quests' then 'quest'
    when 'notes' then 'note'
    when 'council_proposals' then 'proposal'
    else null
  end;
  if v_entity_type is null or v_workspace_id is null or v_entity_id is null then return new; end if;
  if tg_op = 'INSERT' then
    v_action := 'created';
  elsif (v_old ->> 'status') is distinct from (v_new ->> 'status') then
    v_action := 'status_changed';
  else
    v_action := 'updated';
  end if;
  insert into public.activity_events(workspace_id,actor_user_id,entity_type,entity_id,action,title)
  values(v_workspace_id,v_actor_id,v_entity_type,v_entity_id,v_action,v_title);
  return new;
end;
$$;
revoke all on function private.log_workspace_activity() from public,anon,authenticated;

create trigger goals_log_activity after insert or update on public.goals
for each row execute function private.log_workspace_activity();
create trigger quests_log_activity after insert or update on public.quests
for each row execute function private.log_workspace_activity();
create trigger notes_log_activity after insert or update on public.notes
for each row execute function private.log_workspace_activity();
create trigger council_proposals_log_activity after insert or update on public.council_proposals
for each row execute function private.log_workspace_activity();

create or replace function private.leave_workspace(p_workspace_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_role text;
begin
  select role into v_role from public.workspace_members
  where workspace_id=p_workspace_id and user_id=(select auth.uid()) and status='active';
  if v_role is null then raise exception 'Active membership not found.' using errcode='P0002'; end if;
  if v_role='owner' then raise exception 'Transfer workspace ownership before leaving.' using errcode='42501'; end if;
  update public.workspace_members set status='removed'
  where workspace_id=p_workspace_id and user_id=(select auth.uid());
end;
$$;
revoke all on function private.leave_workspace(uuid) from public,anon,authenticated;
grant execute on function private.leave_workspace(uuid) to authenticated;
create or replace function public.leave_workspace(p_workspace_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.leave_workspace(p_workspace_id); $$;
revoke all on function public.leave_workspace(uuid) from public,anon,authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;

create or replace function private.list_workspace_activity(p_workspace_id uuid)
returns table(id uuid,entity_type text,entity_id uuid,action text,title text,actor_display_name text,created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_active_workspace_member(p_workspace_id) then
    raise exception 'Active workspace membership required.' using errcode='42501';
  end if;
  return query
  select e.id,e.entity_type,e.entity_id,e.action,e.title,coalesce(p.display_name,'Thành viên nhóm'),e.created_at
  from public.activity_events e
  left join public.profiles p on p.id=e.actor_user_id
  where e.workspace_id=p_workspace_id
  order by e.created_at desc
  limit 100;
end;
$$;
revoke all on function private.list_workspace_activity(uuid) from public,anon,authenticated;
grant execute on function private.list_workspace_activity(uuid) to authenticated;
create or replace function public.list_workspace_activity(p_workspace_id uuid)
returns table(id uuid,entity_type text,entity_id uuid,action text,title text,actor_display_name text,created_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_workspace_activity(p_workspace_id); $$;
revoke all on function public.list_workspace_activity(uuid) from public,anon,authenticated;
grant execute on function public.list_workspace_activity(uuid) to authenticated;

create or replace function private.list_workspace_invitations(p_workspace_id uuid)
returns table(id uuid,email text,role text,expires_at timestamptz,created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.has_workspace_role(p_workspace_id,array['owner','admin']) then
    raise exception 'Workspace manager access required.' using errcode='42501';
  end if;
  return query
  select i.id,i.email,i.role,i.expires_at,i.created_at
  from public.workspace_invitations i
  where i.workspace_id=p_workspace_id and i.accepted_at is null
    and i.revoked_at is null and i.expires_at > pg_catalog.now()
  order by i.created_at desc;
end;
$$;
revoke all on function private.list_workspace_invitations(uuid) from public,anon,authenticated;
grant execute on function private.list_workspace_invitations(uuid) to authenticated;
create or replace function public.list_workspace_invitations(p_workspace_id uuid)
returns table(id uuid,email text,role text,expires_at timestamptz,created_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_workspace_invitations(p_workspace_id); $$;
revoke all on function public.list_workspace_invitations(uuid) from public,anon,authenticated;
grant execute on function public.list_workspace_invitations(uuid) to authenticated;
