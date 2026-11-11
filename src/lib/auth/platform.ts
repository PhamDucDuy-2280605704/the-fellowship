import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requireActiveUser(options: { allowPlatformAdmin?: boolean } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
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

  const { data: isActive, error: statusError } = await supabase.rpc("is_platform_user_active");
  if (statusError || !isActive) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  const { data: isPlatformAdmin, error: roleError } = await supabase.rpc("is_platform_admin");
  if (roleError) {
    await supabase.auth.signOut();
    redirect("/login?error=role-check");
  }
  if (isPlatformAdmin === true && !options.allowPlatformAdmin) redirect("/the-stewards-hall");

  return { supabase, user: data.user };
}

export async function requirePlatformAdmin() {
  const session = await requireActiveUser({ allowPlatformAdmin: true });
  const { data: isAdmin, error } = await session.supabase.rpc("is_platform_admin");

  if (error || !isAdmin) {
    await session.supabase.auth.signOut();
    redirect("/login?error=wrong-portal");
  }

  return session;
}
