"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validId(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function safeSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function createWorkspaceInvitation(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const email = field(formData, "email").toLowerCase();
  const role = field(formData, "role");

  if (!validId(workspaceId) || !safeSlug(slug) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !["admin", "member", "viewer"].includes(role)) {
    redirect(`/workspaces/${slug}/members?error=invalid-invitation`);
  }

  const { supabase } = await requireActiveUser();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase.rpc("create_workspace_invitation", {
    p_workspace_id: workspaceId,
    p_email: email,
    p_role: role,
    p_token_hash: tokenHash,
  });

  if (error) {
    redirect(`/workspaces/${slug}/members?error=invite-failed`);
  }

  redirect(`/workspaces/${slug}/members?invite=${token}`);
}

export async function acceptWorkspaceInvitation(formData: FormData): Promise<void> {
  const token = field(formData, "token");
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    redirect("/workspaces?error=invalid-invitation");
  }

  const { supabase } = await requireActiveUser();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: workspaceId, error } = await supabase.rpc("accept_workspace_invitation", {
    p_token_hash: tokenHash,
  });

  if (error || !workspaceId) {
    redirect(`/invite/${token}?error=invalid`);
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", workspaceId)
    .single();

  if (!workspace) {
    redirect("/workspaces");
  }
  redirect(`/workspaces/${workspace.slug}/members?notice=joined`);
}

export async function updateWorkspaceMemberRole(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const userId = field(formData, "userId");
  const role = field(formData, "role");

  if (!validId(workspaceId) || !validId(userId) || !safeSlug(slug) ||
      !["admin", "member", "viewer"].includes(role)) {
    redirect(`/workspaces/${slug}/members?error=invalid-member`);
  }

  const { supabase } = await requireActiveUser();
  const { error } = await supabase.rpc("update_workspace_member_role", {
    p_workspace_id: workspaceId,
    p_user_id: userId,
    p_role: role,
  });
  redirect(error
    ? `/workspaces/${slug}/members?error=role-update`
    : `/workspaces/${slug}/members?notice=role-updated`);
}

export async function removeWorkspaceMember(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const userId = field(formData, "userId");

  if (!validId(workspaceId) || !validId(userId) || !safeSlug(slug)) {
    redirect(`/workspaces/${slug}/members?error=invalid-member`);
  }

  const { supabase } = await requireActiveUser();
  const { error } = await supabase.rpc("remove_workspace_member", {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  });
  redirect(error
    ? `/workspaces/${slug}/members?error=remove-failed`
    : `/workspaces/${slug}/members?notice=member-removed`);
}
