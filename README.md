# The Fellowship

**A shared workspace for collaboration, decisions, and knowledge.**

> Version: 0.3.0 · Stage: MVP foundation and collaboration modules · Status: In development

The Fellowship helps a group move from a shared goal to coordinated work, deliberate decisions, and knowledge the group can reuse. The product connects the journey from goals and quests to decisions, notes, and outcomes.

## Product modules

1. **The Fellowship — execution:** workspaces, members, goals, quests, assignments, dependencies, check-ins, and progress.
2. **The Council — decisions:** proposals, options, one-member-one-vote polls, and recorded decisions with rationale.
3. **The Archives — knowledge:** workspace notes with archive and restore. Rich knowledge management is planned separately.

## Implemented application flows

### Identity and workspaces

- Email/password sign-up and sign-in with Supabase Auth, PKCE confirmation callback, cookie-backed sessions, and sign-out.
- Workspace list, creation, and overview. The creator becomes Owner through a database trigger.
- Workspace invitation links use random tokens stored as SHA-256 hashes, expire after seven days, and can be revoked.
- Member roster, workspace-scoped roles (Owner, Admin, Member, Viewer), role changes, member removal, and self-service leaving.
- Workspace settings for name and description.

### The Fellowship

- Create Goals, set target dates, and update their lifecycle status.
- Create Quests, link them to Goals, set priority and due date, and update status.
- Assign Quests to active workspace members.
- Add Quest dependencies. The database enforces same-workspace references, prevents self-dependencies, and rejects dependency cycles.
- Record check-ins and progress updates.

### The Council — baseline

- Create proposals with context and multiple options.
- Members can cast or change one vote per proposal while voting is open.
- Owner/Admin can open voting and record the chosen option with a written rationale.

Weighted criteria, score aggregation, anonymous voting, voting schedules, and follow-up task creation are not implemented yet.

### The Archives — baseline

- Create workspace-level notes and archive or restore them.
- Note content is currently stored and displayed as plain text; Markdown rendering, attachments, tags, collections, backlinks, and full-text or semantic search are not implemented yet.
- Notes are scoped to their workspace. They are not yet directly attached to an individual Goal, Quest, or Council decision.

### Activity and platform administration

- Database triggers append activity events when Goals, Quests, notes, and Council proposals are created or updated, including status changes.
- The workspace timeline shows up to the 100 most recent events for those entity types.
- The Admin Console provides account inventory, email-confirmation and last-login status, account suspension/reactivation, and workspace inventory with archive/restore.
- Platform-admin checks for privileged RPCs are enforced in PostgreSQL; the UI is not the security boundary.

## Access model

- **Platform Admin** is a platform-wide role, separate from workspace membership.
- **Owner, Admin, Member, and Viewer** are scoped to one workspace and can differ across a user's workspaces.
- Ordinary users can access only workspaces where they have active membership. Platform-admin access is a separately authorized exception.
- Viewer is read-only. Workspace and profile data are protected by PostgreSQL Row Level Security (RLS).
- The application has no guest or anonymous workspace mode.

## Technology

- Next.js App Router 16, React 19, TypeScript
- Supabase Auth, PostgreSQL, and Row Level Security
- `@supabase/ssr` for cookie-based Next.js sessions
- GitHub Actions for dependency audit, lint, typecheck, unit tests, production build, and route smoke tests

## Source and asset layout

- `src/app`: Next.js routes, route handlers, and route-specific styles.
- `src/components/navigation`: shared navigation patterns.
- `src/components/ui`: reusable icons and interface components.
- `src/features/<domain>`: domain-specific server actions and workflows.
- `src/lib/auth`, `src/lib/domain`, `src/lib/supabase`: authentication, domain utilities, and data clients.
- `public/images/backgrounds`: locally served shared background artwork.
- `supabase/migrations` and `supabase/functions`: database migrations and Edge Functions.
- `docs`: product, architecture, access-control, and onboarding documentation.

Keep route files in `src/app`; move reusable interface code into `src/components` and business workflows into the matching `src/features` domain.

## Supabase environment

Dedicated Supabase Free project:

- Project ref: `talkxkmkqliqpmdlqmrq`
- Project URL: `https://talkxkmkqliqpmdlqmrq.supabase.co`
- Region: Singapore

Copy `.env.example` to `.env.local`, set the publishable key, and keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development. Add `http://localhost:3000/auth/callback` to Supabase Auth → URL Configuration → Redirect URLs. Configure the exact production URL and callback before enabling production signup. Never commit service-role keys or other secrets.

## Local development

Requirements: Node.js 22 and npm.

    npm ci
    cp .env.example .env.local
    npm run dev

On Windows PowerShell:

    Copy-Item .env.example .env.local

Open http://localhost:3000.

## Quality checks

    npm run lint
    npm run typecheck
    npm test
    npm run build
    npm run test:smoke

The unit-test suite currently covers workspace-slug validation and Quest dependency-cycle logic. CI also runs a production dependency audit and route smoke tests. Passing CI does not replace live authentication, cross-tenant, and role-matrix verification.

## Database

Database migrations are kept in `supabase/migrations`. The current migration history includes the workspace foundation, creator index and insert restrictions, platform-admin registry and hardened admin RPCs, collaboration modules, and activity/workspace lifecycle.

See [Access control](docs/04-ACCESS-CONTROL.md), [Supabase foundation notes](docs/07-SUPABASE-FOUNDATION.md), and [Auth onboarding notes](docs/08-AUTH-ONBOARDING.md).

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
