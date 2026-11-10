# Supabase setup — not yet provisioned

This folder intentionally contains no executable migrations.

Before creating schema:

1. Create or select a dedicated Supabase project for The Fellowship.
2. Confirm project region, Auth providers, email/invitation flow, and data retention expectations.
3. Review `docs/02-DOMAIN-MODEL.md` and `docs/04-ACCESS-CONTROL.md`.
4. Verify current Supabase documentation and CLI version.
5. Implement the first schema only for profiles, workspaces, and memberships.
6. Test RLS with at least two users in different workspaces before adding goals or quests.

Never run Fellowship migrations against `little-story-world`.
