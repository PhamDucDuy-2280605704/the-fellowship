# MVP scope and release boundaries

This file defines the first usable release and intentionally excludes full Council and advanced knowledge graph work. The core MVP is the collaboration loop: identity, workspace, membership, goals, quests, assignments, dependency validation, check-ins, activity timeline, and lightweight notes.

Release 1 acceptance criteria:
- A user creates a workspace and becomes its owner.
- Non-members cannot access that workspace.
- Owner cannot be removed or demoted through normal member management.
- Quest assignees are active members of the same workspace.
- Dependencies cannot self-reference, cross workspaces, or create cycles.
- Status transitions are enforced server-side/database-side.
- Supported important actions create append-only activity events.
- Viewer cannot mutate workspace data.
- Tests cover both allowed and denied authorization paths.
- Lint, typecheck, unit tests, production build, and smoke tests pass.

Deferred: Council weighted scoring and anonymous voting; graph visualization; AI semantic search; public API; complex notifications; workflow automation. Later releases add Council first, then advanced Archives.
