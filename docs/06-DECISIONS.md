# Architecture decision records

## ADR-001 — Keep The Fellowship independent from Little Story World

**Status:** Accepted for foundation work · **Date:** 2026-11-10

Little Story World is a deployed product with real users, private media, auth configuration, policies, Edge Functions, and a migration history that requires reconciliation. The Fellowship therefore gets a separate repository, dedicated Supabase project, separate Storage buckets, and separate environment variables. Reuse engineering patterns only after reviewing them in context.

## ADR-002 — Workspace-scoped authorization

**Status:** Accepted for foundation work · **Date:** 2026-11-10

A person may participate in multiple independent teams and have a different role in each. Store role in workspace_members per (workspace_id, user_id); do not attach one global authorization role to the profile.

## ADR-003 — Deliver collaboration before advanced Council and Archives

**Status:** Accepted for MVP planning · **Date:** 2026-11-10

First deliver workspaces, goals, quests, assignments, dependencies, check-ins, activity, and lightweight notes. Add weighted voting, graph/backlinks, and AI search only after the collaboration loop is reliable.
