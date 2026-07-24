import { PermissionCode } from "../../../common/constants/permissions";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  // Staff always have this; a phone-only customer login does not.
  email: string | null;
  roles: string[];
  permissions: PermissionCode[];
  // Set only for a customer's own login (RETAILER role) — null for staff.
  customerId: string | null;
}
