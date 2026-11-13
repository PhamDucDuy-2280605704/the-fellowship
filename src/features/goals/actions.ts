"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function validId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }

function refreshWorkspace(slug: string) {
  revalidatePath(`/workspaces/${slug}`);
  revalidatePath(`/workspaces/${slug}/goals`);
  revalidatePath(`/workspaces/${slug}/quests`);
  revalidatePath(`/workspaces/${slug}/archives`);
  revalidatePath(`/workspaces/${slug}/activity`);
}

function back(slug: string, error?: string, notice = "goal-updated"): never {
  if (!error) refreshWorkspace(slug);
  redirect(error
    ? `/workspaces/${slug}/goals?error=${encodeURIComponent(error)}`
    : `/workspaces/${slug}/goals?notice=${encodeURIComponent(notice)}`);
}

export async function createGoal(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const targetDate = field(formData, "targetDate") || null;

  if (!validId(workspaceId) || title.length < 2 || title.length > 140 || description.length > 4000) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser({ allowPlatformAdmin: true });
  const { error } = await supabase.from("goals").insert({
    workspace_id: workspaceId,
    title,
    description,
    target_date: targetDate,
    created_by: user.id,
  });
  back(slug, error ? "save" : undefined, "goal-created");
}

export async function updateGoalStatus(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const goalId = field(formData, "goalId");
  const status = field(formData, "status");
  if (!validId(workspaceId) || !validId(goalId) ||
      !["draft", "active", "on_hold", "completed", "archived"].includes(status)) back(slug, "invalid");
  const { supabase } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data, error } = await supabase.from("goals").update({
    status,
    archived_at: status === "archived" ? new Date().toISOString() : null,
  }).eq("id", goalId).eq("workspace_id", workspaceId).select("id").maybeSingle();
  back(slug, error || !data ? "save" : undefined, "goal-updated");
}
