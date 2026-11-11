-- A proposal may only be created as a draft. Opening/closing/deciding it
-- remains an Owner/Admin-only update, enforced by the existing update policy.
drop policy if exists council_proposals_insert_workspace on public.council_proposals;
create policy council_proposals_insert_workspace on public.council_proposals
for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = (select auth.uid())
  and status = 'draft'
);
