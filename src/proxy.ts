import { NextRequest, NextResponse } from "next/server";

const PRIVATE_ADMIN_PREFIX = "/the-stewards-hall";
const INTERNAL_ADMIN_PREFIX = "/admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The old, guessable route is intentionally unavailable from the public URL.
  if (pathname === INTERNAL_ADMIN_PREFIX || pathname.startsWith(`${INTERNAL_ADMIN_PREFIX}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === PRIVATE_ADMIN_PREFIX || pathname.startsWith(`${PRIVATE_ADMIN_PREFIX}/`)) {
    const internalPath = pathname === `${PRIVATE_ADMIN_PREFIX}/login`
      ? "/steward-login"
      : pathname.replace(PRIVATE_ADMIN_PREFIX, INTERNAL_ADMIN_PREFIX) || INTERNAL_ADMIN_PREFIX;
    const destination = request.nextUrl.clone();
    destination.pathname = internalPath;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-private-admin-path", pathname);

    return NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/the-stewards-hall", "/the-stewards-hall/:path*"],
};
