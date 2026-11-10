# Supabase foundation — deployed state

Updated: 2026-11-10

## Project

- Project name: `the-fellowship`
- Project ref: `talkxkmkqliqpmdlqmrq`
- Project URL: `https://talkxkmkqliqpmdlqmrq.supabase.co`
- Organization: `PhamDucDuy-2280605704's Org`
- Plan at creation: Free
- Region: `ap-southeast-1` (Singapore)
- Status observed after creation: `ACTIVE_HEALTHY`
- PostgreSQL: 17.11

The project is independent of `little-story-world`. No existing user records, storage objects, secrets, or migrations were copied.

## Migrations applied

| Version | Migration | Result |
|---|---|---|
| 20261110055955 | `initial_workspace_foundation` | Applied |
| 20261110060025 | `index_workspace_creator` | Applied |

The matching SQL files live in `supabase/migrations`. Both versions were read back from the Supabase migration ledger after application.

## Schema

### profiles

- Primary key `id` references `auth.users(id)`.
- `display_name` (presentation only), `avatar_path`, timestamps.
- Signup trigger creates a profile from display name metadata or email prefix. This value is not an authorization claim.
- User can read/update only their own profile.

### workspaces

- Primary key UUID, unique URL slug, name, description, creator, timestamps, optional archive timestamp.
- Creator must be the authenticated user on INSERT.
- Active members can read.
- Owner/admin can update only allowed metadata columns.
- An after-insert trigger creates the creator's owner membership.

### workspace_members

- Composite primary key `(workspace_id, user_id)`.
- Workspace-scoped roles: owner, admin, member, viewer.
- Status: active or removed.
- User can read their own row only.
- Authenticated clients do not have direct INSERT/UPDATE/DELETE privileges. Invitations and member administration will be added using a reviewed flow.

## Security design

- RLS enabled on all three public tables.
- `anon` has no SELECT grant on these tables.
- `authenticated` has only grants required by current policies.
- Trigger functions live in `private`, use an empty search_path and fully qualified table references.
- SECURITY DEFINER is limited to profile creation and owner membership provisioning. EXECUTE is revoked from PUBLIC, anon and authenticated; clients cannot call these functions through the API.
- No service-role or secret key is used by the application.

## Verification performed

- Supabase project returned `ACTIVE_HEALTHY`.
- Three expected tables exist with RLS enabled.
- Migration ledger contains both expected versions.
- Security Advisor returned no lints.
- Privilege check confirmed anon cannot SELECT profiles, authenticated cannot directly INSERT membership rows, and authenticated cannot update `workspaces.created_by`.
- Function audit confirmed trigger-only SECURITY DEFINER functions cannot be executed by anon or authenticated roles.
- Performance Advisor no longer reports the unindexed `workspaces.created_by` foreign key. It reports the two recently created indexes as unused; this is expected while the database has no application data or query workload.

## Not yet verified

- No Auth test user has been created.
- Signup/login/confirmation email behavior has not been exercised.
- RLS has not yet been tested with real users across different workspaces.
- No workspace has been created through the application.
- Auth redirect URLs, local .env.local, and Vercel environment variables are not configured.
- No Storage bucket or Realtime publication has been added.

Do not mark the Supabase foundation release gate complete until Auth and tenant-isolation tests pass.
