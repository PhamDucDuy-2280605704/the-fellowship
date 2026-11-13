"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

const isValidWorkspaceId = (value: string) => /^[0-9a-f-]{36}$/i.test(value);
const isValidSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export async function updateWorkspaceDetails(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const name = field(formData, "name");
  const description = field(formData, "description");
  if (!isValidWorkspaceId(workspaceId) || !isValidSlug(slug) ||
      name.length < 2 || name.length > 80 || description.length > 1000) {
    redirect(`/workspaces/${slug}/settings?error=invalid`);
  }

  const { supabase } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data, error } = await supabase.from("workspaces").update({ name, description }).eq("id", workspaceId).select("id").maybeSingle();
  if (error || !data) redirect(`/workspaces/${slug}/settings?error=save`);

  revalidatePath(`/workspaces/${slug}`);
  revalidatePath(`/workspaces/${slug}/settings`);
  revalidatePath("/workspaces");
  redirect(`/workspaces/${slug}/settings?notice=saved`);
}

export async function deleteWorkspace(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const confirmation = field(formData, "confirmDelete");

  if (!isValidWorkspaceId(workspaceId) || !isValidSlug(slug)) {
    redirect("/workspaces?error=delete-failed");
  }
  if (confirmation !== "yes") {
    redirect(`/workspaces/${slug}/settings?error=delete-confirm`);
  }

  const { supabase, isPlatformAdmin } = await requireActiveUser({ allowPlatformAdmin: true });

  // The database RPC repeats the ownership/admin authorization independently of this UI action.
  // leave_workspace has the same UUID argument shape in the generated DB typings; the runtime
  // function name remains delete_workspace.
  const { error } = await supabase.rpc(
    "delete_workspace" as "leave_workspace",
    { p_workspace_id: workspaceId },
  );

  if (error) {
    console.error("[workspace.delete] Workspace deletion rejected", { code: error.code ?? "unknown" });
    redirect(isPlatformAdmin
      ? "/the-stewards-hall/workspaces?error=delete-failed"
      : `/workspaces/${slug}/settings?error=delete-failed`);
  }

  revalidatePath("/workspaces");
  revalidatePath("/the-stewards-hall/workspaces");
  revalidatePath(`/workspaces/${slug}`);
  redirect(isPlatformAdmin
    ? "/the-stewards-hall/workspaces?notice=deleted"
    : "/workspaces?notice=deleted");
}
