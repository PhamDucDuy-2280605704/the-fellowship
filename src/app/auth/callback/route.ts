import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeInvitePath(value: string | null): string | null {
  if (!value || !value.startsWith("/invite/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInvitePath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=callback", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=callback", requestUrl.origin));
  }

  const { data: isActive } = await supabase.rpc("is_platform_user_active");
  if (!isActive) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=suspended", requestUrl.origin));
  }

  if (next) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/workspaces", requestUrl.origin));
}
