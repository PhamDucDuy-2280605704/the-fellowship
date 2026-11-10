"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData): Promise<void> {
  const email = readString(formData, "email").toLowerCase();
  const requestedNext = readString(formData, "next");
  const safeNext = requestedNext.startsWith("/invite/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\\\")
    ? requestedNext
    : null;
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

  const { data: isActive, error: statusError } = await supabase.rpc("is_platform_user_active");
  if (statusError || !isActive) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  if (safeNext) redirect(safeNext);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  redirect(isAdmin ? "/admin" : "/workspaces");
}

export async function signUp(formData: FormData): Promise<void> {
  const displayName = readString(formData, "displayName");
  const requestedNext = readString(formData, "next");
  const safeNext = requestedNext.startsWith("/invite/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\\\")
    ? requestedNext
    : null;
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? String(formData.get("password"))
    : "";

  const validEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (displayName.length < 2 || displayName.length > 80 || !validEmail) {
    redirect("/signup?error=invalid-input");
  }

  if (password.length < 8 || password.length > 128) {
    redirect("/signup?error=password");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let emailRedirectTo: string | null = null;

  if (siteUrl) {
    try {
      const parsedSiteUrl = new URL(siteUrl);
      if (
        (parsedSiteUrl.protocol === "https:" || parsedSiteUrl.protocol === "http:") &&
        !parsedSiteUrl.username &&
        !parsedSiteUrl.password
      ) {
        const callbackUrl = new URL("/auth/callback", parsedSiteUrl);
        if (safeNext) callbackUrl.searchParams.set("next", safeNext);
        emailRedirectTo = callbackUrl.toString();
      }
    } catch {
      // Invalid configuration is handled below without swallowing Next.js redirects.
    }
  }

  if (!emailRedirectTo) {
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
    redirect(safeNext || "/workspaces");
  }

  redirect("/signup?notice=check-email");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
