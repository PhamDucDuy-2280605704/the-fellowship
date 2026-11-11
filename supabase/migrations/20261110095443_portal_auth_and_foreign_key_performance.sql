-- Covers every foreign key reported by the Supabase Performance Advisor.
-- These are additive indexes: no data is deleted or rewritten.
create index if not exists activity_events_actor_user_id_idx
  on public.activity_events (actor_user_id);
create index if not exists council_decisions_chosen_option_idx
  on public.council_decisions (chosen_option_id, proposal_id, workspace_id);
create index if not exists council_decisions_decided_by_idx
  on public.council_decisions (decided_by);
create index if not exists council_decisions_proposal_workspace_idx
  on public.council_decisions (proposal_id, workspace_id);
create index if not exists council_options_proposal_workspace_idx
  on public.council_options (proposal_id, workspace_id);
create index if not exists council_proposals_created_by_idx
  on public.council_proposals (created_by);
create index if not exists council_votes_option_proposal_workspace_idx
  on public.council_votes (option_id, proposal_id, workspace_id);
create index if not exists council_votes_proposal_workspace_idx
  on public.council_votes (proposal_id, workspace_id);
create index if not exists council_votes_user_id_idx
  on public.council_votes (user_id);
create index if not exists goals_created_by_idx
  on public.goals (created_by);
create index if not exists notes_created_by_idx
  on public.notes (created_by);
create index if not exists quest_assignees_assigned_by_idx
  on public.quest_assignees (assigned_by);
create index if not exists quest_assignees_quest_workspace_idx
  on public.quest_assignees (quest_id, workspace_id);
create index if not exists quest_assignees_workspace_user_idx
  on public.quest_assignees (workspace_id, user_id);
create index if not exists quest_check_ins_created_by_idx
  on public.quest_check_ins (created_by);
create index if not exists quest_check_ins_quest_workspace_idx
  on public.quest_check_ins (quest_id, workspace_id);
create index if not exists quest_dependencies_created_by_idx
  on public.quest_dependencies (created_by);
create index if not exists quest_dependencies_depends_on_workspace_idx
  on public.quest_dependencies (depends_on_quest_id, workspace_id);
create index if not exists quest_dependencies_quest_workspace_idx
  on public.quest_dependencies (quest_id, workspace_id);
create index if not exists quests_created_by_idx
  on public.quests (created_by);
create index if not exists quests_goal_workspace_idx
  on public.quests (goal_id, workspace_id);
create index if not exists workspace_invitations_invited_by_idx
  on public.workspace_invitations (invited_by);

-- One authenticated round trip returns both portal flags.
create or replace function private.current_user_access()
returns table (is_active boolean, is_admin boolean)
language sql
stable
security definer
set search_path = ''
as $function$
  select private.is_platform_user_active(), private.is_platform_admin();
$function$;

revoke all on function private.current_user_access() from public, anon, authenticated;
grant execute on function private.current_user_access() to authenticated;

create or replace function public.current_user_access()
returns table (is_active boolean, is_admin boolean)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from private.current_user_access();
$function$;

revoke all on function public.current_user_access() from public, anon, authenticated;
grant execute on function public.current_user_access() to authenticated;
