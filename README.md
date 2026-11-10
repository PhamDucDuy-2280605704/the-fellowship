# The Fellowship

**A workspace for collaboration, decisions, and shared knowledge.**

> Version: 0.3.0 · Stage: Auth and workspace onboarding · Status: In development

The Fellowship helps a group move from a shared goal to coordinated work, deliberate decisions, and knowledge the group can reuse.

## Product modules

1. **The Fellowship** — workspaces, members, goals, quests, assignments, dependencies, and progress.
2. **The Council** — proposals, options, weighted criteria, votes, and decision records.
3. **The Archives** — notes, documents, tags, collections, backlinks, and later semantic search.

## Technology

- Next.js App Router 16 + React 19 + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- `@supabase/ssr` for cookie-based Next.js sessions
- Supabase Realtime and private Storage (planned)
- GitHub Actions CI

## Supabase environment

Dedicated Supabase Free project:
- Project ref: `talkxkmkqliqpmdlqmrq`
- Project URL: `https://talkxkmkqliqpmdlqmrq.supabase.co`
- Region: Singapore

Copy `.env.example` to `.env.local` and set the publishable key. Add `http://localhost:3000/auth/callback` to Supabase Auth → URL Configuration → Redirect URLs. When production hosting is connected, add its callback URL too. Do not commit secret/service-role keys.

## Implemented application flows

- Email/password sign-up and sign-in using Supabase SSR cookies.
- PKCE email confirmation callback at `/auth/callback`.
- Workspace list, create, and overview pages.
- Workspace creator becomes Owner through a database trigger.
- Workspace and profile reads are protected by RLS.

Auth email confirmation, redirect allow-list, and cross-workspace behavior still need live testing with real Auth accounts. Member invitations and member roster administration are not implemented yet.

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

## Database

Current schema: `profiles`, `workspaces`, and `workspace_members`. RLS is enabled on all three. See [Supabase foundation notes](docs/07-SUPABASE-FOUNDATION.md) and [Auth onboarding notes](docs/08-AUTH-ONBOARDING.md).

## Product and architecture documents

- [Product brief](docs/00-PRODUCT-BRIEF.md)
- [MVP scope](docs/01-MVP-SCOPE.md)
- [Domain model](docs/02-DOMAIN-MODEL.md)
- [Architecture](docs/03-ARCHITECTURE.md)
- [Access control](docs/04-ACCESS-CONTROL.md)
- [Roadmap](docs/05-ROADMAP.md)
- [Architecture decisions](docs/06-DECISIONS.md)
- [Supabase foundation](docs/07-SUPABASE-FOUNDATION.md)
- [Auth onboarding](docs/08-AUTH-ONBOARDING.md)
