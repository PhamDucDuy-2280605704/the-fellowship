"use server";

import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function validId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }
function optionalId(value: string) { return value === "" ? null : validId(value) ? value : undefined; }
function readTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) =>
    tag.trim().toLocaleLowerCase("vi").replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 32)
  ).filter(Boolean))].slice(0, 20);
}
function back(slug: string, error?: string) {
  redirect(error ? `/workspaces/${slug}/archives?error=${error}` : `/workspaces/${slug}/archives`);
}

export async function createNote(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const content = field(formData, "content");
  const goalId = optionalId(field(formData, "goalId"));
  const questId = optionalId(field(formData, "questId"));
  const proposalId = optionalId(field(formData, "proposalId"));
  const tags = readTags(field(formData, "tags"));
  if (!validId(workspaceId) || title.length < 2 || title.length > 160 || content.length > 40000 ||
      goalId === undefined || questId === undefined || proposalId === undefined) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser();
  const { error } = await supabase.from("notes").insert({
    workspace_id: workspaceId,
    title,
    content,
    tags,
    goal_id: goalId,
    quest_id: questId,
    council_proposal_id: proposalId,
    created_by: user.id,
  });
  back(slug, error ? "save" : undefined);
}

export async function updateNote(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const noteId = field(formData, "noteId");
  const title = field(formData, "title");
  const content = field(formData, "content");
  const goalId = optionalId(field(formData, "goalId"));
  const questId = optionalId(field(formData, "questId"));
  const proposalId = optionalId(field(formData, "proposalId"));
  const tags = readTags(field(formData, "tags"));
  if (!validId(workspaceId) || !validId(noteId) || title.length < 2 || title.length > 160 ||
      content.length > 40000 || goalId === undefined || questId === undefined || proposalId === undefined) {
    back(slug, "invalid");
  }
  const { supabase } = await requireActiveUser();
  const { data, error } = await supabase.from("notes").update({
    title, content, tags, goal_id: goalId, quest_id: questId, council_proposal_id: proposalId,
  }).eq("id", noteId).eq("workspace_id", workspaceId).select("id").maybeSingle();
  back(slug, error || !data ? "update" : undefined);
}

export async function archiveNote(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const noteId = field(formData, "noteId");
  const shouldArchive = field(formData, "shouldArchive") === "true";
  if (!validId(workspaceId) || !validId(noteId)) back(slug, "invalid");
  const { supabase } = await requireActiveUser();
  const { error } = await supabase.from("notes").update({
    archived_at: shouldArchive ? new Date().toISOString() : null,
  }).eq("id", noteId).eq("workspace_id", workspaceId);
  back(slug, error || !data ? "archive" : undefined);
}
