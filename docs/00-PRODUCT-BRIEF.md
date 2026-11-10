# Product brief — The Fellowship

## Product statement

The Fellowship is a shared workspace where a group coordinates work, records decisions, and preserves useful knowledge. It should make the relationship between goal → quest → decision → knowledge → outcome visible instead of scattering it across unrelated tools.

## Problems to solve

1. Work is scattered; members cannot see the overall goal, owners, blockers, or deadlines in one place.
2. Important decisions lose their options, trade-offs, and rationale; the same debate repeats.
3. Notes and project knowledge become detached from the work that created them, making handover difficult.

## Target users

Student project teams, small product or engineering squads, clubs, volunteer groups, and small teams needing lightweight governance and durable project memory.

## Product principles

- Workspace isolation: users only see information for workspaces they are authorized to access.
- Traceability: important changes have an actor, timestamp, and context.
- Low ceremony: the core task flow must remain quicker than maintaining separate spreadsheets and chat threads.
- Explicit ownership: goals and quests have accountable owners or assignees.
- Knowledge in context: notes link to the goal, quest, or decision they explain.
- Progressive complexity: ship a useful collaboration loop before advanced voting, graph, and AI features.

## Modules

- The Fellowship — execution: workspaces, members, goals, quests, assignments, dependencies, check-ins, progress.
- The Council — decisions: proposals, options, pros/cons/risks, weighted criteria, votes, rationale, follow-up actions.
- The Archives — knowledge: notes, links, documents, code snippets, tags, collections, backlinks, full-text search, later semantic search.

## Primary journey

Create a workspace → invite members → define a goal → break it into quests → assign and track work → attach context and notes → retain a traceable activity timeline.

## Non-goals for the first release

No full Jira/Linear/Notion/Slack replacement, public social network, billing, real-time collaborative editor, autonomous AI assignment, or general-purpose graph visualization.

## Product boundary

This is a separate product and repository from `little-story-world`. Reuse general engineering patterns only; never reuse its business tables, production database, user records, storage buckets, access keys, or migrations.
