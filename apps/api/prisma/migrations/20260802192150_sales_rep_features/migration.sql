-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "requestedDeliveryDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyTarget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "weeklyTarget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyTarget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_targets_userId_key" ON "sales_targets"("userId");

-- CreateIndex
CREATE INDEX "sales_targets_tenantId_idx" ON "sales_targets"("tenantId");

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
