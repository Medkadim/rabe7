import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  // Favorites only ever mean "this retailer's own list" — there's no staff
  // use case for viewing or managing someone else's favorites, so unlike
  // Orders this never accepts a target customer id from the caller.
  private requireCustomerId(customerId: string | null | undefined): string {
    if (!customerId) {
      throw new ForbiddenException("Only a customer account can manage favorites.");
    }
    return customerId;
  }

  async list(tenantId: string, customerId: string | null | undefined) {
    const id = this.requireCustomerId(customerId);
    return this.prisma.favorite.findMany({
      where: { tenantId, customerId: id, product: { deletedAt: null } },
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async add(tenantId: string, customerId: string | null | undefined, productId: string) {
    const id = this.requireCustomerId(customerId);
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId, deletedAt: null } });
    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    // Idempotent: favoriting an already-favorited product just returns the
    // existing row rather than erroring — the UI toggles a heart icon, it
    // shouldn't need to know whether this is the first click or not.
    return this.prisma.favorite.upsert({
      where: { customerId_productId: { customerId: id, productId } },
      create: { tenantId, customerId: id, productId },
      update: {},
    });
  }

  async remove(tenantId: string, customerId: string | null | undefined, productId: string): Promise<void> {
    const id = this.requireCustomerId(customerId);
    await this.prisma.favorite.deleteMany({ where: { tenantId, customerId: id, productId } });
  }
}
