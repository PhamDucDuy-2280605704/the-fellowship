-- Council advanced evaluation: weighted criteria and per-member option scoring.
alter table public.council_proposals
  add column if not exists voting_mode text not null default 'open'
    check (voting_mode in ('open','anonymous'));

create table if not exists public.council_criteria (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  proposal_id uuid not null,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  weight numeric(6,2) not null default 1 check (weight > 0 and weight <= 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, proposal_id, workspace_id),
  foreign key (proposal_id, workspace_id)
    references public.council_proposals(id, workspace_id) on delete cascade
);
create index if not exists council_criteria_proposal_idx
  on public.council_criteria(workspace_id, proposal_id);

create table if not exists public.council_option_scores (
  workspace_id uuid not null,
  proposal_id uuid not null,
  option_id uuid not null,
  criterion_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score between 0 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (option_id, criterion_id, user_id),
  foreign key (option_id, proposal_id, workspace_id)
    references public.council_options(id, proposal_id, workspace_id) on delete cascade,
  foreign key (criterion_id, proposal_id, workspace_id)
    references public.council_criteria(id, proposal_id, workspace_id) on delete cascade
);
create index if not exists council_option_scores_summary_idx
  on public.council_option_scores(workspace_id, proposal_id, option_id, criterion_id);

alter table public.council_criteria enable row level security;
alter table public.council_option_scores enable row level security;
revoke all on public.council_criteria, public.council_option_scores from public, anon, authenticated;
grant select, insert, update, delete on public.council_criteria to authenticated;
grant select, insert, update on public.council_option_scores to authenticated;

create policy council_criteria_select_workspace on public.council_criteria
for select to authenticated using (private.is_active_workspace_member(workspace_id));
create policy council_criteria_insert_workspace on public.council_criteria
for insert to authenticated with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.council_proposals p
    where p.id = proposal_id and p.workspace_id = council_criteria.workspace_id and p.status = 'draft'
  )
);
create policy council_criteria_update_managers on public.council_criteria
for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']))
with check (private.has_workspace_role(workspace_id, array['owner','admin']));
create policy council_criteria_delete_managers on public.council_criteria
for delete to authenticated using (private.has_workspace_role(workspace_id, array['owner','admin']));

create policy council_option_scores_select_workspace on public.council_option_scores
for select to authenticated using (private.is_active_workspace_member(workspace_id));
create policy council_option_scores_insert_self on public.council_option_scores
for insert to authenticated with check (
  user_id = (select auth.uid())
  and private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and exists (
    select 1 from public.council_proposals p
    where p.id = proposal_id and p.workspace_id = council_option_scores.workspace_id
      and p.status = 'voting' and (p.closes_at is null or p.closes_at > now())
  )
);
create policy council_option_scores_update_self on public.council_option_scores
for update to authenticated
using (user_id = (select auth.uid()) and private.is_active_workspace_member(workspace_id))
with check (
  user_id = (select auth.uid())
  and private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and exists (
    select 1 from public.council_proposals p
    where p.id = proposal_id and p.workspace_id = council_option_scores.workspace_id
      and p.status = 'voting' and (p.closes_at is null or p.closes_at > now())
  )
);
