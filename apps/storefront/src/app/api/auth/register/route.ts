import { NextRequest, NextResponse } from "next/server";

// Server-side (inside the storefront container) — see login/route.ts for why
// this needs INTERNAL_API_URL rather than the browser-facing NEXT_PUBLIC_API_URL.
const API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const REFRESH_COOKIE = "rabe7_storefront_refresh";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(`${API_URL}/auth/register-customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
