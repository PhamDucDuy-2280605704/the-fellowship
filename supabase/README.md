# Supabase — The Fellowship

Project ref: `talkxkmkqliqpmdlqmrq`

This directory contains the database migrations for The Fellowship. The application uses Supabase Auth, Postgres, Row Level Security (RLS), and server-side RPCs for privileged operations.

## Application capabilities

- **Workspaces and members:** workspace creation, owner/admin/member/viewer roles, invitations, invitation acceptance, role changes, removal, and owner protections.
- **Platform administration:** account suspension, workspace lifecycle management, and workspace-member inspection.
- **Authentication:** signup throttling, account recovery PINs, lockout protection, and password-reset links.
- **Goals and Quests:** status tracking, assignments, check-ins, and dependency relationships with cycle prevention.
- **Council:** proposals, options, weighted criteria, anonymous ballots, member scoring, decisions, and optional follow-up Quests. Proposal creation and final decisions are transactional.
- **Archives:** searchable notes with tags and links to Goals, Quests, and Council proposals; archive and restore support.
- **Activity and overview:** workspace activity history and aggregate workspace statistics.

## Database model

### Public tables

- Identity and workspace core: `profiles`, `workspaces`, `workspace_members`, `workspace_invitations`, `activity_events`.
- Goals and Quests: `goals`, `quests`, `quest_assignees`, `quest_dependencies`, `quest_check_ins`.
- Council: `council_proposals`, `council_options`, `council_votes`, `council_decisions`, `council_criteria`, `council_option_scores`.
- Archives: `notes`.
- Internal authentication controls: `account_signup_attempts`, `account_recovery_attempts`, `account_recovery_pins`.

### Private tables

- `private.platform_admins`
- `private.platform_user_status`

## Access and security model

- RLS is enabled on every application table in the `public` schema.
- No `anon` role has direct read access to public tables.
- `workspace_members` is directly readable only through its RLS rules; browser clients have no direct INSERT, UPDATE, or DELETE privileges. Membership changes use guarded RPCs.
- `workspace_invitations` has no direct browser-role table privileges. Invitation tokens are stored as hashes and handled by guarded server-side/database functions.
- Signup and recovery attempt tables are RLS-enabled and have no direct `anon` or `authenticated` table privileges; controlled service-role operations manage them.
- The two `private` administration tables currently have RLS disabled, but neither `anon` nor `authenticated` has direct table privileges. Keep them ungranted to browser roles. The Supabase security advisor still reports the RLS-disabled status; enabling RLS as defense-in-depth requires a reviewed policy design.
- Workspace authorization helpers include the platform-admin override. Platform admins can inspect and administer workspace modules; ordinary users remain limited by their active membership and role.
- Privileged `SECURITY DEFINER` functions use a fixed/empty search path and explicit identity/role checks. The new workspace-member and Council transaction helpers live in `private`, are called through authenticated public RPC wrappers, and cannot be executed by `anon`.
- A null workspace role is treated as no permission. The member role-change and removal RPCs explicitly reject non-members rather than relying on SQL's three-valued `NULL NOT IN (...)` behavior.

## Authentication requirements

- Protected workspace and admin routes verify that the platform account is active and that the user has a recovery PIN.
- PIN verification failures fail closed: the session is signed out instead of granting access.
- The recovery-PIN setup route is the deliberate exception so a signed-in user without a PIN can complete setup.
- Signup throttling and recovery-attempt controls are managed server-side; browser clients cannot edit their backing tables.
- **Leaked Password Protection is currently disabled in the hosted Auth settings.** Enable it in the Supabase Dashboard under Authentication settings / Password Security.

## Applied migration history

The hosted project currently reports these 22 applied migrations:

| Version | Migration |
|---|---|
| `20261110055955` | `initial_workspace_foundation` |
| `20261110060025` | `index_workspace_creator` |
| `20261110060319` | `restrict_workspace_insert_columns` |
| `20261110072318` | `platform_admin_and_account_management` |
| `20261110072520` | `secure_admin_rpc_and_rls_policies` |
| `20261110090000` | `workspace_collaboration_modules` |
| `20261110090500` | `activity_and_workspace_lifecycle` |
| `20261110095443` | `portal_auth_and_foreign_key_performance` |
| `20261110120423` | `archive_workspace_access_and_admin_member_inspection` |
| `20261110135355` | `account_pin_based_recovery` |
| `20261110135453` | `fix_recovery_pin_verification_lockout` |
| `20261110140641` | `rate_limit_public_member_signup` |
| `20261110143456` | `advanced_archives` |
| `20261110143822` | `council_weighted_scoring` |
| `20261110144627` | `grant_private_schema_usage` |
| `20261110144850` | `private_council_ballots` |
| `20261110145509` | `workspace_overview_stats` |
| `20261110145722` | `council_draft_insert_guard` |
| `20261110145947` | `legacy_council_vote_compat` |
| `20261111033519` | `optimize_unindexed_workspace_foreign_keys` |
| `20261111033818` | `fix_workspace_member_rpc_null_role_guard` |
| `20261111034138` | `atomic_council_proposal_and_decision_actions` |

### Migration-history caveat

The hosted project has an applied migration `20261110095443_portal_auth_and_foreign_key_performance`, but no matching SQL file could be recovered from the current repository history. The other local migration filenames have been aligned with the hosted versions.

Do not use `supabase db reset` or treat a fresh database as reproducible until the original SQL for that missing migration is recovered or its effects are reconstructed and reviewed. Do not invent a no-op replacement: it would hide the history mismatch without recreating the schema changes.

## Migration workflow

1. Create a migration with `supabase migration new <descriptive_name>`.
2. Review the SQL and verify the target project before applying it.
3. Apply the migration to the intended Supabase project.
4. Keep the local filename version identical to the version recorded in the hosted migration history.
5. Commit the migration to Git and refresh `src/types/database.ts` after public schema/RPC changes.
6. Verify the migration ledger and relevant RLS/function grants after applying.

## Operational follow-ups

- Enable **Leaked Password Protection** in Supabase Auth settings.
- Recover or reconstruct the missing `20261110095443` migration before using a fresh database bootstrap.
- The performance advisor still reports indexes as unused. The workspace currently has low data volume; do not drop those indexes without production query evidence.
- Complete real-account acceptance tests for signup, PIN setup, password recovery, invitations, role changes, and platform-admin workspace access. Automated build/smoke tests do not replace those authenticated end-to-end checks.
