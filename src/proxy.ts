import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { getSupabasePublicEnvIfConfigured } from "@/lib/supabase/env";

const PRIVATE_ADMIN_PREFIX = "/the-stewards-hall";
const INTERNAL_ADMIN_PREFIX = "/admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === INTERNAL_ADMIN_PREFIX || pathname.startsWith(`${INTERNAL_ADMIN_PREFIX}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  const isPrivateAdminPath =
    pathname === PRIVATE_ADMIN_PREFIX || pathname.startsWith(`${PRIVATE_ADMIN_PREFIX}/`);
  const destination = isPrivateAdminPath ? request.nextUrl.clone() : null;

  if (destination) {
    destination.pathname =
      pathname === `${PRIVATE_ADMIN_PREFIX}/login`
        ? "/steward-login"
        : pathname.replace(PRIVATE_ADMIN_PREFIX, INTERNAL_ADMIN_PREFIX) || INTERNAL_ADMIN_PREFIX;
  }

  const createResponse = () => {
    const requestHeaders = new Headers(request.headers);
    if (isPrivateAdminPath) requestHeaders.set("x-private-admin-path", pathname);

    return destination
      ? NextResponse.rewrite(destination, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });
  };

  const env = getSupabasePublicEnvIfConfigured();
  if (!env) return createResponse();

  let supabaseResponse = createResponse();
  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = createResponse();

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers ?? {}).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
