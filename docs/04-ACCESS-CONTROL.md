# Access control

## Platform roles

The platform has two account classes and no guest role:

| Role | Scope | Capabilities |
|---|---|---|
| Admin | Entire platform | View every account and workspace; suspend/reactivate User accounts; archive/restore workspaces |
| User | Own memberships | Create workspaces; become Owner of a workspace; access only workspaces with active membership |

The platform administrator is stored in `private.platform_admins`, outside the exposed Data API schema. The table has no grants to browser roles. Admin status is checked by a private, SECURITY DEFINER helper and narrow public RPC wrappers. It is not derived from editable profile metadata or a client-supplied field.

## Workspace roles

Workspace roles remain independent from platform roles:

- Owner — accountable workspace creator; protected from ordinary membership removal.
- Admin — manages the workspace.
- Member — contributes to workspace work.
- Viewer — read-only participant.

An Owner or workspace Admin never receives platform-wide Admin access.

## Enforcement

- RLS is enabled on exposed application tables.
- Admin inventory RPCs check `private.is_platform_admin()` before returning auth account data or all workspaces.
- Admin suspension and archive RPCs check the same server-side identity. Public wrappers execute as the caller and delegate to guarded functions in the unexposed private schema.
- A restrictive `is_platform_user_active()` policy blocks suspended users from application tables.
- The Next.js server checks account activity before rendering protected workspace routes or accepting workspace creation.
- A platform Admin cannot suspend their own account.
- Workspace archive/restore is reversible; it does not delete the workspace or its history.
- Account suspension is reversible; it does not delete the Auth identity or application data.

## Operational notes

When promoting the initial platform Admin in a fresh project, insert that verified Auth user's UUID into `private.platform_admins` from the Supabase SQL editor using a trusted database-admin session. Never expose direct write privileges to this table through the Data API. Do not grant platform Admin based on `user_metadata`.

## Still to implement

Invitation creation/acceptance, workspace member roster management for Owners, and richer activity auditing remain planned. Platform Admin inventory and account suspension are implemented separately from those workspace-level tools.
