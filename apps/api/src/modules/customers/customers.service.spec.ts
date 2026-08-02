import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { PrismaService } from "../../prisma/prisma.service";
import { SequenceService } from "../../common/sequence/sequence.service";

type MockPrisma = {
  customer: Record<string, jest.Mock>;
  invoice: Record<string, jest.Mock>;
  $transaction: jest.Mock;
};

describe("CustomersService", () => {
  let service: CustomersService;
  let prisma: MockPrisma;
  let sequence: { next: jest.Mock; formatNumber: jest.Mock };

  const tenantId = "tenant_1";

  beforeEach(() => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    sequence = { next: jest.fn(), formatNumber: jest.fn() };
    service = new CustomersService(prisma as unknown as PrismaService, sequence as unknown as SequenceService);
  });

  describe("create", () => {
    it("rejects a duplicate customer code within the same tenant", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "existing" });

      await expect(
        service.create(tenantId, { code: "CUST-0001", name: "Kadim Store" }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it("creates a customer with default credit limit and payment terms", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue({ id: "c1", code: "CUST-0001" });

      await service.create(tenantId, { code: "CUST-0001", name: "Kadim Store" });

      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            code: "CUST-0001",
            creditLimit: 0,
            paymentTermsDays: 0,
          }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when the customer does not exist for this tenant", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.findOne(tenantId, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("never returns a customer belonging to another tenant", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await service.findOne(tenantId, "c1").catch(() => undefined);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId, id: "c1" }) }),
      );
    });
  });

  describe("assertWithinCreditLimit", () => {
    it("allows the order when no credit limit is configured", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1", name: "Kadim Store", creditLimit: 0 });

      await expect(service.assertWithinCreditLimit(tenantId, "c1", 10_000)).resolves.toBeUndefined();
      expect(prisma.invoice.findMany).not.toHaveBeenCalled();
    });

    it("blocks an order that would push the customer over their credit limit", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1", name: "Kadim Store", creditLimit: 100 });
      prisma.invoice.findMany.mockResolvedValue([{ totalAmount: 80, amountPaid: 0 }]);

      await expect(service.assertWithinCreditLimit(tenantId, "c1", 50)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("allows an order that stays within the credit limit", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1", name: "Kadim Store", creditLimit: 100 });
      prisma.invoice.findMany.mockResolvedValue([{ totalAmount: 40, amountPaid: 10 }]);

      await expect(service.assertWithinCreditLimit(tenantId, "c1", 50)).resolves.toBeUndefined();
    });
  });
});
