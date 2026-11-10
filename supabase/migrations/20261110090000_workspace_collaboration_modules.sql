-- The Fellowship: collaboration, execution, and knowledge modules.
-- Applied to Supabase project talkxkmkqliqpmdlqmrq on 2026-11-10.
-- Existing platform role and active-user helpers are defined in earlier migrations.

create or replace function private.is_active_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_platform_admin() or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function private.has_workspace_role(p_workspace_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_platform_admin() or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(p_roles)
  );
$$;

create or replace function private.is_active_workspace_user(p_workspace_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = p_user_id
      and m.status = 'active'
  );
$$;

revoke all on function private.is_active_workspace_member(uuid) from public, anon, authenticated;
revoke all on function private.has_workspace_role(uuid, text[]) from public, anon, authenticated;
revoke all on function private.is_active_workspace_user(uuid, uuid) from public, anon, authenticated;
grant execute on function private.is_active_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function private.is_active_workspace_user(uuid, uuid) to authenticated;

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','member','viewer')),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (pg_catalog.now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  constraint workspace_invitations_email_length check (char_length(email) between 5 and 254)
);
create index workspace_invitations_workspace_created_idx on public.workspace_invitations(workspace_id, created_at desc);
create index workspace_invitations_email_idx on public.workspace_invitations(lower(email));

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 140),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'active' check (status in ('draft','active','on_hold','completed','archived')),
  target_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  unique (id, workspace_id)
);
create index goals_workspace_status_idx on public.goals(workspace_id, status, created_at desc);
create trigger goals_set_updated_at before update on public.goals
for each row execute function private.set_updated_at();

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  goal_id uuid,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text not null default '' check (char_length(description) <= 6000),
  status text not null default 'backlog' check (status in ('backlog','ready','in_progress','blocked','done','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  unique (id, workspace_id),
  constraint quests_goal_same_workspace_fk foreign key (goal_id, workspace_id)
    references public.goals(id, workspace_id) on delete set null (goal_id)
);
create index quests_workspace_status_due_idx on public.quests(workspace_id, status, due_date);
create index quests_goal_idx on public.quests(goal_id) where goal_id is not null;
create trigger quests_set_updated_at before update on public.quests
for each row execute function private.set_updated_at();

create table public.quest_assignees (
  workspace_id uuid not null,
  quest_id uuid not null,
  user_id uuid not null,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default pg_catalog.now(),
  primary key (quest_id, user_id),
  foreign key (quest_id, workspace_id) references public.quests(id, workspace_id) on delete cascade,
  foreign key (workspace_id, user_id) references public.workspace_members(workspace_id, user_id) on delete cascade
);
create index quest_assignees_user_idx on public.quest_assignees(user_id, workspace_id);

create table public.quest_dependencies (
  workspace_id uuid not null,
  quest_id uuid not null,
  depends_on_quest_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (quest_id, depends_on_quest_id),
  check (quest_id <> depends_on_quest_id),
  foreign key (quest_id, workspace_id) references public.quests(id, workspace_id) on delete cascade,
  foreign key (depends_on_quest_id, workspace_id) references public.quests(id, workspace_id) on delete cascade
);
create index quest_dependencies_reverse_idx on public.quest_dependencies(workspace_id, depends_on_quest_id);

create or replace function private.prevent_quest_dependency_cycle()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  would_cycle boolean;
begin
  with recursive ancestors(quest_id) as (
    select new.depends_on_quest_id
    union
    select d.depends_on_quest_id
    from public.quest_dependencies d
    join ancestors a on d.quest_id = a.quest_id
    where d.workspace_id = new.workspace_id
  )
  select exists(select 1 from ancestors where quest_id = new.quest_id) into would_cycle;

  if would_cycle then
    raise exception 'Quest dependency would create a cycle.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_quest_dependency_cycle() from public, anon, authenticated;
create trigger quest_dependencies_prevent_cycle
before insert or update on public.quest_dependencies
for each row execute function private.prevent_quest_dependency_cycle();

create table public.quest_check_ins (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  quest_id uuid not null,
  content text not null check (char_length(btrim(content)) between 1 and 3000),
  progress smallint check (progress between 0 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  foreign key (quest_id, workspace_id) references public.quests(id, workspace_id) on delete cascade
);
create index quest_check_ins_timeline_idx on public.quest_check_ins(workspace_id, quest_id, created_at desc);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  content text not null default '' check (char_length(content) <= 40000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz
);
create index notes_workspace_updated_idx on public.notes(workspace_id, updated_at desc);
create trigger notes_set_updated_at before update on public.notes
for each row execute function private.set_updated_at();

create table public.council_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 180),
  context text not null default '' check (char_length(context) <= 8000),
  status text not null default 'draft' check (status in ('draft','voting','decided','archived')),
  closes_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  unique (id, workspace_id)
);
create index council_proposals_workspace_status_idx on public.council_proposals(workspace_id, status, created_at desc);
create trigger council_proposals_set_updated_at before update on public.council_proposals
for each row execute function private.set_updated_at();

