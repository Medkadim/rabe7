import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SequenceService } from "../../common/sequence/sequence.service";
import { ProductsService } from "../products/products.service";
import { CustomersService } from "../customers/customers.service";
import { PromotionsService } from "../promotions/promotions.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { QueryOrdersDto } from "./dto/query-orders.dto";
import { paginate, PaginatedResult } from "../../common/dto/pagination-query.dto";
import { computeLine, computeOrderTotals } from "./order-totals.util";

const EDITABLE_STATUSES: OrderStatus[] = ["DRAFT", "PENDING"];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
    private readonly products: ProductsService,
    private readonly customers: CustomersService,
    private readonly promotions: PromotionsService,
  ) {}

  private async buildItems(tenantId: string, customerId: string, items: CreateOrderDto["items"]) {
    const computed = [];
    for (const item of items) {
      const product = await this.products.findOne(tenantId, item.productId, true);
      const unitPrice = await this.products.resolvePrice(tenantId, item.productId, customerId, item.quantity);

      // A manually-applied discount (rep judgment call) and a promotion
      // discount (system rule) are independent and additive — a rep can
      // still negotiate on top of a running promotion.
      const { discountAmount: promoDiscount } = await this.promotions.resolveDiscount(
        tenantId,
        customerId,
        item.productId,
        item.quantity,
        unitPrice,
      );

      const { quantity, discountAmount, taxAmount, lineTotal } = computeLine({
        quantity: item.quantity,
        unitPrice,
        discountAmount: (item.discountAmount ?? 0) + promoDiscount,
        taxRatePercent: Number(product.taxRatePercent),
      });
      // Only fields that exist on the OrderItem model go to Prisma —
      // taxRatePercent is an input to the calculation, not something we
      // store per line (the product's current rate is the source of truth).
      computed.push({ productId: item.productId, quantity, unitPrice, discountAmount, taxAmount, lineTotal });

      // Buy-X-get-Y / gift promotions add a separate free line rather than
      // discounting this one — the customer visibly receives units of
      // another product, not a cheaper price on this one.
      const bonus = await this.promotions.resolveBonus(tenantId, customerId, item.productId, item.quantity);
      if (bonus) {
        computed.push({
          productId: bonus.productId,
          quantity: bonus.quantity,
          unitPrice: 0,
          discountAmount: 0,
          taxAmount: 0,
          lineTotal: 0,
        });
      }
    }
    return computed;
  }

  // callerCustomerId is set only for a customer's own login (RETAILER role,
  // see AuthenticatedUser.customerId) — when present, the customer can only
  // ever order for themselves (dto.customerId is ignored, never trusted
  // from the request body) and only once their account is approved. It's
  // undefined/null for staff, who may place an order for any customer.
  async create(tenantId: string, userId: string, dto: CreateOrderDto, callerCustomerId?: string | null) {
    const targetCustomerId = callerCustomerId ?? dto.customerId;
    const customer = await this.customers.findOne(tenantId, targetCustomerId);

    if (callerCustomerId && customer.status !== "ACTIVE") {
      throw new ForbiddenException(
        "Your account is still pending approval. You'll be able to order once it's approved.",
      );
    }

    const lines = await this.buildItems(tenantId, customer.id, dto.items);
    const totals = computeOrderTotals(lines);
    const orderNumber = this.sequence.formatNumber("ORD", await this.sequence.next(tenantId, "order"));

    return this.prisma.order.create({
      data: {
        tenantId,
        orderNumber,
        customerId: customer.id,
        createdByUserId: userId,
        notes: dto.notes,
        status: "DRAFT",
        ...totals,
        items: { create: lines },
        statusHistory: { create: { toStatus: "DRAFT", changedByUserId: userId } },
      },
      include: { items: true, customer: true },
    });
  }

  async findAll(
    tenantId: string,
    query: QueryOrdersDto,
    callerCustomerId?: string | null,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.OrderWhereInput = {
      tenantId,
      status: query.status,
      // A customer's own login only ever sees their own orders, regardless
      // of what customerId (if any) they pass in the query string.
      customerId: callerCustomerId ?? query.customerId,
      ...(query.search ? { orderNumber: { contains: query.search, mode: "insensitive" } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { customer: true, items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(tenantId: string, id: string, callerCustomerId?: string | null) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: { include: { product: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        invoice: true,
      },
    });
    // Same "not found" for missing vs. belongs-to-someone-else — a customer
    // shouldn't be able to tell the two apart by probing order ids.
    if (!order || (callerCustomerId && order.customerId !== callerCustomerId)) {
      throw new NotFoundException("Order not found.");
    }
    return order;
  }

  async update(tenantId: string, id: string, userId: string, dto: UpdateOrderDto, callerCustomerId?: string | null) {
    const order = await this.findOne(tenantId, id, callerCustomerId);
    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(`An order in "${order.status}" status can no longer be edited.`);
    }

    if (!dto.items) {
      return this.prisma.order.update({
        where: { id },
        data: { notes: dto.notes },
        include: { items: true, customer: true },
      });
    }

    const lines = await this.buildItems(tenantId, order.customerId, dto.items);
    const totals = computeOrderTotals(lines);

    return this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      return tx.order.update({
        where: { id },
        data: { notes: dto.notes, ...totals, items: { create: lines } },
        include: { items: true, customer: true },
      });
    });
  }

  async confirm(tenantId: string, id: string, userId: string, callerCustomerId?: string | null) {
    const order = await this.findOne(tenantId, id, callerCustomerId);
    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(`An order in "${order.status}" status cannot be confirmed.`);
    }

    // Hard-blocks by default when a customer has a credit limit configured
    // and this order would exceed it. This is a starting policy, not a
    // fixed rule — it's designed to become a per-tenant setting
    // (block vs. warn-and-allow-override) without changing this code path.
    await this.customers.assertWithinCreditLimit(tenantId, order.customerId, Number(order.total));

    const invoiceNumber = this.sequence.formatNumber("INV", await this.sequence.next(tenantId, "invoice"));
    const customer = await this.customers.findOne(tenantId, order.customerId);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + customer.paymentTermsDays);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          placedAt: order.placedAt ?? new Date(),
          statusHistory: {
            create: { fromStatus: order.status, toStatus: "CONFIRMED", changedByUserId: userId },
          },
        },
        include: { items: true, customer: true },
      });

      await tx.invoice.create({
        data: {
          tenantId,
          orderId: id,
          customerId: order.customerId,
          invoiceNumber,
          totalAmount: order.total,
          dueAt,
        },
      });

      return updated;
    });
  }

  async cancel(tenantId: string, id: string, userId: string, reason: string, callerCustomerId?: string | null) {
    const order = await this.findOne(tenantId, id, callerCustomerId);
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      throw new BadRequestException(`An order in "${order.status}" status cannot be cancelled.`);
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
        statusHistory: {
          create: { fromStatus: order.status, toStatus: "CANCELLED", changedByUserId: userId, note: reason },
        },
      },
      include: { items: true, customer: true },
    });
  }

  async duplicate(tenantId: string, id: string, userId: string, callerCustomerId?: string | null) {
    const original = await this.findOne(tenantId, id, callerCustomerId);
    return this.create(
      tenantId,
      userId,
      {
        customerId: original.customerId,
        notes: original.notes ?? undefined,
        items: original.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountAmount: Number(item.discountAmount),
        })),
      },
      callerCustomerId,
    );
  }
}
