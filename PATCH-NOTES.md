# The Fellowship — Admin account deletion patch

## Included changes

- `src/app/admin/accounts/page.tsx`
  - Adds a per-user **Xóa tài khoản** panel.
  - Adds an Admin-only **Tạo mật khẩu + PIN mới** action; generated credentials are returned once to the authenticated Admin browser session.
  - Requires the administrator to enter the user's exact email before submitting.
  - Shows explicit success and failure messages.
  - Explains why passwords and recovery PINs cannot be displayed.
- `src/app/admin/actions.ts`
  - Adds a server action that calls the existing `account-recovery` Edge Function.
  - Revalidates the accounts page after a successful deletion.
- `src/app/admin/admin.module.css.append`
  - Contains only the new CSS rules. Append these rules to the end of the existing `src/app/admin/admin.module.css`; do not replace the original stylesheet.
- `supabase/functions/account-recovery/index.ts`
  - Adds the authenticated `delete-user` action.
  - Adds `admin-reset-credentials`, which re-checks active Platform Admin status, protects Admin accounts, updates the Supabase Auth password and bcrypt recovery PIN.
  - Re-checks the caller's platform-admin role and active status on the server.
  - Prevents deleting the current administrator or another platform-admin account.
  - Requires an exact email confirmation.
  - Prevents deleting a user who still owns a workspace.
  - Uses `auth.admin.deleteUser()` with the service key only inside the Edge Function.
  - Returns a clear blocked result when related foreign keys or Storage ownership prevent deletion.

## Important security behavior

- **Passwords are not viewable.** Supabase Auth stores bcrypt password hashes, not recoverable plaintext passwords.
- **Recovery PINs are not viewable.** This project hashes PINs using bcrypt before storing them in `public.account_recovery_pins`; the signup trigger removes the plaintext PIN from user metadata.
- The patch does not expose, return, or log password hashes, PIN hashes, service keys, or tokens.
- Account deletion is permanent and is deliberately blocked for platform admins, the currently signed-in admin, and workspace owners.
- Other records may have `ON DELETE RESTRICT` references to the account. In that case Auth deletion is rejected and the UI tells the admin to resolve the related records first. The patch does not silently erase Goals, Quests, Council decisions, Notes, invitations, or files.
- Supabase documents that deleting a user invalidates refresh sessions but already-issued access JWTs can remain valid until they expire. Membership rows cascade on account deletion, which removes workspace membership access.

## Apply to Local

1. Replace these two existing files with the included versions: `src/app/admin/accounts/page.tsx` and `src/app/admin/actions.ts`. The actions file preserves the existing suspension and workspace archive actions.
2. Append `src/app/admin/admin.module.css.append` to the end of your existing `src/app/admin/admin.module.css`. Do not replace the original stylesheet with the `.append` file.
3. Replace `supabase/functions/account-recovery/index.ts` with the included version.
4. Run the project checks:

   ```powershell
   npm run lint
   npm run typecheck
   npm run build
   ```

5. Deploy the updated Edge Function to the intended Supabase project when ready:

   ```powershell
   supabase functions deploy account-recovery --project-ref talkxkmkqliqpmdlqmrq
   ```

   The function already uses the project's managed `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEYS` environment. Do not put a service-role or secret key in `.env.local`, a `NEXT_PUBLIC_` variable, source code, or the browser.

6. Test in a non-production account first: delete an unused ordinary account with no owned workspace or referenced records, confirm the row disappears from the Admin list, then test that a platform-admin account and the signed-in Admin cannot be deleted.

## Not changed

- No GitHub writes, commits, pushes, deployments, or live Supabase data/schema changes were made during preparation of this patch.
- No migration is required for this version.

## One-time credential reset

- Admin generates a new password and six-digit recovery PIN for a regular user.
- Plaintext values are generated in a Next.js Server Action and returned only in that authenticated Admin action response. They are not placed in query strings, database rows, browser storage, or application logs.
- Password is stored by Supabase Auth; PIN is bcrypt-hashed in `account_recovery_pins`.
- Admin sees the values once and can copy them. Hiding the panel or reloading loses the plaintext values.
- Apply `supabase/migrations/20261113120000_admin_credential_reset.sql` before deploying the updated Edge Function.
- The private audit table records actor, target, and time only, never the generated password or PIN.
