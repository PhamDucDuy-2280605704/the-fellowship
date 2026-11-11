-- Protect voter identities and expose only aggregate ballot summaries.
create or replace function public.cast_council_vote(
  p_workspace_id uuid,
  p_proposal_id uuid,
  p_option_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.is_active_workspace_member(p_workspace_id) then
    raise exception 'Active workspace membership required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.council_proposals p
    join public.council_options o
      on o.proposal_id = p.id and o.workspace_id = p.workspace_id
    where p.id = p_proposal_id and p.workspace_id = p_workspace_id
      and o.id = p_option_id and p.status = 'voting'
      and (p.closes_at is null or p.closes_at > now())
  ) then
    raise exception 'Voting is closed or the selected option is invalid' using errcode = '22023';
  end if;
  insert into public.council_votes(workspace_id,proposal_id,option_id,user_id)
  values(p_workspace_id,p_proposal_id,p_option_id,v_user_id)
  on conflict (proposal_id,user_id) do update
    set option_id = excluded.option_id, updated_at = now();
end;
$$;
revoke all on function public.cast_council_vote(uuid,uuid,uuid) from public, anon;
grant execute on function public.cast_council_vote(uuid,uuid,uuid) to authenticated;

create or replace function public.list_council_vote_summary(p_workspace_id uuid)
returns table(proposal_id uuid, option_id uuid, vote_count bigint, has_my_vote boolean)
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
  select v.proposal_id, v.option_id, count(*)::bigint,
    bool_or(v.user_id = auth.uid())
  from public.council_votes v
  where v.workspace_id = p_workspace_id
  group by v.proposal_id, v.option_id;
end;
$$;
revoke all on function public.list_council_vote_summary(uuid) from public, anon;
grant execute on function public.list_council_vote_summary(uuid) to authenticated;

revoke all on public.council_votes from public, anon, authenticated;
