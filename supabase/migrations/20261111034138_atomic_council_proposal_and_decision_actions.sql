-- Make Council proposal creation and final decisions atomic.

CREATE OR REPLACE FUNCTION private.create_council_proposal(p_workspace_id uuid, p_title text, p_context text, p_closes_at timestamp with time zone, p_options jsonb, p_criteria jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := (select auth.uid());
  v_proposal_id uuid;
  v_criteria jsonb := coalesce(p_criteria, '[]'::jsonb);
  v_option_count integer;
  v_criteria_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if not private.has_workspace_role(p_workspace_id, array['owner','admin','member']) then
    raise exception 'Active workspace membership required.' using errcode = '42501';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 180 then
    raise exception 'Proposal title must contain 3 to 180 characters.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_context, '')) > 8000 then
    raise exception 'Proposal context is too long.' using errcode = '22023';
  end if;
  if p_closes_at is not null and p_closes_at <= pg_catalog.now() then
    raise exception 'Voting close time must be in the future.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_options) is distinct from 'array' then
    raise exception 'At least two proposal options are required.' using errcode = '22023';
  end if;
  v_option_count := jsonb_array_length(p_options);
  if v_option_count < 2 or v_option_count > 8 then
    raise exception 'A proposal must contain 2 to 8 options.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_criteria) is distinct from 'array' then
    raise exception 'Criteria must be a list.' using errcode = '22023';
  end if;
  v_criteria_count := jsonb_array_length(v_criteria);
  if v_criteria_count > 8 then
    raise exception 'A proposal may contain at most 8 criteria.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_options) as option_row(title text, description text)
    where option_row.title is null
       or char_length(btrim(option_row.title)) not between 1 and 180
       or char_length(coalesce(option_row.description, '')) > 3000
  ) then
    raise exception 'One or more proposal options are invalid.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(v_criteria) as criterion_row(title text, weight numeric)
    where criterion_row.title is null
       or char_length(btrim(criterion_row.title)) not between 2 and 120
       or criterion_row.weight is null
       or criterion_row.weight <= 0
       or criterion_row.weight > 100
  ) then
    raise exception 'One or more weighted criteria are invalid.' using errcode = '22023';
  end if;

  insert into public.council_proposals (
    workspace_id, title, context, status, created_by, closes_at, voting_mode
  ) values (
    p_workspace_id, btrim(p_title), coalesce(p_context, ''), 'draft',
    v_user_id, p_closes_at, 'anonymous'
  ) returning id into v_proposal_id;

  insert into public.council_options (workspace_id, proposal_id, title, description)
  select p_workspace_id, v_proposal_id, btrim(option_row.title),
         coalesce(btrim(option_row.description), '')
  from jsonb_to_recordset(p_options) as option_row(title text, description text);

  if v_criteria_count > 0 then
    insert into public.council_criteria (
      workspace_id, proposal_id, title, weight, created_by
    )
    select p_workspace_id, v_proposal_id, btrim(criterion_row.title),
           criterion_row.weight, v_user_id
    from jsonb_to_recordset(v_criteria) as criterion_row(title text, weight numeric);
  end if;
  return v_proposal_id;
end;
$function$


CREATE OR REPLACE FUNCTION private.decide_council_proposal(p_workspace_id uuid, p_proposal_id uuid, p_option_id uuid, p_rationale text, p_followup_quest_title text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := (select auth.uid());
  v_followup_title text := nullif(btrim(p_followup_quest_title), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if not private.has_workspace_role(p_workspace_id, array['owner','admin']) then
    raise exception 'Workspace manager access required.' using errcode = '42501';
  end if;
  if p_rationale is null or char_length(btrim(p_rationale)) not between 1 and 5000 then
    raise exception 'A decision rationale of 1 to 5000 characters is required.' using errcode = '22023';
  end if;
  if v_followup_title is not null and char_length(v_followup_title) not between 2 and 160 then
    raise exception 'Follow-up Quest title must contain 2 to 160 characters.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.council_proposals p
    join public.council_options o on o.proposal_id = p.id and o.workspace_id = p.workspace_id
    where p.id = p_proposal_id and p.workspace_id = p_workspace_id
      and p.status = 'voting' and o.id = p_option_id
  ) then
    raise exception 'The proposal is not open for decision or the selected option is invalid.' using errcode = '22023';
  end if;

  insert into public.council_decisions (
    workspace_id, proposal_id, chosen_option_id, rationale, decided_by
  ) values (
    p_workspace_id, p_proposal_id, p_option_id, btrim(p_rationale), v_user_id
  );

  update public.council_proposals
  set status = 'decided', updated_at = pg_catalog.now()
  where id = p_proposal_id and workspace_id = p_workspace_id and status = 'voting';
  if not found then
    raise exception 'The proposal could not be finalized.' using errcode = '40001';
  end if;

  if v_followup_title is not null then
    insert into public.quests (
      workspace_id, title, description, status, priority, created_by
    ) values (
      p_workspace_id, v_followup_title,
      'Quest được tạo từ quyết định Council: ' || left(btrim(p_rationale), 900),
      'backlog', 'medium', v_user_id
    );
  end if;
end;
$function$


CREATE OR REPLACE FUNCTION public.create_council_proposal(p_workspace_id uuid, p_title text, p_context text, p_closes_at timestamp with time zone, p_options jsonb, p_criteria jsonb)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.create_council_proposal(
    p_workspace_id, p_title, p_context, p_closes_at, p_options, p_criteria
  );
$function$


CREATE OR REPLACE FUNCTION public.decide_council_proposal(p_workspace_id uuid, p_proposal_id uuid, p_option_id uuid, p_rationale text, p_followup_quest_title text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.decide_council_proposal(
    p_workspace_id, p_proposal_id, p_option_id, p_rationale, p_followup_quest_title
  );
$function$



revoke all on function private.create_council_proposal(uuid,text,text,timestamptz,jsonb,jsonb) from public, anon;
grant execute on function private.create_council_proposal(uuid,text,text,timestamptz,jsonb,jsonb) to authenticated;
revoke all on function public.create_council_proposal(uuid,text,text,timestamptz,jsonb,jsonb) from public, anon;
grant execute on function public.create_council_proposal(uuid,text,text,timestamptz,jsonb,jsonb) to authenticated;

revoke all on function private.decide_council_proposal(uuid,uuid,uuid,text,text) from public, anon;
grant execute on function private.decide_council_proposal(uuid,uuid,uuid,text,text) to authenticated;
revoke all on function public.decide_council_proposal(uuid,uuid,uuid,text,text) from public, anon;
grant execute on function public.decide_council_proposal(uuid,uuid,uuid,text,text) to authenticated;
