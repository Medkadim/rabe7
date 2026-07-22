import { PermissionCode } from "../../../common/constants/permissions";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: PermissionCode[];
}
