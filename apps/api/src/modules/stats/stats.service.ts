import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const FEE_RATE = 0.01;
const DEFAULT_PERIOD_DAYS = 30;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolvePeriod(from?: string, to?: string): { from: Date; to: Date } {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - (DEFAULT_PERIOD_DAYS - 1));

    const periodFrom = from ? startOfDay(new Date(from)) : startOfDay(defaultFrom);
    const periodTo = to ? endOfDay(new Date(to)) : endOfDay(now);
    if (Number.isNaN(periodFrom.getTime()) || Number.isNaN(periodTo.getTime())) {
      throw new BadRequestException("Invalid date range.");
    }
    if (periodFrom > periodTo) {
      throw new BadRequestException("The start date must be before the end date.");
    }
    return { from: periodFrom, to: periodTo };
  }

  // Delivered orders are the one dataset every revenue-shaped stat is built
  // from — an order that was cancelled or never delivered isn't real
  // revenue, and Delivery.deliveredAt (not Order.createdAt) is when that
  // revenue actually landed.
  private async deliveredOrdersInPeriod(tenantId: string, from: Date, to: Date) {
    return this.prisma.order.findMany({
      where: { tenantId, status: "DELIVERED", delivery: { deliveredAt: { gte: from, lte: to } } },
      select: {
        id: true,
        total: true,
        delivery: { select: { deliveredAt: true } },
        customer: {
          select: {
            id: true,
            name: true,
            addresses: { where: { isDefault: true }, select: { city: true }, take: 1 },
          },
        },
        items: {
          select: {
            quantity: true,
            lineTotal: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getOverview(tenantId: string, from?: string, to?: string) {
    const period = this.resolvePeriod(from, to);

    const [deliveredOrders, ordersPlaced, pendingOrders, activeCustomers, ordersByStatusRaw] = await Promise.all([
      this.deliveredOrdersInPeriod(tenantId, period.from, period.to),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: period.from, lte: period.to } } }),
      this.prisma.order.count({ where: { tenantId, status: "PENDING" } }),
      this.prisma.customer.count({ where: { tenantId, status: "ACTIVE" } }),
      this.prisma.order.groupBy({
        by: ["status"],
        where: { tenantId, createdAt: { gte: period.from, lte: period.to } },
        _count: { _all: true },
      }),
    ]);

    const revenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const deliveredCount = deliveredOrders.length;
    const avgOrderValue = deliveredCount > 0 ? revenue / deliveredCount : 0;

    const dayBuckets = new Map<string, number>();
    for (const order of deliveredOrders) {
      const deliveredAt = order.delivery?.deliveredAt;
      if (!deliveredAt) continue;
      const key = deliveredAt.toISOString().slice(0, 10);
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + Number(order.total));
    }
    const revenueByDay = [...dayBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const existing = productMap.get(item.product.id) ?? { name: item.product.name, revenue: 0, quantity: 0 };
        existing.revenue += Number(item.lineTotal);
        existing.quantity += item.quantity;
        productMap.set(item.product.id, existing);
      }
    }
    const topProducts = [...productMap.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const customerMap = new Map<string, { name: string; revenue: number }>();
    for (const order of deliveredOrders) {
      const existing = customerMap.get(order.customer.id) ?? { name: order.customer.name, revenue: 0 };
      existing.revenue += Number(order.total);
      customerMap.set(order.customer.id, existing);
    }
    const topCustomers = [...customerMap.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const cityMap = new Map<string, number>();
    for (const order of deliveredOrders) {
      const city = order.customer.addresses[0]?.city ?? "—";
      cityMap.set(city, (cityMap.get(city) ?? 0) + Number(order.total));
    }
    const revenueByCity = [...cityMap.entries()]
      .map(([city, revenue]) => ({ city, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const ordersByStatus = ordersByStatusRaw.map((r) => ({ status: r.status, count: r._count._all }));

    return {
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      kpis: {
        revenue,
        deliveredOrders: deliveredCount,
        ordersPlaced,
        avgOrderValue,
        pendingOrders,
        activeCustomers,
      },
      revenueByDay,
      topProducts,
      topCustomers,
      revenueByCity,
      ordersByStatus,
    };
  }

  async getPlatformFee(tenantId: string, from?: string, to?: string) {
    const period = this.resolvePeriod(from, to);
    const result = await this.prisma.order.aggregate({
      where: { tenantId, status: "DELIVERED", delivery: { deliveredAt: { gte: period.from, lte: period.to } } },
      _sum: { total: true },
      _count: { _all: true },
    });
    const deliveredOrdersTotal = Number(result._sum.total ?? 0);

    return {
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      deliveredOrdersTotal,
      deliveredOrdersCount: result._count._all,
      feeRate: FEE_RATE,
      feeAmount: Math.round(deliveredOrdersTotal * FEE_RATE * 100) / 100,
    };
  }
}
