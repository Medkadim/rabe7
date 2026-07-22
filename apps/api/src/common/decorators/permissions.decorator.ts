import { SetMetadata } from "@nestjs/common";
import { PermissionCode } from "../constants/permissions";

export const PERMISSIONS_KEY = "permissions";

// Usage: @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
