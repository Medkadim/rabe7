import { PromotionsService } from "./promotions.service";
import { PrismaService } from "../../prisma/prisma.service";

type MockPrisma = {
  customer: { findUnique: jest.Mock };
  promotion: { findMany: jest.Mock };
};

describe("PromotionsService", () => {
  let service: PromotionsService;
  let prisma: MockPrisma;
  const tenantId = "tenant_1";
  const now = new Date("2026-06-01T00:00:00Z");

  beforeEach(() => {
    prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ addresses: [] }) },
      promotion: { findMany: jest.fn() },
    };
    const notifications = { notifyNewPromotion: jest.fn() };
    service = new PromotionsService(prisma as unknown as PrismaService, notifications as never);
  });

  describe("resolveDiscount", () => {
    it("returns no discount when nothing matches", async () => {
      prisma.promotion.findMany.mockResolvedValue([]);
      const result = await service.resolveDiscount(tenantId, "c1", "p1", 5, 10, now);
      expect(result).toEqual({ discountAmount: 0, promotionId: null });
    });

    it("applies a percentage discount to the line subtotal", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        { id: "promo_pct", type: "PERCENTAGE", discountPercent: 10, customers: [] },
      ]);
      // 5 units * 10 = 50 subtotal, 10% off = 5
      const result = await service.resolveDiscount(tenantId, "c1", "p1", 5, 10, now);
      expect(result).toEqual({ discountAmount: 5, promotionId: "promo_pct" });
    });

    it("skips a volume discount when quantity is below the threshold", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        { id: "promo_vol", type: "VOLUME_DISCOUNT", discountPercent: 20, minQuantity: 10, customers: [] },
      ]);
      const result = await service.resolveDiscount(tenantId, "c1", "p1", 5, 10, now);
      expect(result.discountAmount).toBe(0);
    });

    it("caps a fixed-amount discount at the line subtotal", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        { id: "promo_fixed", type: "FIXED_AMOUNT", discountAmount: 999, customers: [] },
      ]);
      // subtotal is only 2 * 10 = 20
      const result = await service.resolveDiscount(tenantId, "c1", "p1", 2, 10, now);
      expect(result.discountAmount).toBe(20);
    });

    it("picks the larger of two competing discounts", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        { id: "promo_small", type: "FIXED_AMOUNT", discountAmount: 2, customers: [] },
        { id: "promo_big", type: "PERCENTAGE", discountPercent: 50, customers: [] },
      ]);
      // subtotal = 5*10 = 50; 50% = 25 beats the flat 2
      const result = await service.resolveDiscount(tenantId, "c1", "p1", 5, 10, now);
      expect(result).toEqual({ discountAmount: 25, promotionId: "promo_big" });
    });

    it("ignores a promotion scoped to other customers", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        {
          id: "promo_other",
          type: "PERCENTAGE",
          discountPercent: 50,
          customers: [{ customerId: "someone_else" }],
        },
      ]);
      const result = await service.resolveDiscount(tenantId, "c1", "p1", 5, 10, now);
      expect(result.discountAmount).toBe(0);
    });
  });

  describe("resolveBonus", () => {
    it("returns null when quantity is below buyQuantity", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        { id: "promo_bxgy", buyQuantity: 10, getQuantity: 1, rewardProductId: "gift1", customers: [] },
      ]);
      const result = await service.resolveBonus(tenantId, "c1", "p1", 5, now);
      expect(result).toBeNull();
    });

    it("computes the bonus quantity as whole multiples of buyQuantity", async () => {
      prisma.promotion.findMany.mockResolvedValue([
        { id: "promo_bxgy", buyQuantity: 5, getQuantity: 1, rewardProductId: "gift1", customers: [] },
      ]);
      // 12 units bought / 5 = 2 whole multiples -> 2 free units
      const result = await service.resolveBonus(tenantId, "c1", "p1", 12, now);
      expect(result).toEqual({ productId: "gift1", quantity: 2, promotionId: "promo_bxgy" });
    });
  });
});
