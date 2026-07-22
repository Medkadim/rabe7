import { BadRequestException } from "@nestjs/common";
import { WarehouseService } from "./warehouse.service";
import { PrismaService } from "../../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";

type MockPrisma = {
  product: { findFirst: jest.Mock; update: jest.Mock };
  $transaction: jest.Mock;
};

describe("WarehouseService", () => {
  let service: WarehouseService;
  let prisma: MockPrisma;
  let orders: { findOne: jest.Mock };
  const tenantId = "tenant_1";

  beforeEach(() => {
    prisma = {
      product: { findFirst: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        typeof cb === "function" ? cb(prisma) : Promise.all(cb),
      ),
    };
    orders = { findOne: jest.fn() };
    service = new WarehouseService(prisma as unknown as PrismaService, orders as unknown as OrdersService);
  });

  describe("adjustStock", () => {
    it("refuses an adjustment that would push stock below zero", async () => {
      prisma.product.findFirst.mockResolvedValue({ id: "p1", currentStock: 5 });

      await expect(
        service.adjustStock(tenantId, "user_1", { productId: "p1", quantity: -10, note: "count error" }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe("pickOrder", () => {
    it("refuses to pick an order that isn't confirmed", async () => {
      orders.findOne.mockResolvedValue({ id: "o1", status: "DRAFT", items: [] });

      await expect(service.pickOrder(tenantId, "user_1", "o1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("refuses to pick when a product doesn't have enough stock", async () => {
      orders.findOne.mockResolvedValue({
        id: "o1",
        status: "CONFIRMED",
        items: [
          { productId: "p1", quantity: 10, product: { name: "Coca Cola", currentStock: 4 } },
        ],
      });

      await expect(service.pickOrder(tenantId, "user_1", "o1")).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