create table public.council_options (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  proposal_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 3000),
  created_at timestamptz not null default pg_catalog.now(),
  unique (id, proposal_id, workspace_id),
  foreign key (proposal_id, workspace_id) references public.council_proposals(id, workspace_id) on delete cascade
);
create index council_options_proposal_idx on public.council_options(proposal_id);

create table public.council_votes (
  workspace_id uuid not null,
  proposal_id uuid not null,
  option_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (proposal_id, user_id),
  foreign key (proposal_id, workspace_id) references public.council_proposals(id, workspace_id) on delete cascade,
  foreign key (option_id, proposal_id, workspace_id) references public.council_options(id, proposal_id, workspace_id) on delete cascade
);
create index council_votes_option_idx on public.council_votes(option_id);

create table public.council_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  proposal_id uuid not null unique,
  chosen_option_id uuid,
  rationale text not null check (char_length(btrim(rationale)) between 1 and 5000),
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default pg_catalog.now(),
  foreign key (proposal_id, workspace_id) references public.council_proposals(id, workspace_id) on delete cascade,
  foreign key (chosen_option_id, proposal_id, workspace_id)
    references public.council_options(id, proposal_id, workspace_id)
);

alter table public.workspace_invitations enable row level security;
alter table public.goals enable row level security;
alter table public.quests enable row level security;
alter table public.quest_assignees enable row level security;
alter table public.quest_dependencies enable row level security;
alter table public.quest_check_ins enable row level security;
alter table public.notes enable row level security;
alter table public.council_proposals enable row level security;
alter table public.council_options enable row level security;
alter table public.council_votes enable row level security;
alter table public.council_decisions enable row level security;

revoke all on table public.workspace_invitations from public, anon, authenticated;
revoke all on table public.goals from public, anon, authenticated;
revoke all on table public.quests from public, anon, authenticated;
revoke all on table public.quest_assignees from public, anon, authenticated;
revoke all on table public.quest_dependencies from public, anon, authenticated;
revoke all on table public.quest_check_ins from public, anon, authenticated;
revoke all on table public.notes from public, anon, authenticated;
revoke all on table public.council_proposals from public, anon, authenticated;
revoke all on table public.council_options from public, anon, authenticated;
revoke all on table public.council_votes from public, anon, authenticated;
revoke all on table public.council_decisions from public, anon, authenticated;

grant select on public.goals, public.quests, public.quest_assignees, public.quest_dependencies,
  public.quest_check_ins, public.notes, public.council_proposals, public.council_options,
  public.council_votes, public.council_decisions to authenticated;
grant insert, update, delete on public.goals, public.quests, public.quest_assignees,
  public.quest_dependencies, public.quest_check_ins, public.notes,
  public.council_proposals, public.council_options, public.council_votes,
  public.council_decisions to authenticated;

create policy workspace_invitations_block_direct_access
on public.workspace_invitations for all to authenticated using (false) with check (false);

create policy goals_select_workspace on public.goals for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy goals_insert_workspace on public.goals for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']) and created_by = (select auth.uid()));
create policy goals_update_workspace on public.goals for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']));
create policy goals_delete_workspace on public.goals for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']));

create policy quests_select_workspace on public.quests for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy quests_insert_workspace on public.quests for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']) and created_by = (select auth.uid()));
create policy quests_update_workspace on public.quests for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']));
create policy quests_delete_workspace on public.quests for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']));

create policy quest_assignees_select_workspace on public.quest_assignees for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy quest_assignees_insert_workspace on public.quest_assignees for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and assigned_by = (select auth.uid())
  and private.is_active_workspace_user(workspace_id, user_id)
);
create policy quest_assignees_delete_workspace on public.quest_assignees for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy quest_dependencies_select_workspace on public.quest_dependencies for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy quest_dependencies_insert_workspace on public.quest_dependencies for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']) and created_by = (select auth.uid()));
create policy quest_dependencies_delete_workspace on public.quest_dependencies for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy quest_check_ins_select_workspace on public.quest_check_ins for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy quest_check_ins_insert_workspace on public.quest_check_ins for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = (select auth.uid())
);

