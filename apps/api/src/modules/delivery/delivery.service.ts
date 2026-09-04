import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";
import { CreateRouteDto } from "./dto/create-route.dto";
import { AssignOrderDto } from "./dto/assign-order.dto";
import { UpdateDeliveryStatusDto } from "./dto/update-delivery-status.dto";
import { QueryRoutesDto } from "./dto/query-routes.dto";
import { paginate, PaginatedResult, PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const ASSIGNABLE_ORDER_STATUSES = ["CONFIRMED", "PROCESSING"];
const FINAL_DELIVERY_STATUSES = ["DELIVERED", "PARTIALLY_DELIVERED", "FAILED"];

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
  ) {}

  async createRoute(tenantId: string, dto: CreateRouteDto) {
    return this.prisma.deliveryRoute.create({
      data: {
        tenantId,
        name: dto.name,
        scheduledDate: new Date(dto.scheduledDate),
        driverUserId: dto.driverUserId,
      },
    });
  }

  async listRoutes(tenantId: string, query: QueryRoutesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.DeliveryRouteWhereInput = { tenantId, status: query.status };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.deliveryRoute.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { scheduledDate: query.sortDirection },
        include: { driver: true, deliveries: { include: { order: { include: { customer: true } } } } },
      }),
      this.prisma.deliveryRoute.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // What a driver sees when they open the app — only their own routes, not
  // the tenant-wide list listRoutes()/findRoute() serve to admin. Stops
  // include the customer's default address so the app can show an
  // itinerary and link out to a maps app without a second request.
  async listMyRoutes(tenantId: string, driverUserId: string) {
    return this.prisma.deliveryRoute.findMany({
      where: { tenantId, driverUserId },
      orderBy: { scheduledDate: "desc" },
      include: {
        deliveries: {
          orderBy: { sequence: "asc" },
          include: {
            order: {
              include: {
                customer: { include: { addresses: true } },
                items: { include: { product: true } },
              },
            },
          },
        },
      },
    });
  }

  async findRoute(tenantId: string, id: string) {
    const route = await this.prisma.deliveryRoute.findFirst({
      where: { id, tenantId },
      include: {
        driver: true,
        deliveries: { include: { order: { include: { customer: true } } }, orderBy: { sequence: "asc" } },
      },
    });
    if (!route) throw new NotFoundException("Delivery route not found.");
    return route;
  }

  async assignOrder(tenantId: string, routeId: string, dto: AssignOrderDto) {
    const route = await this.findRoute(tenantId, routeId);
    const order = await this.orders.findOne(tenantId, dto.orderId);

    if (!ASSIGNABLE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException(`An order in "${order.status}" status cannot be scheduled for delivery.`);
    }

    const existing = await this.prisma.delivery.findUnique({ where: { orderId: dto.orderId } });
    if (existing) {
      throw new BadRequestException("This order is already scheduled on a delivery route.");
    }

    return this.prisma.delivery.create({
      data: {
        tenantId,
        orderId: dto.orderId,
        routeId,
        sequence: route.deliveries.length + 1,
        status: "PENDING",
      },
      include: { order: { include: { customer: true } } },
    });
  }

  async listDeliveries(tenantId: string, query: PaginationQueryDto, routeId?: string) {
    const where: Prisma.DeliveryWhereInput = { tenantId, routeId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.delivery.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { order: { include: { customer: true } }, route: true },
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // A driver needs to see what's actually in the order (to load the right
  // items) and where it's going (a delivery address) — the admin-facing
  // list/route queries above don't need either, so this is its own include
  // rather than something every read pays for.
  async findOne(tenantId: string, id: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { id, tenantId },
      include: {
        order: {
          include: {
            customer: { include: { addresses: true } },
            invoice: true,
            items: { include: { product: true } },
          },
        },
        route: true,
      },
    });
    if (!delivery) throw new NotFoundException("Delivery not found.");
    return delivery;
  }

  // The single place a delivery's outcome is recorded — proof of delivery,
  // a partial/failed run, and cash collection all go through here so the
  // order's status and the customer's balance never drift out of sync with
  // what actually happened on the road.
  async updateStatus(tenantId: string, userId: string, id: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.findOne(tenantId, id);
    if (FINAL_DELIVERY_STATUSES.includes(delivery.status)) {
      throw new BadRequestException(`This delivery is already ${delivery.status.toLowerCase()}.`);
    }

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: dto.status,
        recipientName: dto.recipientName,
        proofPhotoUrl: dto.proofPhotoUrl,
        notes: dto.notes,
        cashCollected: dto.cashCollected,
        deliveredAt: dto.status === "DELIVERED" || dto.status === "PARTIALLY_DELIVERED" ? new Date() : undefined,
      },
    });

    if (dto.status === "DELIVERED") {
      await this.prisma.order.update({ where: { id: delivery.orderId }, data: { status: "DELIVERED" } });
    }

    if (dto.cashCollected && dto.cashCollected > 0) {
      await this.payments.create(tenantId, userId, {
        customerId: delivery.order.customerId,
        invoiceId: delivery.order.invoice?.id,
        method: "CASH",
        amount: dto.cashCollected,
        reference: "Collected on delivery",
      });
    }

    return updated;
  }
}
