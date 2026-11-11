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
  const isSafeInviteReturn = requestedNext.startsWith("/invite/")
    && !requestedNext.startsWith("//")
    && !requestedNext.includes(String.fromCharCode(92));
  const safeNext = requestedNext === "/the-stewards-hall" || isSafeInviteReturn
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
    });
    redirect("/login?error=credentials");
  }

  const { data: hasRecoveryPin, error: pinStatusError } = await supabase.rpc("has_own_account_recovery_pin");
  if (pinStatusError) {
    console.error("[auth.signin] Recovery PIN status check failed", {
      code: pinStatusError.code ?? "unknown",
    });
  } else if (hasRecoveryPin !== true) {
    redirect("/recovery-pin");
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
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const recoveryPin = readString(formData, "recoveryPin");
  const recoveryPinConfirm = readString(formData, "recoveryPinConfirm");

  if (displayName.length < 2 || displayName.length > 80 || !isValidEmail(email)) {
    redirect("/signup?error=invalid-input");
  }
  if (!/^\d{6}$/.test(recoveryPin) || recoveryPin !== recoveryPinConfirm) {
    redirect("/signup?error=pin");
  }
  if (password.length < 6 || password.length > 128) {
    redirect("/signup?error=password");
  }

  const supabase = await createClient();
  const { data: registration, error: registrationError } = await supabase.functions.invoke("account-recovery", {
    body: { action: "register", email, password, displayName, pin: recoveryPin },
  });

  if (registrationError || registration?.ok !== true) {
    console.error("[auth.signup] Member registration failed", {
      status: registrationError?.context?.status ?? null,
    });
    redirect(registrationError?.context?.status === 429 ? "/signup?error=rate-limit" : "/signup?error=signup-failed");
  }

  // The Edge Function creates the member with email_confirm=true. This keeps
  // registration independent from an email inbox while preserving normal Auth sessions.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error("[auth.signup] Immediate sign-in after registration failed", {
      code: signInError.code ?? "unknown",
      status: signInError.status ?? null,
    });
    redirect("/login?notice=account-created");
  }

  const { data: hasRecoveryPin, error: pinStatusError } = await supabase.rpc("has_own_account_recovery_pin");
  if (!pinStatusError && hasRecoveryPin !== true) redirect("/recovery-pin");
  redirect(safeNext || "/workspaces");
}

export async function saveRecoveryPin(formData: FormData): Promise<void> {
  const pin = readString(formData, "recoveryPin");
  const pinConfirm = readString(formData, "recoveryPinConfirm");
  if (!/^\d{6}$/.test(pin) || pin !== pinConfirm) {
    redirect("/recovery-pin?error=pin");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const { data: isActive, error: activeError } = await supabase.rpc("is_platform_user_active");
  if (activeError || !isActive) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  const { error } = await supabase.rpc("set_own_account_recovery_pin", { p_pin: pin });
  if (error) {
    console.error("[auth.recovery-pin] PIN save failed", {
      code: error.code ?? "unknown",
    });
    redirect("/recovery-pin?error=save");
  }

  redirect("/workspaces?notice=pin-saved");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
