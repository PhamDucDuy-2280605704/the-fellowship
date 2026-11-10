# Supabase setup and database workflow

## Dedicated project

The Fellowship uses its own Supabase project. It is not shared with `little-story-world`.

- Project: `the-fellowship`
- Project ref: `talkxkmkqliqpmdlqmrq`
- Region: `ap-southeast-1` (Singapore)
- Plan at creation: Free
- Database: PostgreSQL 17

Dashboard: https://supabase.com/dashboard/project/talkxkmkqliqpmdlqmrq

## Migrations applied

| Version | File | Purpose |
|---|---|---|
| 20261110055955 | `initial_workspace_foundation.sql` | Profiles, workspaces, members, private trigger functions, RLS and explicit grants |
| 20261110060025 | `index_workspace_creator.sql` | Index the `workspaces.created_by` foreign key |
| 20261110060319 | `restrict_workspace_insert_columns.sql` | Limit authenticated workspace INSERT to name, slug, description and created_by |

The filenames in this repository match the migration versions recorded by the Supabase project. Do not edit migrations that have already been applied. Add a new migration for every subsequent schema change.

## Current tables

- `public.profiles`
- `public.workspaces`
- `public.workspace_members`

RLS is enabled on all three. Only `authenticated` receives the specific Data API grants required by the current policies. No public/anonymous read policy is defined.

## Current authorization boundary

- A user reads and updates only their own profile.
- Active workspace members can read the workspace.
- Workspace owners and admins can update workspace metadata.
- A user can create a workspace only with their own Auth user ID as `created_by`.
- An after-insert database trigger provisions the creator as the workspace owner.
- A user can read only their own membership row through the Data API.
- Browser clients have no direct INSERT/UPDATE/DELETE privileges on `workspace_members`. Invitations, roster display and role changes require reviewed server-side/database operations in a later stage.

The profile trigger and workspace-owner trigger use narrowly scoped SECURITY DEFINER functions in the non-exposed `private` schema, with an empty search_path and EXECUTE revoked from public, anon and authenticated. Do not add broad grants to these functions.

## Data API exposure

New public tables are not automatically exposed to the Data API on current Supabase projects. This migration explicitly grants the required schema/table/column privileges to `authenticated`; RLS remains the row-level boundary. When adding a table, review API exposure and RLS separately.

## Local environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://talkxkmkqliqpmdlqmrq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

Use the project's active publishable key from Dashboard → Connect or Settings → API Keys. Never commit a secret/service-role key or put it in a `NEXT_PUBLIC_*` variable.

## Change workflow

1. Inspect the current project schema and migration ledger.
2. Create a new migration locally using the Supabase CLI's `supabase migration new <name>` command.
3. Review SQL and RLS before applying it.
4. Apply to this dedicated project only.
5. Verify tables, constraints, RLS, grants, and Supabase Advisors.
6. Commit the exact SQL file with the version recorded in Supabase.
7. Generate/update `src/types/database.ts` from the project.
8. Run lint, typecheck, tests, build, and authorization tests.

Never run Fellowship migrations against `little-story-world`.
