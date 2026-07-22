import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PromotionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { QueryPromotionsDto } from "./dto/query-promotions.dto";
import { paginate, PaginatedResult } from "../../common/dto/pagination-query.dto";

export interface LineDiscount {
  discountAmount: number;
  promotionId: string | null;
}

export interface LineBonus {
  productId: string;
  quantity: number;
  promotionId: string;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePromotionDto) {
    this.assertShapeValid(dto);

    if (dto.rewardProductId) {
      await this.assertProductExists(tenantId, dto.rewardProductId);
    }
    for (const productId of dto.productIds) {
      await this.assertProductExists(tenantId, productId);
    }

    return this.prisma.promotion.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        discountPercent: dto.discountPercent,
        discountAmount: dto.discountAmount,
        minQuantity: dto.minQuantity,
        buyQuantity: dto.buyQuantity,
        getQuantity: dto.getQuantity,
        rewardProductId: dto.rewardProductId,
        region: dto.region,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        products: { create: dto.productIds.map((productId) => ({ productId })) },
        customers: dto.customerIds
          ? { create: dto.customerIds.map((customerId) => ({ customerId })) }
          : undefined,
      },
      include: { products: true, customers: true },
    });
  }

  private assertShapeValid(dto: CreatePromotionDto | UpdatePromotionDto): void {
    if (dto.type === PromotionType.PERCENTAGE && dto.discountPercent === undefined) {
      throw new BadRequestException("discountPercent is required for a PERCENTAGE promotion.");
    }
    if (dto.type === PromotionType.FIXED_AMOUNT && dto.discountAmount === undefined) {
      throw new BadRequestException("discountAmount is required for a FIXED_AMOUNT promotion.");
    }
    if (
      dto.type === PromotionType.VOLUME_DISCOUNT &&
      (dto.minQuantity === undefined || dto.discountPercent === undefined)
    ) {
      throw new BadRequestException("minQuantity and discountPercent are required for a VOLUME_DISCOUNT promotion.");
    }
    if (
      dto.type === PromotionType.BUY_X_GET_Y &&
      (dto.buyQuantity === undefined || dto.getQuantity === undefined || !dto.rewardProductId)
    ) {
      throw new BadRequestException(
        "buyQuantity, getQuantity and rewardProductId are required for a BUY_X_GET_Y promotion.",
      );
    }
  }

  private async assertProductExists(tenantId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) {
      throw new BadRequestException(`Product ${productId} does not belong to this tenant.`);
    }
  }

  async findAll(tenantId: string, query: QueryPromotionsDto): Promise<PaginatedResult<unknown>> {
    const now = new Date();
    const where: Prisma.PromotionWhereInput = {
      tenantId,
      ...(query.active === "true"
        ? { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.promotion.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { products: { include: { product: true } }, customers: true, rewardProduct: true },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(tenantId: string, id: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: { products: { include: { product: true } }, customers: true, rewardProduct: true },
    });
    if (!promotion) {
      throw new NotFoundException("Promotion not found.");
    }
    return promotion;
  }

  async update(tenantId: string, id: string, dto: UpdatePromotionDto) {
    await this.findOne(tenantId, id);
    if (dto.type) this.assertShapeValid(dto);

    return this.prisma.promotion.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        discountPercent: dto.discountPercent,
        discountAmount: dto.discountAmount,
        minQuantity: dto.minQuantity,
        buyQuantity: dto.buyQuantity,
        getQuantity: dto.getQuantity,
        rewardProductId: dto.rewardProductId,
        region: dto.region,
        isActive: dto.isActive,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: { products: true, customers: true },
    });
  }

  async deactivate(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.promotion.update({ where: { id }, data: { isActive: false } });
  }

  // ---------------------------------------------------------------------
  // Order pricing integration
  // ---------------------------------------------------------------------

  private async findCandidatePromotions(
    tenantId: string,
    productId: string,
    customerId: string,
    types: PromotionType[],
    now: Date,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { addresses: true },
    });
    const customerRegions = new Set((customer?.addresses ?? []).map((a) => a.region).filter(Boolean));

    const promotions = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        type: { in: types },
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        products: { some: { productId } },
      },
      include: { customers: true },
    });

    // A promotion with no PromotionCustomer rows applies to everyone; one
    // with rows only applies to the customers listed. Region works the
    // same way: no region set means "everywhere."
    return promotions.filter((promo) => {
      const customerOk = promo.customers.length === 0 || promo.customers.some((c) => c.customerId === customerId);
      const regionOk = !promo.region || customerRegions.has(promo.region);
      return customerOk && regionOk;
    });
  }

  // The best explicit discount (percentage / fixed / volume) for one order
  // line. Only one discount-type promotion applies per line — no stacking —
  // so a distributor's margin on any given sale stays predictable.
  async resolveDiscount(
    tenantId: string,
    customerId: string,
    productId: string,
    quantity: number,
    unitPrice: number,
    now: Date = new Date(),
  ): Promise<LineDiscount> {
    const candidates = await this.findCandidatePromotions(
      tenantId,
      productId,
      customerId,
      [PromotionType.PERCENTAGE, PromotionType.FIXED_AMOUNT, PromotionType.VOLUME_DISCOUNT],
      now,
    );

    const lineSubtotal = quantity * unitPrice;
    let best: LineDiscount = { discountAmount: 0, promotionId: null };

    for (const promo of candidates) {
      if (promo.type === PromotionType.VOLUME_DISCOUNT && (promo.minQuantity ?? Infinity) > quantity) {
        continue;
      }
      const amount =
        promo.type === PromotionType.FIXED_AMOUNT
          ? Number(promo.discountAmount ?? 0)
          : lineSubtotal * (Number(promo.discountPercent ?? 0) / 100);
      const capped = Math.min(amount, lineSubtotal);
      if (capped > best.discountAmount) {
        best = { discountAmount: Math.round(capped * 100) / 100, promotionId: promo.id };
      }
    }

    return best;
  }

  // Buy-X-get-Y (and gift products, which is the same mechanic with
  // getQuantity = 1) for one order line, independent of any discount above
  // — a customer can get a lower price AND a free item on the same line.
  async resolveBonus(
    tenantId: string,
    customerId: string,
    productId: string,
    quantity: number,
    now: Date = new Date(),
  ): Promise<LineBonus | null> {
    const candidates = await this.findCandidatePromotions(
      tenantId,
      productId,
      customerId,
      [PromotionType.BUY_X_GET_Y],
      now,
    );

    let best: LineBonus | null = null;
    for (const promo of candidates) {
      const buyQuantity = promo.buyQuantity ?? Infinity;
      if (quantity < buyQuantity || !promo.rewardProductId) continue;
      const multiples = Math.floor(quantity / buyQuantity);
      const bonusQuantity = multiples * (promo.getQuantity ?? 0);
      if (bonusQuantity <= 0) continue;
      if (!best || bonusQuantity > best.quantity) {
        best = { productId: promo.rewardProductId, quantity: bonusQuantity, promotionId: promo.id };
      }
    }
    return best;
  }
}
