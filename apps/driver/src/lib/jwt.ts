import type { SessionUser } from "./auth-context";

// Decodes (never verifies — that's the API's job) the access token payload
// so the UI can show who's signed in without an extra network round trip.
// This is never used to make an authorization decision that matters; the
// API re-checks everything on every request regardless of what the UI shows.
export function decodeAccessToken(token: string): SessionUser | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      userId: json.sub,
      tenantId: json.tenantId,
      email: json.email,
      roles: json.roles ?? [],
      permissions: json.permissions ?? [],
    };
  } catch {
    return null;
  }
}
