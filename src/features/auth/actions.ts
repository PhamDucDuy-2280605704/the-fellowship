"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData): Promise<void> {
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? String(formData.get("password"))
    : "";

  if (!email || !password) {
    redirect("/login?error=invalid-input");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=credentials");
  }

  redirect("/workspaces");
}

export async function signUp(formData: FormData): Promise<void> {
  const displayName = readString(formData, "displayName");
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? String(formData.get("password"))
    : "";

  if (displayName.length < 2 || displayName.length > 80 || !email.includes("@")) {
    redirect("/signup?error=invalid-input");
  }

  if (password.length < 8 || password.length > 128) {
    redirect("/signup?error=password");
  }

  const headerStore = await headers();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || headerStore.get("origin");

  if (!siteUrl) {
    redirect("/signup?error=configuration");
  }

  let emailRedirectTo: string;
  try {
    const parsedSiteUrl = new URL(siteUrl);
    if (parsedSiteUrl.protocol !== "https:" && parsedSiteUrl.protocol !== "http:") {
      redirect("/signup?error=configuration");
    }
    emailRedirectTo = new URL("/auth/callback", parsedSiteUrl).toString();
  } catch {
    redirect("/signup?error=configuration");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo,
    },
  });

  if (error) {
    // Keep the response generic; do not disclose whether an email is registered.
    redirect("/signup?error=signup-failed");
  }

  if (data.session) {
    redirect("/workspaces");
  }

  redirect("/signup?notice=check-email");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
