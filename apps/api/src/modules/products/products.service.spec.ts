import { ProductsService } from "./products.service";
import { PrismaService } from "../../prisma/prisma.service";

type MockPrisma = {
  customerPrice: Record<string, jest.Mock>;
  productPrice: Record<string, jest.Mock>;
  product: Record<string, jest.Mock>;
};

describe("ProductsService.resolvePrice", () => {
  let service: ProductsService;
  let prisma: MockPrisma;
  const tenantId = "tenant_1";

  beforeEach(() => {
    prisma = {
      customerPrice: { findFirst: jest.fn() },
      productPrice: { findFirst: jest.fn() },
      product: { findFirst: jest.fn() },
    };
    service = new ProductsService(prisma as unknown as PrismaService);
  });

  it("prefers a customer-specific price over everything else", async () => {
    prisma.customerPrice.findFirst.mockResolvedValue({ price: 42 });

    const price = await service.resolvePrice(tenantId, "p1", "c1", 5);

    expect(price).toBe(42);
    expect(prisma.productPrice.findFirst).not.toHaveBeenCalled();
  });

  it("falls back to the highest-quantity volume tier when no customer price exists", async () => {
    prisma.customerPrice.findFirst.mockResolvedValue(null);
    prisma.productPrice.findFirst.mockResolvedValue({ price: 18 });

    const price = await service.resolvePrice(tenantId, "p1", "c1", 20);

    expect(price).toBe(18);
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });

  it("falls back to the catalog base price when nothing else applies", async () => {
    prisma.customerPrice.findFirst.mockResolvedValue(null);
    prisma.productPrice.findFirst.mockResolvedValue(null);
    prisma.product.findFirst.mockResolvedValue({ id: "p1", basePrice: 25, deletedAt: null });

    const price = await service.resolvePrice(tenantId, "p1", "c1", 1);

    expect(price).toBe(25);
  });
});
