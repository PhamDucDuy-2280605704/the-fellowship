-- Compact workspace dashboard counts without transferring entire tables.
create or replace function public.workspace_overview_stats(p_workspace_id uuid)
returns table(
  active_member_count bigint,
  goal_count bigint,
  quest_count bigint,
  completed_quest_count bigint,
  active_note_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_active_workspace_member(p_workspace_id) then
    raise exception 'Active workspace membership required' using errcode = '42501';
  end if;
  return query
  select
    (select count(*) from public.workspace_members m where m.workspace_id=p_workspace_id and m.status='active'),
    (select count(*) from public.goals g where g.workspace_id=p_workspace_id),
    (select count(*) from public.quests q where q.workspace_id=p_workspace_id),
    (select count(*) from public.quests q where q.workspace_id=p_workspace_id and q.status='done'),
    (select count(*) from public.notes n where n.workspace_id=p_workspace_id and n.archived_at is null);
end;
$$;
revoke all on function public.workspace_overview_stats(uuid) from public, anon;
grant execute on function public.workspace_overview_stats(uuid) to authenticated;
