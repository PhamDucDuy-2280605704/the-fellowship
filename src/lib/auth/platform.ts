import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireActiveUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { data: isActive, error: statusError } = await supabase.rpc("is_platform_user_active");
  if (statusError || !isActive) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  return { supabase, user: data.user };
}

export async function requirePlatformAdmin() {
  const session = await requireActiveUser();
  const { data: isAdmin, error } = await session.supabase.rpc("is_platform_admin");

  if (error || !isAdmin) {
    redirect("/workspaces");
  }

  return session;
}
