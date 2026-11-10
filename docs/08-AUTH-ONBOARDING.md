# Auth and workspace onboarding

Updated: 2026-11-10

## Implemented flow

1. A visitor creates an account at `/signup` using email, password, and display name.
2. Supabase Auth creates the identity. The database trigger creates `public.profiles`.
3. Hosted Supabase email confirmations are enabled by default for password Auth; the signup action sends the user to `/auth/callback` after confirmation.
4. The callback exchanges the PKCE code for a cookie-backed session.
5. The user reaches `/workspaces`, where they can create a workspace or open one they already belong to.
6. Workspace creation inserts a `public.workspaces` row. The database trigger creates an owner membership within the same transaction.
7. Workspace list/detail reads are scoped by RLS. Server pages also call `auth.getUser()` to verify the current user.

## Local configuration needed

Copy `.env.example` to `.env.local` and replace the publishable key placeholder with the active publishable key from the dedicated Supabase project.

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000` during local development.
- Redirect URL: `http://localhost:3000/auth/callback`.

When production hosting is configured, update the Site URL and add the exact production callback URL. Keep local and production entries separate and only allow domains owned by the application.

## Security notes

- Browser and server Supabase clients use the publishable key only.
- Server sessions use `@supabase/ssr` cookies and PKCE.
- The root Next.js Proxy calls `auth.getClaims()` to refresh sessions; it does not make authorization decisions.
- Protected pages/actions call `auth.getUser()` and database RLS remains the final data boundary.
- Workspace creation uses only the authenticated user's ID. RLS verifies `created_by = auth.uid()`.
- The client cannot directly insert, update, or delete `workspace_members`.
- Sign-in and sign-up errors are intentionally generic to avoid disclosing account existence.

## Live tests still required

Use two disposable email accounts after configuring local environment and Auth redirect URLs:

1. Register Alice and confirm her email. Verify a profile row is created.
2. Register Bob and confirm his email.
3. Sign in as Alice, create Workspace A, and verify Alice's role is `owner`.
4. Sign in as Bob, create Workspace B, and verify Bob is `owner`.
5. Verify Alice cannot see Workspace B by direct route and Bob cannot see Workspace A.
6. Verify both users can sign out and sign back in.
7. Test duplicate workspace slug and invalid workspace names.

These tests have not yet been run. Do not treat the onboarding flow as production-verified until they pass.
