import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const REFRESH_COOKIE = "rabe7_refresh";

// Runs on the server so the refresh token never touches browser JavaScript
// (httpOnly cookie) — only the short-lived access token is handed to the
// client, where it's kept in memory and lost on tab close. A stolen access
// token expires in minutes; a stolen refresh token would otherwise be a
// long-lived skeleton key.
export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(`${API_URL}/auth/login`, {
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
