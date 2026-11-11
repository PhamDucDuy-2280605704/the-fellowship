import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requireActiveUser(options: { allowPlatformAdmin?: boolean; allowMissingRecoveryPin?: boolean } = {}) {
  const supabase = await createClient();

  // Run independent checks together. current_user_access combines the active
  // account and platform-admin checks into one authenticated database request.
  const pinStatusRequest = options.allowMissingRecoveryPin
    ? Promise.resolve({ data: true, error: null })
    : supabase.rpc("has_own_account_recovery_pin");

  const [userResult, accessResult, pinResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("current_user_access"),
    pinStatusRequest,
  ]);

  if (userResult.error || !userResult.data.user) {
    const requestHeaders = await headers();
    const privateAdminPath = requestHeaders.get("x-private-admin-path");
    const safePrivateAdminPath = privateAdminPath
      && (privateAdminPath === "/the-stewards-hall" || privateAdminPath.startsWith("/the-stewards-hall/"))
      && !privateAdminPath.startsWith("//")
      && !privateAdminPath.includes(String.fromCharCode(92))
      ? privateAdminPath
      : null;
    redirect(safePrivateAdminPath
      ? `/the-stewards-hall/login?next=${encodeURIComponent(safePrivateAdminPath)}`
      : "/login");
  }

  const access = accessResult.data?.[0];
  if (accessResult.error || !access) {
    await supabase.auth.signOut();
    redirect("/login?error=role-check");
  }
  if (!access.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  const isPlatformAdmin = access.is_admin === true;

  if (!options.allowMissingRecoveryPin) {
    if (pinResult.error) {
      await supabase.auth.signOut();
      redirect(isPlatformAdmin ? "/the-stewards-hall/login?error=pin-check" : "/login?error=pin-check");
    }
    if (pinResult.data !== true) redirect("/recovery-pin");
  }

  if (isPlatformAdmin && !options.allowPlatformAdmin) redirect("/the-stewards-hall");

  return { supabase, user: userResult.data.user, isPlatformAdmin };
}

export async function requirePlatformAdmin() {
  const session = await requireActiveUser({ allowPlatformAdmin: true });

  if (!session.isPlatformAdmin) {
    await session.supabase.auth.signOut();
    redirect("/login?error=wrong-portal");
  }

  return session;
}
