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
  revalidatePath(`/workspaces/${slug}/quests`);
  revalidatePath(`/workspaces/${slug}/archives`);
  revalidatePath(`/workspaces/${slug}/activity`);
}

function back(slug: string, error?: string, notice = "quest-updated"): never {
  if (!error) refreshWorkspace(slug);
  redirect(error
    ? `/workspaces/${slug}/quests?error=${encodeURIComponent(error)}`
    : `/workspaces/${slug}/quests?notice=${encodeURIComponent(notice)}`);
}

export async function createQuest(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const goalId = field(formData, "goalId") || null;
  const priority = field(formData, "priority");
  const dueDate = field(formData, "dueDate") || null;

  if (!validId(workspaceId) || title.length < 2 || title.length > 160 ||
      description.length > 6000 || !["low", "medium", "high", "urgent"].includes(priority) ||
      (goalId && !validId(goalId))) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser({ allowPlatformAdmin: true });
  const { error } = await supabase.from("quests").insert({
    workspace_id: workspaceId,
    goal_id: goalId,
    title,
    description,
    priority,
    due_date: dueDate,
    created_by: user.id,
  });
  back(slug, error ? "save" : undefined, "quest-created");
}

export async function updateQuestStatus(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const questId = field(formData, "questId");
  const status = field(formData, "status");
  if (!validId(workspaceId) || !validId(questId) ||
      !["backlog", "ready", "in_progress", "blocked", "done", "cancelled"].includes(status)) back(slug, "invalid");
  const { supabase } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data, error } = await supabase.from("quests").update({
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  }).eq("id", questId).eq("workspace_id", workspaceId).select("id").maybeSingle();
  back(slug, error || !data ? "save" : undefined, "quest-updated");
}

export async function assignQuest(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const questId = field(formData, "questId");
  const userId = field(formData, "userId");
  if (![workspaceId, questId, userId].every(validId)) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser({ allowPlatformAdmin: true });
  const { error } = await supabase.from("quest_assignees").upsert({
    workspace_id: workspaceId,
    quest_id: questId,
    user_id: userId,
    assigned_by: user.id,
  }, { onConflict: "quest_id,user_id", ignoreDuplicates: true });
  back(slug, error ? "assign" : undefined, "quest-assigned");
}

export async function addQuestCheckIn(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const questId = field(formData, "questId");
  const content = field(formData, "content");
  const progressRaw = field(formData, "progress");
  const progress = progressRaw ? Number(progressRaw) : null;
  if (!validId(workspaceId) || !validId(questId) || content.length < 1 || content.length > 3000 ||
      (progress !== null && (!Number.isInteger(progress) || progress < 0 || progress > 100))) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser({ allowPlatformAdmin: true });
  const { error } = await supabase.from("quest_check_ins").insert({
    workspace_id: workspaceId,
    quest_id: questId,
    content,
    progress,
    created_by: user.id,
  });
  back(slug, error ? "checkin" : undefined, "checkin-created");
}

export async function addQuestDependency(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const questId = field(formData, "questId");
  const dependsOnQuestId = field(formData, "dependsOnQuestId");
  if (![workspaceId, questId, dependsOnQuestId].every(validId) || questId === dependsOnQuestId) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser({ allowPlatformAdmin: true });
  const { error } = await supabase.from("quest_dependencies").insert({
    workspace_id: workspaceId,
    quest_id: questId,
    depends_on_quest_id: dependsOnQuestId,
    created_by: user.id,
  });
  back(slug, error ? "dependency" : undefined, "dependency-created");
}
