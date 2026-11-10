# Roadmap and stage gates

## Stage 1 — Repository and app foundation

**Status: completed**

- Dedicated repository and Next.js/TypeScript shell.
- ESLint, TypeScript, unit tests, GitHub Actions.
- Health endpoint and production route smoke check.

## Stage 2 — Supabase and authentication foundation

**Status: completed for local onboarding; live Auth and cross-tenant tests still required**

- Dedicated Supabase project and initial schema.
- RLS, explicit API grants, workspace-owner trigger.
- Email/password signup, login, PKCE callback, and signout.
- Separate platform-admin registry and active-user status.
- Server-guarded Admin RPCs for account and workspace inventory.

## Stage 3 — Platform administration

**Status: database functions implemented; Admin Console UI integrated**

- Admin-only dashboard and navigation.
- Account inventory with email-confirmation and last-login status.
- User suspension/reactivation.
- Global workspace inventory and archive/restore.
- Non-admin users are redirected away from `/admin`.

Exit gate: CI passes; verify admin and non-admin route access with separate accounts; verify suspended users cannot access workspace data.

## Stage 4 — Workspaces and membership

Deliver: invitation create/accept/revoke; member roster and role management.

Exit gate: role matrix enforced in UI and database; owner cannot be removed or demoted accidentally.

## Stage 5 — Goals and quests

Deliver: goal CRUD/archive; quest lifecycle; multi-assignee; due dates; dependency graph; check-ins.

Exit gate: same-workspace constraints, cycle tests, and unauthorized mutation tests pass.

## Stage 6 — Timeline and basic Archives

Deliver: append-only activity events, workspace timeline, Markdown notes attached to goals/quests.

Exit gate: correct actor/context; notes remain private to workspace members.

## Stage 7 — Council

Deliver: proposal lifecycle, options, criteria, scoring, voting, decision record, follow-up actions.

## Stage 8 — Advanced Archives

Deliver: tags, collections, backlinks, full-text search; semantic search only after privacy and cost controls are defined.
