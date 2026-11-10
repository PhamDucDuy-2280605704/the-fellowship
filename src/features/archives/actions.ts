"use server";

import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function validId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }
function back(slug: string, error?: string) {
  redirect(error ? `/workspaces/${slug}/archives?error=${error}` : `/workspaces/${slug}/archives`);
}

export async function createNote(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const content = field(formData, "content");
  if (!validId(workspaceId) || title.length < 2 || title.length > 160 || content.length > 40000) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser();
  const { error } = await supabase.from("notes").insert({
    workspace_id: workspaceId,
    title,
    content,
    created_by: user.id,
  });
  back(slug, error ? "save" : undefined);
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
  back(slug, error ? "archive" : undefined);
}
