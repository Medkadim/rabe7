import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { PrismaService } from "../../prisma/prisma.service";
import { SequenceService } from "../../common/sequence/sequence.service";

type MockPrisma = {
  customer: Record<string, jest.Mock>;
  invoice: Record<string, jest.Mock>;
  user: Record<string, jest.Mock>;
  role: Record<string, jest.Mock>;
  userRole: Record<string, jest.Mock>;
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
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      role: {
        findFirstOrThrow: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
      },
      // create() runs its writes through an interactive transaction
      // (a callback, not an array of operations) when it also sets up a
      // login — support both call shapes.
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === "function" ? (arg as (tx: unknown) => unknown)(prisma) : Promise.all(arg as unknown[]),
      ),
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
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("rejects a temporary password with no phone number", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create(tenantId, { code: "CUST-0001", name: "Kadim Store", password: "correct-horse-battery" }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it("rejects a temporary password when the phone is already registered", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue({ id: "existing-user" });

      await expect(
        service.create(tenantId, {
          code: "CUST-0001",
          name: "Kadim Store",
          phone: "0612345678",
          password: "correct-horse-battery",
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it("creates a login for the customer when a temporary password is given", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue({ id: "c1", code: "CUST-0001", name: "Kadim Store" });
      prisma.role.findFirstOrThrow.mockResolvedValue({ id: "role_retailer" });
      prisma.user.create.mockResolvedValue({ id: "u1" });

      await service.create(tenantId, {
        code: "CUST-0001",
        name: "Kadim Store",
        phone: "0612345678",
        password: "correct-horse-battery",
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId, customerId: "c1", phone: "+212612345678", status: "ACTIVE" }),
        }),
      );
      expect(prisma.userRole.create).toHaveBeenCalledWith({ data: { userId: "u1", roleId: "role_retailer" } });
    });
  });

  describe("remove", () => {
    it("deactivates any login linked to the customer, freeing their phone number for reuse", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1" });

      await service.remove(tenantId, "c1");

      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "c1" }, data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { tenantId, customerId: "c1", deletedAt: null },
        data: { deletedAt: expect.any(Date), status: "SUSPENDED" },
      });
    });
  });

  describe("resetPassword", () => {
    it("creates a login for a customer that never had one", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1", name: "Kadim Store" });
      prisma.user.findFirst.mockResolvedValueOnce(null); // existing login for this customer?
      prisma.user.findFirst.mockResolvedValueOnce(null); // phone taken by someone else?
      prisma.role.findFirstOrThrow.mockResolvedValue({ id: "role_retailer" });
      prisma.user.create.mockResolvedValue({ id: "u1" });

      await service.resetPassword(tenantId, "c1", "0612345678", "correct-horse-battery");

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ customerId: "c1", phone: "+212612345678" }) }),
      );
    });

    it("updates the existing login's password instead of creating a second one", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1", name: "Kadim Store" });
      prisma.user.findFirst.mockResolvedValue({ id: "u1", phone: "+212612345678" });

      await service.resetPassword(tenantId, "c1", "0612345678", "correct-horse-battery");

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" }, data: expect.objectContaining({ phone: "+212612345678" }) }),
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("rejects a phone already used by a different customer's login", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "c1", name: "Kadim Store" });
      prisma.user.findFirst.mockResolvedValueOnce(null); // no existing login for c1
      prisma.user.findFirst.mockResolvedValueOnce({ id: "u2" }); // but the phone belongs to someone else

      await expect(
        service.resetPassword(tenantId, "c1", "0612345678", "correct-horse-battery"),
      ).rejects.toBeInstanceOf(ConflictException);
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
