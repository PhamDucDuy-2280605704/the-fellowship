-- Authenticated policies and invoker RPC wrappers must be able to resolve
-- explicitly granted private helpers. USAGE alone exposes no table access and
-- function EXECUTE remains restricted per-function; anon stays denied.
grant usage on schema private to authenticated;
revoke all on schema private from anon;
