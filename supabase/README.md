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
| 20261110072318 | `platform_admin_and_account_management.sql` | Single platform-admin registry, user suspension, admin account/workspace inventory and first-pass RLS policies |
| 20261110072520 | `secure_admin_rpc_and_rls_policies.sql` | Move privileged routines to the private schema, use invoker RPC wrappers, and harden admin-aware policies |

These migrations have already been applied to the dedicated project. Do not reapply them to the live database or edit their SQL after application. Add a new versioned migration for every subsequent schema change.

## Current tables

Public:
- `public.profiles`
- `public.workspaces`
- `public.workspace_members`

Private:
- `private.platform_admins`
- `private.platform_user_status`

RLS is enabled on all exposed application tables. The private administration tables have no grants to browser roles and are not exposed through the Data API.

## Platform authorization

- The platform has one Admin account, seeded into `private.platform_admins`.
- User accounts are the default for all other registrations.
- Platform Admin is separate from workspace Owner/Admin/Member/Viewer roles.
- `private.is_platform_admin()` and `private.is_platform_user_active()` are narrow helpers in the unexposed private schema.
- Public RPC wrappers execute as the caller and delegate to guarded private routines.
- Admin RPCs provide account inventory, workspace inventory, user suspension/reactivation, and workspace archive/restore.
- A suspended user is blocked by restrictive RLS policies and server-side route checks. The Auth identity and application data are retained so the Admin can restore access.
- The platform Admin cannot suspend their own account.

Never derive platform Admin privileges from `user_metadata` or client-supplied fields. For a fresh project, seed the initial verified Admin user from a trusted database-admin session in the Supabase SQL editor; do not expose writes to `private.platform_admins` through the Data API.

## Workspace authorization

- Active workspace members can read their workspace.
- Workspace owners and admins can update workspace metadata.
- A user can create a workspace only with their own Auth user ID as `created_by`.
- An after-insert database trigger provisions the creator as the workspace owner.
- Browser clients have no direct INSERT/UPDATE/DELETE privileges on `workspace_members`. Invitations, roster display and role changes require reviewed server-side/database operations in a later stage.
- Platform Admin can inspect all workspaces through guarded admin RPCs.

The profile trigger and workspace-owner trigger use narrowly scoped SECURITY DEFINER functions in the non-exposed `private` schema, with an empty search_path and EXECUTE revoked from public, anon and authenticated. Do not add broad grants to these functions.

## Data API exposure

New public tables are not automatically exposed to the Data API on current Supabase projects. Every new public table requires reviewed schema grants and RLS. Schema/table grants control API reachability; RLS controls which rows are visible. Review both independently.

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
