import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE = "rabe7_refresh";
const PROTECTED_PREFIXES = ["/dashboard", "/customers", "/products", "/orders", "/payments"];

// A coarse gate: presence of the refresh cookie means "there's a session to
// try". The API is the actual source of truth for whether a request is
// authorized — this middleware only saves a round trip to an obviously
// signed-out browser.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !request.cookies.get(REFRESH_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/customers/:path*", "/products/:path*", "/orders/:path*", "/payments/:path*"],
};
