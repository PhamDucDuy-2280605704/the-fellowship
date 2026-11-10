-- Keep user-controlled workspace creation limited to business input fields.
revoke insert on table public.workspaces from authenticated;
grant insert (name, slug, description, created_by)
  on table public.workspaces to authenticated;
