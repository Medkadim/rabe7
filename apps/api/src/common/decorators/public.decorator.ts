import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Marks an endpoint as not requiring a signed-in user — e.g. login, or
// requesting a password reset. Everything else requires a valid JWT by
// default, which is the safer default for a system handling money and
// customer data.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
