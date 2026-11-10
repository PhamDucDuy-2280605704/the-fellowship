# The Fellowship

**A workspace for collaboration, decisions, and shared knowledge.**

> Stage: Application foundation · Version: 0.1.0 · Status: In development

The Fellowship helps a group move from a shared goal to coordinated work, deliberate decisions, and knowledge the group can reuse.

## Product modules

1. **The Fellowship** — workspaces, members, goals, quests, assignments, dependencies, and progress.
2. **The Council** — proposals, options, weighted criteria, votes, and decision records.
3. **The Archives** — notes, documents, tags, collections, backlinks, and later semantic search.

## First release

The first release focuses on a useful collaboration loop: workspaces and memberships, goals and quests, multiple assignees, dependency tracking, a workspace activity timeline, and basic notes. Council and advanced Archives capabilities are phased after that loop is reliable.

## Technology baseline

- Next.js App Router + React + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security (not connected yet)
- Supabase Realtime and private Storage (planned)
- Vercel deployment (not connected yet)
- GitHub Actions CI

The Next.js and React versions are pinned and a lockfile is committed. Do not copy production credentials, schemas, or migrations from `little-story-world`.

## Local development

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
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

## Environment

The current app shell does not require Supabase credentials. Copy `.env.example` to `.env.local` when the dedicated Supabase project is configured.

Never commit `.env.local`, Supabase secret/service-role keys, access tokens, or private user data.

## Product and architecture documents

- [Product brief](docs/00-PRODUCT-BRIEF.md)
- [MVP scope](docs/01-MVP-SCOPE.md)
- [Domain model](docs/02-DOMAIN-MODEL.md)
- [Architecture](docs/03-ARCHITECTURE.md)
- [Access control](docs/04-ACCESS-CONTROL.md)
- [Roadmap](docs/05-ROADMAP.md)
- [Architecture decisions](docs/06-DECISIONS.md)
- [Supabase setup notes](supabase/README.md)

## Implementation status

This repository contains the product design baseline and initial application shell. Authentication, database schema, RLS, invitations, goals, quests, and collaboration workflows are not implemented yet.
