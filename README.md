# The Fellowship

**A workspace for collaboration, decisions, and shared knowledge.**

> Version: 0.2.0 · Stage: Supabase foundation · Status: In development

The Fellowship helps a group move from a shared goal to coordinated work, deliberate decisions, and knowledge the group can reuse.

## Product modules

1. **The Fellowship** — workspaces, members, goals, quests, assignments, dependencies, and progress.
2. **The Council** — proposals, options, weighted criteria, votes, and decision records.
3. **The Archives** — notes, documents, tags, collections, backlinks, and later semantic search.

## First release

The first release focuses on a useful collaboration loop: workspaces and memberships, goals and quests, multiple assignees, dependency tracking, a workspace activity timeline, and basic notes. Council and advanced Archives capabilities are phased after that loop is reliable.

## Technology

- Next.js App Router 16 + React 19 + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- `@supabase/ssr` for cookie-based Next.js sessions
- Supabase Realtime and private Storage (planned)
- GitHub Actions CI
- Vercel deployment (not connected yet)

## Supabase environment

A dedicated Supabase Free project has been created for this repository in Singapore:

- Project ref: `talkxkmkqliqpmdlqmrq`
- Project URL: `https://talkxkmkqliqpmdlqmrq.supabase.co`
- Database: PostgreSQL 17

Copy `.env.example` to `.env.local` and add the project's publishable key from Supabase Dashboard. Do not copy secret/service-role keys into browser environment variables or Git.

## Local development

Requirements: Node.js 22 and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:smoke
```

## Database foundation currently deployed

The dedicated Supabase database contains:
- `profiles` — a user's own profile record.
- `workspaces` — workspace boundary and settings.
- `workspace_members` — workspace-scoped roles and membership state.

Row Level Security is enabled on all three tables. Membership rows cannot be inserted or updated directly by browser clients. A database trigger creates the owner membership when an authenticated user creates a workspace. See [Supabase foundation notes](docs/07-SUPABASE-FOUNDATION.md).

Authentication UI, member invitations, workspace roster administration, goals, and quests are not implemented yet. End-to-end tests with real Auth users remain a release gate.

## Product and architecture documents

- [Product brief](docs/00-PRODUCT-BRIEF.md)
- [MVP scope](docs/01-MVP-SCOPE.md)
- [Domain model](docs/02-DOMAIN-MODEL.md)
- [Architecture](docs/03-ARCHITECTURE.md)
- [Access control](docs/04-ACCESS-CONTROL.md)
- [Roadmap](docs/05-ROADMAP.md)
- [Architecture decisions](docs/06-DECISIONS.md)
- [Supabase foundation](docs/07-SUPABASE-FOUNDATION.md)
