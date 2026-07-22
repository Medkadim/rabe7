// The complete catalog of permission codes the application understands.
// Roles are just named bundles of these codes (see prisma/seed.ts) — adding
// a new role, or changing what an existing role can do, is a data change,
// never a code change.
export const PERMISSIONS = {
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  AUDIT_LOGS_READ: "audit_logs.read",

  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",
  CUSTOMERS_CREDIT_OVERRIDE: "customers.credit_limit.override",

  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  ORDERS_READ: "orders.read",
  ORDERS_CREATE: "orders.create",
  ORDERS_UPDATE: "orders.update",
  ORDERS_CANCEL: "orders.cancel",

  PAYMENTS_READ: "payments.read",
  PAYMENTS_CREATE: "payments.create",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: { code: PermissionCode; module: string; description: string }[] = [
  { code: PERMISSIONS.USERS_MANAGE, module: "auth", description: "Create, edit, suspend users and assign roles" },
  { code: PERMISSIONS.ROLES_MANAGE, module: "auth", description: "Create roles and change what they can access" },
  { code: PERMISSIONS.AUDIT_LOGS_READ, module: "auth", description: "View the audit trail" },

  { code: PERMISSIONS.CUSTOMERS_READ, module: "customers", description: "View customer records" },
  { code: PERMISSIONS.CUSTOMERS_CREATE, module: "customers", description: "Create new customers" },
  { code: PERMISSIONS.CUSTOMERS_UPDATE, module: "customers", description: "Edit customer details" },
  { code: PERMISSIONS.CUSTOMERS_DELETE, module: "customers", description: "Archive customers" },
  { code: PERMISSIONS.CUSTOMERS_CREDIT_OVERRIDE, module: "customers", description: "Override a customer's credit limit block" },

  { code: PERMISSIONS.PRODUCTS_READ, module: "products", description: "View product catalog" },
  { code: PERMISSIONS.PRODUCTS_CREATE, module: "products", description: "Add new products" },
  { code: PERMISSIONS.PRODUCTS_UPDATE, module: "products", description: "Edit products and pricing" },
  { code: PERMISSIONS.PRODUCTS_DELETE, module: "products", description: "Archive products" },

  { code: PERMISSIONS.ORDERS_READ, module: "orders", description: "View orders" },
  { code: PERMISSIONS.ORDERS_CREATE, module: "orders", description: "Create orders" },
  { code: PERMISSIONS.ORDERS_UPDATE, module: "orders", description: "Edit orders" },
  { code: PERMISSIONS.ORDERS_CANCEL, module: "orders", description: "Cancel orders" },

  { code: PERMISSIONS.PAYMENTS_READ, module: "payments", description: "View payments and balances" },
  { code: PERMISSIONS.PAYMENTS_CREATE, module: "payments", description: "Record a payment" },
];
