-- Cover the workspaces.created_by foreign key for efficient referential checks.
create index workspaces_created_by_idx
  on public.workspaces (created_by);