create policy notes_select_workspace on public.notes for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy notes_insert_workspace on public.notes for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']) and created_by = (select auth.uid()));
create policy notes_update_workspace on public.notes for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']));
create policy notes_delete_workspace on public.notes for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']) or created_by = (select auth.uid()));

create policy council_proposals_select_workspace on public.council_proposals for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy council_proposals_insert_workspace on public.council_proposals for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']) and created_by = (select auth.uid()));
create policy council_proposals_update_workspace on public.council_proposals for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']))
with check (private.has_workspace_role(workspace_id, array['owner','admin']));

create policy council_options_select_workspace on public.council_options for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy council_options_insert_workspace on public.council_options for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and exists (
    select 1 from public.council_proposals p
    where p.id = proposal_id and p.workspace_id = council_options.workspace_id
      and p.created_by = (select auth.uid()) and p.status in ('draft','voting')
  )
);

create policy council_votes_select_workspace on public.council_votes for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy council_votes_insert_workspace on public.council_votes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_active_workspace_member(workspace_id)
  and exists (
    select 1 from public.council_proposals p
    where p.id = proposal_id and p.workspace_id = council_votes.workspace_id
      and p.status = 'voting'
      and (p.closes_at is null or p.closes_at > pg_catalog.now())
  )
);
create policy council_votes_update_self on public.council_votes for update to authenticated
using (user_id = (select auth.uid()) and private.is_active_workspace_member(workspace_id))
with check (
  user_id = (select auth.uid()) and private.is_active_workspace_member(workspace_id)
  and exists (
    select 1 from public.council_proposals p
    where p.id = proposal_id and p.workspace_id = council_votes.workspace_id
      and p.status = 'voting'
      and (p.closes_at is null or p.closes_at > pg_catalog.now())
  )
);

create policy council_decisions_select_workspace on public.council_decisions for select to authenticated
using (private.is_active_workspace_member(workspace_id));
create policy council_decisions_insert_workspace on public.council_decisions for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin']) and decided_by = (select auth.uid()));

create or replace function private.create_workspace_invitation(
  p_workspace_id uuid, p_email text, p_role text, p_token_hash text
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_invitation_id uuid; v_is_owner boolean;
begin
  if (select auth.uid()) is null or not private.has_workspace_role(p_workspace_id, array['owner','admin']) then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;
  if p_email is null or char_length(btrim(p_email)) > 254
    or lower(btrim(p_email)) !~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' then
    raise exception 'A valid email address is required.' using errcode = '22023';
  end if;
  if p_role not in ('admin','member','viewer') then
    raise exception 'Invalid workspace role.' using errcode = '22023';
  end if;
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid())
      and m.status = 'active' and m.role = 'owner'
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
$$;

