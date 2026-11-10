-- Advanced Archives: searchable notes, tags, and safe same-workspace links.
alter table public.notes
  add column if not exists tags text[] not null default '{}',
  add column if not exists goal_id uuid,
  add column if not exists quest_id uuid,
  add column if not exists council_proposal_id uuid,
  add column if not exists search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(tags, ' ')), 'C')
  ) stored;

alter table public.notes
  add constraint notes_goal_same_workspace_fk
    foreign key (goal_id, workspace_id) references public.goals(id, workspace_id) on delete set null (goal_id),
  add constraint notes_quest_same_workspace_fk
    foreign key (quest_id, workspace_id) references public.quests(id, workspace_id) on delete set null (quest_id),
  add constraint notes_council_same_workspace_fk
    foreign key (council_proposal_id, workspace_id) references public.council_proposals(id, workspace_id) on delete set null (council_proposal_id);

alter table public.notes
  add constraint notes_tags_count_check check (cardinality(tags) <= 20),
  add constraint notes_tags_length_check check (
    not exists (select 1 from unnest(tags) tag where char_length(tag) > 32)
  );

create index if not exists notes_search_vector_idx on public.notes using gin(search_vector);
create index if not exists notes_tags_idx on public.notes using gin(tags);
create index if not exists notes_goal_link_idx on public.notes(goal_id) where goal_id is not null;
create index if not exists notes_quest_link_idx on public.notes(quest_id) where quest_id is not null;
create index if not exists notes_council_link_idx on public.notes(council_proposal_id) where council_proposal_id is not null;
