"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugifyWorkspaceName } from "@/lib/domain/workspace-slug.mjs";

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createWorkspace(formData: FormData): Promise<void> {
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (name.length < 2 || name.length > 80 || description.length > 1000) {
    redirect("/workspaces?error=invalid-workspace");
  }

  const slug = slugifyWorkspaceName(name);
  if (slug.length < 3) {
    redirect("/workspaces?error=invalid-slug");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: isActive, error: statusError } = await supabase.rpc("is_platform_user_active");
  if (statusError || !isActive) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  const { error } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      description: description || null,
      created_by: userData.user.id,
    });

  if (error) {
    if (error.code === "23505") {
      redirect("/workspaces?error=slug-taken");
    }
    redirect("/workspaces?error=create-failed");
  }

  // The database trigger creates the owner membership atomically.
  // Do not request RETURNING here: the SELECT policy may run before the AFTER INSERT
  // trigger-created membership is visible to the same statement.
  revalidatePath("/workspaces");
  revalidatePath(`/workspaces/${slug}`);
  redirect(`/workspaces/${encodeURIComponent(slug)}?notice=workspace-created`);
}
