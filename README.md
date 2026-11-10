# The Fellowship

**A workspace for collaboration, decisions, and shared knowledge.**

> Version: 0.4.0 · Stage: Platform administration and workspace onboarding · Status: In development

The Fellowship helps groups move from a shared goal to coordinated work, deliberate decisions, and knowledge the group can reuse.

## Product modules

1. **The Fellowship** — workspaces, members, goals, quests, assignments, dependencies, and progress.
2. **The Council** — proposals, options, weighted criteria, votes, and decision records.
3. **The Archives** — notes, documents, tags, collections, backlinks, and later semantic search.

## Platform roles

- **Admin** — one platform administrator manages all registered accounts and every workspace from `/admin`.
- **User** — every registered member can create and own workspaces, and can only access workspaces where they have active membership.
- There is no guest account or anonymous application workspace.

Workspace roles (Owner, Admin, Member, Viewer) are scoped to an individual workspace. They do not grant platform-wide administration.

The Admin Console provides account inventory, email-confirmation and last-login status, account suspension/reactivation, workspace inventory, and workspace archive/restore actions. The account and workspace RPCs enforce the platform-admin check in PostgreSQL; the UI is not the security boundary.

## Technology

- Next.js App Router 16 + React 19 + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- `@supabase/ssr` for cookie-based Next.js sessions
- GitHub Actions CI

## Supabase environment

Dedicated Supabase Free project:
- Project ref: `talkxkmkqliqpmdlqmrq`
- Project URL: `https://talkxkmkqliqpmdlqmrq.supabase.co`
- Region: Singapore

Copy `.env.example` to `.env.local`, set the publishable key, and keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development. Add `http://localhost:3000/auth/callback` to Supabase Auth → URL Configuration → Redirect URLs. Do not commit secret/service-role keys.

## Implemented application flows

- Email/password sign-up and sign-in using Supabase SSR cookies.
- PKCE email confirmation callback at `/auth/callback`.
- Workspace list, create, and overview pages.
- Workspace creator becomes Owner through a database trigger.
- Admin-only account and workspace inventory, suspension/reactivation, and archive/restore.
- Active-account checks on protected application pages and workspace creation.
- Workspace and profile data remain protected by RLS.

Member invitations, member roster administration inside the User workspace, and the Goals/Quests modules are still planned work. A suspended account is blocked from application data access; its Auth identity is retained so the Admin can restore it.

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

Core tables: `profiles`, `workspaces`, and `workspace_members`. Platform administration is stored in the unexposed `private` schema. The active database includes migrations `20261110072318_platform_admin_and_account_management` and `20261110072520_secure_admin_rpc_and_rls_policies`. See [Access control](docs/04-ACCESS-CONTROL.md), [Supabase foundation notes](docs/07-SUPABASE-FOUNDATION.md), and [Auth onboarding notes](docs/08-AUTH-ONBOARDING.md).

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
