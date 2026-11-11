-- Cover foreign-key lookups used by deletes, joins, and workspace-scoped cleanup.
-- Existing leading-column indexes do not cover these composite FK column orders.

create index if not exists council_criteria_created_by_idx
  on public.council_criteria (created_by);

create index if not exists council_criteria_proposal_workspace_fk_idx
  on public.council_criteria (proposal_id, workspace_id);

create index if not exists council_option_scores_criterion_proposal_workspace_fk_idx
  on public.council_option_scores (criterion_id, proposal_id, workspace_id);

create index if not exists council_option_scores_option_proposal_workspace_fk_idx
  on public.council_option_scores (option_id, proposal_id, workspace_id);

create index if not exists council_option_scores_user_idx
  on public.council_option_scores (user_id);

create index if not exists notes_council_workspace_fk_idx
  on public.notes (council_proposal_id, workspace_id);

create index if not exists notes_goal_workspace_fk_idx
  on public.notes (goal_id, workspace_id);

create index if not exists notes_quest_workspace_fk_idx
  on public.notes (quest_id, workspace_id);
