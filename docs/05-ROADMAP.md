# Roadmap and stage gates

## Stage 1 — Repository and app foundation

Deliver: dedicated repository; Next.js/TypeScript shell; pinned framework dependencies and lockfile; lint, typecheck, tests, GitHub Actions; safe environment guide.

Exit gate: clean install, lint, typecheck, tests, build and smoke checks pass; no real credentials committed.

## Stage 2 — Supabase foundation

Deliver: dedicated Supabase project; Auth configuration; reviewed initial schema and generated types; RLS for profiles/workspaces/membership; disposable test data and tenant-isolation tests.

Exit gate: positive and negative access tests pass for Owner, Admin, Member, Viewer, and non-member. No migration touches little-story-world.

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

Deliver: proposal lifecycle, options, criteria, scoring, voting, decision record, follow-up quests.

Exit gate: eligibility, anonymity semantics, tie handling, and finalization rules tested.

## Stage 7 — Advanced Archives

Deliver: tags, collections, backlinks, full-text search. Semantic search only after retention, privacy, and cost controls are defined.

Exit gate: search obeys workspace isolation and preserves source attribution.
