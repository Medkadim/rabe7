import { BadRequestException } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../../prisma/prisma.service";
import { SequenceService } from "../../common/sequence/sequence.service";
import { ProductsService } from "../products/products.service";
import { CustomersService } from "../customers/customers.service";

describe("OrdersService status transitions", () => {
  let service: OrdersService;
  let prisma: { order: Record<string, jest.Mock> };
  const tenantId = "tenant_1";

  const confirmedOrder = {
    id: "o1",
    tenantId,
    status: "CONFIRMED",
    customerId: "c1",
    customer: {},
    items: [],
    statusHistory: [],
    invoice: null,
  };

  beforeEach(() => {
    prisma = { order: { findFirst: jest.fn().mockResolvedValue(confirmedOrder), update: jest.fn() } };
    service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as SequenceService,
      {} as ProductsService,
      {} as CustomersService,
    );
  });

  it("refuses to edit an order that is already confirmed", async () => {
    await expect(
      service.update(tenantId, "o1", "user_1", { notes: "change" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("refuses to cancel a delivered order", async () => {
    prisma.order.findFirst.mockResolvedValue({ ...confirmedOrder, status: "DELIVERED" });

    await expect(
      service.cancel(tenantId, "o1", "user_1", "changed my mind"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("refuses to confirm an order that isn't draft or pending", async () => {
    await expect(service.confirm(tenantId, "o1", "user_1")).rejects.toBeInstanceOf(BadRequestException);
  });
});
