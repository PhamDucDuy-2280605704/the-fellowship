"use server";

import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function setUserSuspension(formData: FormData): Promise<void> {
  const userId = field(formData, "userId");
  const shouldSuspend = field(formData, "shouldSuspend") === "true";
  const reason = field(formData, "reason");

  if (!/^[0-9a-f-]{36}$/i.test(userId) || (shouldSuspend && !reason) || reason.length > 500) {
    redirect("/the-stewards-hall/accounts?error=invalid-input");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("admin_set_user_suspension", {
    p_user_id: userId,
    p_is_suspended: shouldSuspend,
    p_reason: reason || undefined,
  });

  if (error) {
    redirect("/the-stewards-hall/accounts?error=update-failed");
  }

  redirect(shouldSuspend ? "/the-stewards-hall/accounts?notice=suspended" : "/the-stewards-hall/accounts?notice=restored");
}

export async function setWorkspaceArchived(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const shouldArchive = field(formData, "shouldArchive") === "true";

  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    redirect("/the-stewards-hall/workspaces?error=invalid-input");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("admin_set_workspace_archived", {
    p_workspace_id: workspaceId,
    p_is_archived: shouldArchive,
  });

  if (error) {
    redirect("/the-stewards-hall/workspaces?error=update-failed");
  }

  redirect(shouldArchive ? "/the-stewards-hall/workspaces?notice=archived" : "/the-stewards-hall/workspaces?notice=restored");
}
