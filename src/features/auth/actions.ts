"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signIn(formData: FormData): Promise<void> {
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const requestedNext = readString(formData, "next");
  const safeNext = requestedNext.startsWith("/invite/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")
    ? requestedNext
    : null;

  if (!isValidEmail(email) || password.length < 1 || password.length > 128) {
    redirect("/login?error=invalid-input");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "user_banned") redirect("/login?error=suspended");
    console.error("[auth.signin] Password sign-in failed", {
      code: error.code ?? "unknown",
      status: error.status ?? null,
    });
    redirect("/login?error=credentials");
  }

  redirect(safeNext || "/workspaces");
}

export async function signUp(formData: FormData): Promise<void> {
  const displayName = readString(formData, "displayName");
  const requestedNext = readString(formData, "next");
  const safeNext = requestedNext.startsWith("/invite/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")
    ? requestedNext
    : null;
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? String(formData.get("password"))
    : "";

  if (displayName.length < 2 || displayName.length > 80 || !isValidEmail(email)) {
    redirect("/signup?error=invalid-input");
  }

  if (password.length < 6 || password.length > 128) {
    redirect("/signup?error=password");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    const code = error.code ?? "";
    if (code === "weak_password" || code === "password_too_short") {
      redirect("/signup?error=password");
    }
    console.error("[auth.signup] Supabase rejected sign-up", {
      code: code || "unknown",
      status: error.status ?? null,
    });
    redirect("/signup?error=signup-failed");
  }

  if (data.session) {
    redirect(safeNext || "/workspaces");
  }

  // Email confirmation is still enabled in the Supabase project. Do not imply
  // an account is ready until the project setting is changed by an owner.
  redirect("/signup?notice=check-email");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
