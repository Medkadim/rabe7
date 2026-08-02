import { NextRequest, NextResponse } from "next/server";

// Runs on the Next.js server, inside its own Docker container — not in the
// sales rep's phone browser. See apps/admin's identical route for why
// INTERNAL_API_URL (Docker's service-name address) is needed here instead
// of the browser-facing NEXT_PUBLIC_API_URL.
const API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const REFRESH_COOKIE = "rabe7_sales_refresh";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // audience is set here, server-side, not read from the request body —
    // a browser posting to this route can't claim to be a different app to
    // get past the API's per-app role check.
    body: JSON.stringify({ ...body, audience: "sales" }),
  });

  const data = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const response = NextResponse.json({
    accessToken: data.accessToken,
    expiresIn: data.expiresIn,
    user: data.user,
  });

  response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
