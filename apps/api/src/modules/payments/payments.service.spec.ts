import { PaymentsService } from "./payments.service";
import { PrismaService } from "../../prisma/prisma.service";

type MockPrisma = {
  invoice: Record<string, jest.Mock>;
  payment: Record<string, jest.Mock>;
  $transaction: jest.Mock;
};

describe("PaymentsService.create", () => {
  let service: PaymentsService;
  let prisma: MockPrisma;
  const tenantId = "tenant_1";

  const runTx = async (cb: (tx: MockPrisma) => Promise<unknown>) => cb(prisma);

  beforeEach(() => {
    prisma = {
      invoice: { findFirst: jest.fn(), update: jest.fn() },
      payment: { create: jest.fn().mockResolvedValue({ id: "pay_1" }) },
      $transaction: jest.fn(runTx),
    };
    service = new PaymentsService(prisma as unknown as PrismaService);
  });

  it("marks the invoice PARTIALLY_PAID when the payment doesn't cover the full balance", async () => {
    prisma.invoice.findFirst.mockResolvedValue({ id: "inv_1", totalAmount: 100, amountPaid: 0, status: "UNPAID" });

    await service.create(tenantId, "user_1", {
      customerId: "c1",
      invoiceId: "inv_1",
      method: "CASH",
      amount: 40,
    });

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountPaid: 40, status: "PARTIALLY_PAID" }) }),
    );
  });

  it("marks the invoice PAID once the accumulated payments cover the total", async () => {
    prisma.invoice.findFirst.mockResolvedValue({ id: "inv_1", totalAmount: 100, amountPaid: 60, status: "PARTIALLY_PAID" });

    await service.create(tenantId, "user_1", {
      customerId: "c1",
      invoiceId: "inv_1",
      method: "CASH",
      amount: 40,
    });

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountPaid: 100, status: "PAID" }) }),
    );
  });
});
