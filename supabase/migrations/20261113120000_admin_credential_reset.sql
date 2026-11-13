-- Admin-only credential reset support. Passwords remain managed by Supabase Auth.
-- Audit records actor/target/time only; generated secrets are never persisted.
create table if not exists private.platform_admin_credential_resets (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null,
  target_user_id uuid not null,
  created_at timestamptz not null default now()
);
revoke all on table private.platform_admin_credential_resets from public, anon, authenticated;
grant all on table private.platform_admin_credential_resets to service_role;

create or replace function public.admin_set_account_recovery_pin(
  p_admin_user_id uuid, p_target_user_id uuid, p_pin text
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN must contain exactly six digits' using errcode = '22023';
  end if;
  if not exists (select 1 from private.platform_admins a where a.user_id = p_admin_user_id)
     or exists (select 1 from private.platform_user_status s where s.user_id = p_admin_user_id and s.is_suspended) then
    raise exception 'Active platform administrator required' using errcode = '42501';
  end if;
  if p_admin_user_id = p_target_user_id
     or exists (select 1 from private.platform_admins a where a.user_id = p_target_user_id) then
    raise exception 'Platform administrator accounts are protected' using errcode = '42501';
  end if;
  insert into public.account_recovery_pins(user_id, email, pin_hash, failed_attempts, locked_until)
  select u.id, lower(u.email), extensions.crypt(p_pin, extensions.gen_salt('bf', 12)), 0, null
  from auth.users u where u.id = p_target_user_id and u.email is not null
  on conflict (user_id) do update set email = excluded.email, pin_hash = excluded.pin_hash,
    failed_attempts = 0, locked_until = null, updated_at = now();
  if not found then raise exception 'Target account not found' using errcode = 'P0002'; end if;
  insert into private.platform_admin_credential_resets(admin_user_id, target_user_id)
  values (p_admin_user_id, p_target_user_id);
  return true;
end;
$$;
revoke all on function public.admin_set_account_recovery_pin(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_account_recovery_pin(uuid, uuid, text) to service_role;
