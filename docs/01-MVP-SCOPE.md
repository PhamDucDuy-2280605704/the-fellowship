# MVP scope and release boundaries

The MVP is the smallest reliable collaboration loop: identity, workspace membership, Goals, Quests, assignments, dependencies, check-ins, activity history, and workspace notes. The repository now contains baseline implementations for membership administration, The Council, and The Archives; live authorization and cross-tenant verification are still release gates.

## Implemented baseline

- A registered user can create a workspace and becomes its Owner through a database trigger.
- Workspace pages and data are scoped to active members by server checks and PostgreSQL Row Level Security.
- Owner/Admin can invite members, revoke pending invitations, and manage permitted workspace roles. Members can leave; Owner must transfer ownership before leaving.
- Goals can be created and moved through their lifecycle.
- Quests can be linked to Goals, assigned to active workspace members, prioritized, dated, and moved through their lifecycle.
- Quest dependencies are constrained to one workspace; self-dependencies and cycles are rejected.
- Members can record Quest check-ins and progress.
- Activity events are appended for Goal, Quest, note, and Council proposal creation/updates.
- The Archives support workspace-level notes and archive/restore.
- The Council supports proposals, options, basic voting, and a decision record with rationale.
- Platform Admin can view account/workspace inventories, suspend/reactivate accounts, and archive/restore workspaces through database-guarded RPCs.

## Release acceptance criteria

The following must be verified before the MVP is treated as production-ready:

- A user creates a workspace and is assigned Owner.
- A non-member cannot read workspace details or related records by direct URL or database request.
- Owner cannot be removed or demoted through ordinary member management.
- Invitation links are single-use, expire, can be revoked, and are accepted only by the invited email identity.
- Quest assignees are active members of the same workspace.
- Dependencies cannot self-reference, cross workspaces, or create cycles.
- Unauthorized users and Viewer cannot mutate workspace data.
- Administrative RPCs reject non-admin callers; suspended accounts cannot access application data.
- Important activity records preserve actor, entity, action, and timestamp.
- Dependency, validation, type, lint, build, and route smoke checks pass.

## Deferred from the first reliable release

- Council weighted criteria, score aggregation, anonymous voting, and automatic follow-up tasks.
- Archives attachments, Markdown rendering, tags, collections, backlinks, full-text search, and semantic search.
- Notes directly linked to Goals, Quests, or Council decisions.
- Graph visualization, public API, complex notifications, and workflow automation.
- Real-time collaborative editing, billing, public social features, and autonomous AI assignment.

## Verification boundaries

The current automated unit suite covers workspace-slug validation and Quest dependency-cycle logic. GitHub Actions runs lint, typecheck, unit tests, dependency audit, production build, and route smoke tests. These checks do not simulate two live users or prove the complete RLS role matrix. Follow docs/08-AUTH-ONBOARDING.md before declaring the release production-verified.
