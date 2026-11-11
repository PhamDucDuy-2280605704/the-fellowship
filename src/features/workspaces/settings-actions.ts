"use server";

import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateWorkspaceDetails(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const name = field(formData, "name");
  const description = field(formData, "description");
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      name.length < 2 || name.length > 80 || description.length > 1000) {
    redirect(`/workspaces/${slug}/settings?error=invalid`);
  }

  const { supabase } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data, error } = await supabase.from("workspaces").update({ name, description }).eq("id", workspaceId).select("id").maybeSingle();
  redirect(error || !data ? `/workspaces/${slug}/settings?error=save` : `/workspaces/${slug}/settings?notice=saved`);
}
