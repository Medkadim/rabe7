import { PrismaClient, SystemRoleCode } from "@prisma/client";
import * as argon2 from "argon2";
import { ALL_PERMISSIONS, PERMISSIONS } from "../src/common/constants/permissions";

const prisma = new PrismaClient();

// What each system role can do out of the box. Tenants can create
// additional custom roles later (see roles.manage) — this is just the
// sensible starting point matching the six roles from the product spec.
const ROLE_PERMISSIONS: Record<SystemRoleCode, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.code),
  DISTRIBUTOR_MANAGER: ALL_PERMISSIONS.map((p) => p.code),
  SALES_REPRESENTATIVE: [
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PROMOTIONS_READ,
  ],
  WAREHOUSE_EMPLOYEE: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.WAREHOUSE_READ,
    PERMISSIONS.WAREHOUSE_RECEIVE,
    PERMISSIONS.WAREHOUSE_ADJUST,
    PERMISSIONS.WAREHOUSE_PICK,
    PERMISSIONS.RETURNS_READ,
    PERMISSIONS.RETURNS_CREATE,
    PERMISSIONS.RETURNS_RECEIVE,
  ],
  DELIVERY_DRIVER: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_UPDATE_STATUS,
  ],
  // ORDERS_UPDATE covers confirming their own draft (checkout) as well as
  // editing it beforehand — ownership (not just permission) is what stops a
  // retailer from touching anyone else's order; see OrdersService.
  RETAILER: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.PAYMENTS_READ,
  ],
};

async function main() {
  console.log("Seeding permission catalog...");
  for (const permission of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      create: permission,
      update: { module: permission.module, description: permission.description },
    });
  }

  console.log("Seeding demo tenant...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    create: { name: "My Distribution Company", slug: "default", currency: "USD", locale: "en" },
    update: {},
  });

  console.log("Seeding system roles...");
  for (const code of Object.values(SystemRoleCode)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: code } },
      create: { tenantId: tenant.id, code, name: code, isSystem: true },
      update: {},
    });

    for (const permissionCode of ROLE_PERMISSIONS[code]) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }

  console.log("Seeding first Super Admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@wasla.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      status: "ACTIVE",
    },
    update: {},
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { tenantId_name: { tenantId: tenant.id, name: SystemRoleCode.SUPER_ADMIN } },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    create: { userId: admin.id, roleId: superAdminRole.id },
    update: {},
  });

  console.log(`\nDone. Sign in with:\n  email:    ${adminEmail}\n  password: ${adminPassword}\n`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("Change this password immediately — set SEED_ADMIN_PASSWORD before seeding production.\n");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
