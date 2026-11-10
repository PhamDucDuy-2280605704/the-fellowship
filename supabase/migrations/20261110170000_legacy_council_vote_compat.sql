-- Keep the currently deployed legacy Council page functional until the
-- anonymous-summary frontend commit is deployed. The new UI uses the guarded
-- RPCs; a follow-up release migration will revoke these direct grants again.
grant select, insert, update on public.council_votes to authenticated;
