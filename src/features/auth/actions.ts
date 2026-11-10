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

  // Existing Auth identities only: login never creates a new account.
  if (!email || email.length > 254 || !/^[^ @]+@[^ @]+[.][^ @]+$/.test(email)) {
    redirect("/login?error=send");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://the-fellowship-phamducduy.vercel.app";
  let emailRedirectTo: string;
  try {
    const parsed = new URL(siteUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Invalid site URL");
    const callback = new URL("/auth/callback", parsed);
    if (safeNext) callback.searchParams.set("next", safeNext);
    emailRedirectTo = callback.toString();
  } catch {
    redirect("/login?error=send");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo },
  });

  if (error) {
    const code = error.code ?? "";
    if (code === "over_email_send_rate_limit" || error.status === 429) {
      redirect("/login?error=rate-limit");
    }
    console.error("[auth.signin] Passwordless sign-in request failed", {
      code: code || "unknown",
      status: error.status ?? null,
    });
    redirect("/login?error=send");
  }

  redirect("/login?notice=check-email");
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
    // Convert provider failures into safe, actionable messages without exposing account data.
    const code = error.code ?? "";
    if (code === "email_address_invalid") {
      redirect("/signup?error=invalid-email");
    }
    if (code === "over_email_send_rate_limit") {
      redirect("/signup?error=email-rate-limit");
    }
    if (code === "email_address_not_authorized") {
      redirect("/signup?error=email-provider");
    }
    if (code === "weak_password" || code === "password_too_short") {
      redirect("/signup?error=password");
    }

    console.error("[auth.signup] Supabase rejected sign-up", {
      code: code || "unknown",
      status: error.status ?? null,
    });
    // Keep duplicate-account and unexpected provider errors non-enumerable.
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