create or replace function private.accept_workspace_invitation(p_token_hash text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_invitation public.workspace_invitations%rowtype; v_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in is required.' using errcode = '42501';
  end if;
  select lower(email) into v_email from auth.users where id = (select auth.uid());
  select * into v_invitation from public.workspace_invitations
  where token_hash = p_token_hash and accepted_at is null and revoked_at is null
    and expires_at > pg_catalog.now()
  for update;
  if not found then
    raise exception 'Invitation is invalid, expired, or already used.' using errcode = 'P0002';
  end if;
  if lower(v_invitation.email) <> coalesce(v_email,'') then
    raise exception 'This invitation belongs to a different email address.' using errcode = '42501';
  end if;
  insert into public.workspace_members(workspace_id,user_id,role,status)
  values(v_invitation.workspace_id,(select auth.uid()),v_invitation.role,'active')
  on conflict (workspace_id,user_id) do update
  set role = excluded.role, status = 'active', joined_at = pg_catalog.now();
  update public.workspace_invitations set accepted_at = pg_catalog.now() where id = v_invitation.id;
  return v_invitation.workspace_id;
end;
$$;

create or replace function private.revoke_workspace_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id from public.workspace_invitations where id = p_invitation_id;
  if v_workspace_id is null or not private.has_workspace_role(v_workspace_id,array['owner','admin']) then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;
  update public.workspace_invitations set revoked_at = pg_catalog.now()
  where id = p_invitation_id and accepted_at is null and revoked_at is null;
  if not found then raise exception 'Invitation is not pending.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function private.list_workspace_members(p_workspace_id uuid)
returns table(user_id uuid,email text,display_name text,role text,status text,joined_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_active_workspace_member(p_workspace_id) then
    raise exception 'Active workspace membership required.' using errcode = '42501';
  end if;
  return query
  select m.user_id,u.email::text,coalesce(p.display_name,''),m.role,m.status,m.joined_at
  from public.workspace_members m
  join auth.users u on u.id=m.user_id
  left join public.profiles p on p.id=m.user_id
  where m.workspace_id=p_workspace_id
  order by case m.role when 'owner' then 0 when 'admin' then 1 when 'member' then 2 else 3 end, m.joined_at;
end;
$$;

create or replace function private.update_workspace_member_role(p_workspace_id uuid,p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_actor_role text;
begin
  select role into v_actor_role from public.workspace_members
  where workspace_id=p_workspace_id and user_id=(select auth.uid()) and status='active';
  if v_actor_role not in ('owner','admin') and not private.is_platform_admin() then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;
  if p_role not in ('admin','member','viewer') then
    raise exception 'Invalid workspace role.' using errcode = '22023';
  end if;
  if exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner') then
    raise exception 'The workspace owner role is protected.' using errcode = '42501';
  end if;
  if p_role='admin' and v_actor_role<>'owner' and not private.is_platform_admin() then
    raise exception 'Only the owner can promote a workspace admin.' using errcode = '42501';
  end if;
  update public.workspace_members set role=p_role
  where workspace_id=p_workspace_id and user_id=p_user_id and status='active';
  if not found then raise exception 'Active member not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function private.remove_workspace_member(p_workspace_id uuid,p_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_actor_role text;
begin
  select role into v_actor_role from public.workspace_members
  where workspace_id=p_workspace_id and user_id=(select auth.uid()) and status='active';
  if v_actor_role not in ('owner','admin') and not private.is_platform_admin() then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;
  if exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner') then
    raise exception 'The workspace owner cannot be removed.' using errcode = '42501';
  end if;
  if v_actor_role='admin' and exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='admin') then
    raise exception 'An admin cannot remove another admin.' using errcode = '42501';
  end if;
  update public.workspace_members set status='removed'
  where workspace_id=p_workspace_id and user_id=p_user_id and status='active';
  if not found then raise exception 'Active member not found.' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function private.create_workspace_invitation(uuid,text,text,text) from public,anon,authenticated;
revoke all on function private.accept_workspace_invitation(text) from public,anon,authenticated;
revoke all on function private.revoke_workspace_invitation(uuid) from public,anon,authenticated;
revoke all on function private.list_workspace_members(uuid) from public,anon,authenticated;
revoke all on function private.update_workspace_member_role(uuid,uuid,text) from public,anon,authenticated;
revoke all on function private.remove_workspace_member(uuid,uuid) from public,anon,authenticated;
grant execute on function private.create_workspace_invitation(uuid,text,text,text) to authenticated;
grant execute on function private.accept_workspace_invitation(text) to authenticated;
grant execute on function private.revoke_workspace_invitation(uuid) to authenticated;
grant execute on function private.list_workspace_members(uuid) to authenticated;
grant execute on function private.update_workspace_member_role(uuid,uuid,text) to authenticated;
grant execute on function private.remove_workspace_member(uuid,uuid) to authenticated;

create or replace function public.create_workspace_invitation(p_workspace_id uuid,p_email text,p_role text,p_token_hash text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.create_workspace_invitation(p_workspace_id,p_email,p_role,p_token_hash); $$;
create or replace function public.accept_workspace_invitation(p_token_hash text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.accept_workspace_invitation(p_token_hash); $$;
create or replace function public.revoke_workspace_invitation(p_invitation_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.revoke_workspace_invitation(p_invitation_id); $$;
create or replace function public.list_workspace_members(p_workspace_id uuid)
returns table(user_id uuid,email text,display_name text,role text,status text,joined_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_workspace_members(p_workspace_id); $$;
create or replace function public.update_workspace_member_role(p_workspace_id uuid,p_user_id uuid,p_role text)
returns void language sql security invoker set search_path = ''
as $$ select private.update_workspace_member_role(p_workspace_id,p_user_id,p_role); $$;
create or replace function public.remove_workspace_member(p_workspace_id uuid,p_user_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.remove_workspace_member(p_workspace_id,p_user_id); $$;

revoke all on function public.create_workspace_invitation(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.accept_workspace_invitation(text) from public,anon,authenticated;
revoke all on function public.revoke_workspace_invitation(uuid) from public,anon,authenticated;
revoke all on function public.list_workspace_members(uuid) from public,anon,authenticated;
revoke all on function public.update_workspace_member_role(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.remove_workspace_member(uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_workspace_invitation(uuid,text,text,text) to authenticated;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
grant execute on function public.revoke_workspace_invitation(uuid) to authenticated;
grant execute on function public.list_workspace_members(uuid) to authenticated;
grant execute on function public.update_workspace_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.remove_workspace_member(uuid,uuid) to authenticated;
