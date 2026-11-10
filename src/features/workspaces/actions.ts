"use server";

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

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      description: description || null,
      created_by: userData.user.id,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      redirect("/workspaces?error=slug-taken");
    }
    redirect("/workspaces?error=create-failed");
  }

  // The database trigger creates the owner's workspace_members row atomically.
  redirect(`/workspaces/${encodeURIComponent(data.slug)}`);
}
