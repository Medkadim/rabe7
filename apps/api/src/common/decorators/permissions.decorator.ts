import { SetMetadata } from "@nestjs/common";
import { PermissionCode } from "../constants/permissions";

export const PERMISSIONS_KEY = "permissions";
export const PERMISSIONS_ANY_KEY = "permissions_any";

// Usage: @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
// All listed permissions are required (AND).
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Usage: @RequireAnyPermission(PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.CUSTOMERS_CREATE)
// Any one of the listed permissions is enough (OR) — for an endpoint shared
// by roles that don't overlap on a single permission (e.g. image uploads
// used by both product photos and customer-recruitment photos).
export const RequireAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);
