# Workspace authorization model

## Role matrix — first proposal

| Capability | Owner | Admin | Member | Viewer |
|---|---:|---:|---:|---:|
| View workspace and active work | Yes | Yes | Yes | Yes |
| Update workspace settings | Yes | Yes | No | No |
| Invite members | Yes | Yes | No | No |
| Change member role | Yes | Limited | No | No |
| Remove members | Yes | Limited | No | No |
| Transfer ownership | Yes | No | No | No |
| Create/edit goals | Yes | Yes | Yes | No |
| Create/edit quests | Yes | Yes | Yes | No |
| Assign workspace members | Yes | Yes | Yes* | No |
| Add check-ins | Yes | Yes | Yes | No |
| Create/edit notes | Yes | Yes | Yes | No |
| Archive workspace | Yes | No | No | No |

Admin cannot remove, demote, or transfer the owner, nor promote another user to owner. A member may assign only active members of the same workspace; this can be narrowed to Admin/quest owner later.

## Authorization source of truth

- `workspace_members.role` is the authority for workspace role.
- `auth.uid()` is the authority for the authenticated user.
- Never trust role, workspace ID, user ID, or permission claims supplied only by the browser.
- Never use user-editable Supabase user metadata for authorization.

## Required isolation tests

For Alice and Bob in separate workspaces:
- Alice cannot read Bob's workspace, goals, quests, notes, files, or events.
- Alice cannot insert a row referencing Bob's workspace.
- Alice cannot update a row by changing workspace_id.
- Alice cannot assign a non-member.
- A viewer cannot mutate data through direct API/database calls.
- A removed member loses access on subsequent authorized requests and Realtime subscriptions.

## RLS cautions

- Enable RLS on every exposed public table.
- Policies check actual workspace membership, not merely TO authenticated.
- UPDATE policies need both USING and WITH CHECK.
- Avoid recursive policies on workspace_members.
- Views must not accidentally bypass RLS; use security_invoker where supported or restrict access.
- Avoid SECURITY DEFINER as a shortcut. If unavoidable, use a non-exposed schema, restricted grants, fixed search_path, explicit identity checks, and advisor review.

## Invitations

Invitations are scoped to a workspace and normalized email. Only owner/admin may create or revoke. Store a hash of a random, single-use, time-limited token. Acceptance binds the invite to the authenticated account's invited email and rechecks validity.
