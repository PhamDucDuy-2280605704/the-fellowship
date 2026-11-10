# Roadmap and stage gates

This roadmap distinguishes implemented code from live verification and from capabilities that remain planned. A feature appearing in the UI or repository is not considered production-verified until its authentication, authorization, and database behavior have been tested against the live environment.

## Stage 1 — Repository and app foundation

**Status: implementation complete**

- Dedicated repository and Next.js/TypeScript application.
- ESLint, TypeScript, unit tests, GitHub Actions.
- Health endpoint and production route smoke check.

## Stage 2 — Supabase and authentication foundation

**Status: implementation complete; live onboarding verification pending**

- Dedicated Supabase project and initial schema.
- RLS, explicit API grants, workspace-owner trigger.
- Email/password signup, login, PKCE callback, and sign-out.
- Separate platform-admin registry and active-user checks.
- Server-guarded Admin RPCs.

**Remaining gate:** verify production URL allow-lists and email callback, then run the two-account onboarding and cross-workspace isolation tests in docs/08-AUTH-ONBOARDING.md.

## Stage 3 — Platform administration

**Status: implementation integrated; live role verification pending**

- Admin-only dashboard and navigation.
- Account inventory with email-confirmation and last-login status.
- User suspension/reactivation.
- Global workspace inventory and archive/restore.
- PostgreSQL checks on administrative RPCs; non-admin access is rejected by the server-side guard.

**Remaining gate:** test Admin and non-admin accounts separately, including suspension and restoration, against the live database.

## Stage 4 — Workspaces and membership

**Status: baseline implementation complete**

- Workspace creation and Owner assignment.
- Invitation create, accept, and revoke; hashed one-time tokens with a seven-day expiry.
- Member roster, workspace role changes, member removal, and self-service leaving.
- Workspace name and description settings.

**Remaining gate:** verify the full role matrix, invitation email matching/expiry/revocation, and Owner protection with separate accounts.

## Stage 5 — Goals and Quests

**Status: baseline implementation complete**

- Goal creation, target date, and status/archive lifecycle.
- Quest creation, Goal association, priority, due date, and status lifecycle.
- Quest assignment to active workspace members.
- Same-workspace dependency constraints and database cycle prevention.
- Quest check-ins and progress values.

**Remaining gate:** expand integration tests for unauthorized mutations, role restrictions, assignment constraints, and invalid status transitions. The current unit suite covers the dependency-cycle domain logic but is not a substitute for live RLS tests.

## Stage 6 — Timeline and basic Archives

**Status: baseline implementation complete**

- Append-only events for Goal, Quest, note, and Council proposal creation/updates.
- Workspace activity timeline, limited to the 100 most recent events.
- Workspace-level notes with archive and restore.

**Known boundaries:** notes are not yet linked directly to Goals, Quests, or decisions; Markdown is not rendered; attachments, tags, collections, backlinks, and search remain planned.

**Remaining gate:** verify event actor/context, append-only behavior, and workspace privacy against the live database.

## Stage 7 — The Council

**Status: advanced implementation integrated; live role and workflow verification pending**

- Proposal with context, option descriptions, weighted criteria, and optional closing time.
- One-member-one-vote ballots with an aggregate-only summary RPC. Final revocation of legacy direct ballot-table grants is gated on deploying the new frontend; compatibility grants are temporarily retained for the currently deployed page.
- Member scoring of each option against weighted criteria, with a normalized 0–100 summary.
- Owner/Admin controls to open voting, record the selected option and rationale, and archive proposals.
- Decision flow can create a follow-up Quest.

**Remaining gate:** deploy the new frontend, revoke legacy direct ballot-table grants, then verify ballot summaries, vote replacement, scoring permissions, close-time enforcement, decision creation, and follow-up Quest behavior using separate accounts.

## Stage 8 — Advanced Archives

**Status: core advanced implementation integrated; live role verification pending**

- Safe lightweight Markdown rendering and editing.
- Notes linked to Goals, Quests, and Council proposals within the same workspace.
- Tags, tag filters, and indexed full-text search over titles, content, and tags.
- Archive and restore lifecycle retained.

**Still planned:** collections, backlinks, attachments, and semantic search after privacy, access-control, and cost requirements are defined.

## Release gate — before calling the MVP production-verified

- Run signup, confirmation, sign-in, sign-out, and workspace creation with at least two disposable accounts.
- Verify that each account cannot read or mutate another account's workspace.
- Verify Owner, Admin, Member, and Viewer permissions, including Owner protection.
- Verify invitation expiry, email matching, revocation, and role assignment.
- Run the full CI workflow: dependency audit, lint, typecheck, unit tests, production build, and route smoke tests.
- Verify a successful Vercel deployment for the same commit as the current main branch.
