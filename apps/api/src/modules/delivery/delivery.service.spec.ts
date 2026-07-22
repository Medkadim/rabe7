import { BadRequestException } from "@nestjs/common";
import { DeliveryService } from "./delivery.service";
import { PrismaService } from "../../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";

type MockPrisma = {
  delivery: Record<string, jest.Mock>;
  order: Record<string, jest.Mock>;
};

describe("DeliveryService", () => {
  let service: DeliveryService;
  let prisma: MockPrisma;
  let orders: { findOne: jest.Mock };
  let payments: { create: jest.Mock };
  const tenantId = "tenant_1";

  beforeEach(() => {
    prisma = {
      delivery: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      order: { update: jest.fn() },
    };
    orders = { findOne: jest.fn() };
    payments = { create: jest.fn() };
    service = new DeliveryService(
      prisma as unknown as PrismaService,
      orders as unknown as OrdersService,
      payments as unknown as PaymentsService,
    );
  });

  describe("assignOrder", () => {
    it("refuses to schedule an order that hasn't been confirmed", async () => {
      jest.spyOn(service, "findRoute").mockResolvedValue({ id: "r1", deliveries: [] } as never);
      orders.findOne.mockResolvedValue({ id: "o1", status: "DRAFT" });

      await expect(service.assignOrder(tenantId, "r1", { orderId: "o1" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("refuses to schedule an order that's already on a route", async () => {
      jest.spyOn(service, "findRoute").mockResolvedValue({ id: "r1", deliveries: [] } as never);
      orders.findOne.mockResolvedValue({ id: "o1", status: "CONFIRMED" });
      prisma.delivery.findUnique.mockResolvedValue({ id: "existing_delivery" });

      await expect(service.assignOrder(tenantId, "r1", { orderId: "o1" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.delivery.create).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    const pendingDelivery = {
      id: "d1",
      status: "OUT_FOR_DELIVERY",
      orderId: "o1",
      order: { customerId: "c1", invoice: { id: "inv1" } },
    };

    it("refuses to update a delivery that's already in a final state", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ ...pendingDelivery, status: "DELIVERED" } as never);

      await expect(
        service.updateStatus(tenantId, "user_1", "d1", { status: "DELIVERED" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("marks the order DELIVERED when the delivery is marked DELIVERED", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue(pendingDelivery as never);
      prisma.delivery.update.mockResolvedValue({ ...pendingDelivery, status: "DELIVERED" });

      await service.updateStatus(tenantId, "user_1", "d1", { status: "DELIVERED", recipientName: "Store owner" });

      expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: "o1" }, data: { status: "DELIVERED" } });
    });

    it("records a cash payment against the order's invoice when cash is collected", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue(pendingDelivery as never);
      prisma.delivery.update.mockResolvedValue({ ...pendingDelivery, status: "DELIVERED" });

      await service.updateStatus(tenantId, "user_1", "d1", { status: "DELIVERED", cashCollected: 55 });

      expect(payments.create).toHaveBeenCalledWith(
        tenantId,
        "user_1",
        expect.objectContaining({ customerId: "c1", invoiceId: "inv1", method: "CASH", amount: 55 }),
      );
    });

    it("does not touch the order or create a payment for a failed delivery", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue(pendingDelivery as never);
      prisma.delivery.update.mockResolvedValue({ ...pendingDelivery, status: "FAILED" });

      await service.updateStatus(tenantId, "user_1", "d1", { status: "FAILED", notes: "Store closed" });

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(payments.create).not.toHaveBeenCalled();
    });
  });
});
