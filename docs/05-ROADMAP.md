# Roadmap and stage gates

## Stage 1 — Repository and app foundation

**Status: completed**

- Dedicated repository and Next.js/TypeScript shell.
- Pinned framework dependencies and lockfile.
- ESLint, TypeScript, tests, GitHub Actions.
- Health endpoint and route smoke check.

Exit gate passed: CI lint, typecheck, unit tests, production build, and route smoke checks all passed.

## Stage 2 — Supabase foundation

**Status: database foundation deployed; auth and RLS integration tests pending**

- [x] Dedicated Supabase Free project in Singapore.
- [x] Initial schema for profiles, workspaces, and workspace members.
- [x] RLS enabled and explicit API grants.
- [x] Workspace creator is provisioned as owner by a database trigger.
- [x] Migration files match the versions recorded in the project.
- [x] Security Advisor returned no findings after the initial schema.
- [x] TypeScript database types generated.
- [ ] Add local/Vercel environment variables securely.
- [x] Implement email/password signup, login, PKCE callback, and signout routes/actions.
- [ ] Configure and verify email Auth behavior and redirect URLs in Supabase Dashboard.
- [ ] Create disposable test Auth users.
- [ ] Run positive and negative RLS tests for Owner, Admin, Member, Viewer, and non-member.
- [x] Re-run CI after SSR and onboarding integration commits.

Exit gate: clean install, lint, typecheck, tests, build and smoke checks pass; Auth works; tenant-isolation denial tests pass. No real credentials committed.

## Stage 3 — Workspaces and membership

Deliver: create/list workspace; invitation create/accept/revoke; member list and role management.

Exit gate: role matrix enforced in UI and database; owner cannot be removed or demoted accidentally.

## Stage 4 — Goals and quests

Deliver: goal CRUD/archive; quest lifecycle; multi-assignee; due dates; dependency graph; check-ins.

Exit gate: same-workspace constraints, cycle tests, and unauthorized mutation tests pass.

## Stage 5 — Timeline and basic Archives

Deliver: append-only activity events, workspace timeline, Markdown notes attached to goals/quests.

Exit gate: correct actor/context; notes remain private to workspace members.

## Stage 6 — Council

Deliver: proposal lifecycle, options, criteria, scoring, voting, decision record, follow-up actions.

Exit gate: eligibility, anonymity semantics, tie handling, and finalization rules tested.

## Stage 7 — Advanced Archives

Deliver: tags, collections, backlinks, source citations, full-text search. Semantic search only after retention, privacy, and cost controls are defined.

Exit gate: search obeys workspace isolation and preserves source attribution.
