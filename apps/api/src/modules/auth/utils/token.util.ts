import { createHash, randomBytes } from "crypto";

// Refresh tokens and password-reset tokens are random, opaque strings — we
// only ever store their SHA-256 hash, so a leaked database never exposes a
// usable token (same principle as password hashing).
export function generateOpaqueToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
