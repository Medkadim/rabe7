import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PdfService } from "../../common/pdf/pdf.service";
import { formatArabicDate, formatDH, pdfShell } from "../../common/pdf/pdf-template.util";

interface OrderForAggregation {
  items: { quantity: number; product: { name: string; unit: string } }[];
}

interface AggregatedLine {
  productName: string;
  unit: string;
  quantity: number;
}

// The whole point of a loading slip: not "here are 12 orders", but "here is
// the one number of Coca Cola cases someone needs to physically put on the
// truck" — the same product ordered by five different customers is one row,
// not five.
function aggregateItems(orders: OrderForAggregation[]): AggregatedLine[] {
  const byKey = new Map<string, AggregatedLine>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.product.name}|${item.product.unit}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        byKey.set(key, { productName: item.product.name, unit: item.product.unit, quantity: item.quantity });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.productName.localeCompare(b.productName, "ar"));
}

function startAndEndOfDay(date: Date): [Date, Date] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

@Injectable()
export class DeliveryPdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
  ) {}

  // "Bon de chargement" for one route — what to load for one driver's
  // truck, plus the stop list for reference.
  async renderRouteLoadingSlip(tenantId: string, routeId: string): Promise<Buffer> {
    const route = await this.prisma.deliveryRoute.findFirst({
      where: { id: routeId, tenantId },
      include: {
        driver: true,
        deliveries: {
          orderBy: { sequence: "asc" },
          include: { order: { include: { customer: true, items: { include: { product: true } } } } },
        },
      },
    });
    if (!route) throw new NotFoundException("Delivery route not found.");

    const orders = route.deliveries.map((d) => d.order);
    const lines = aggregateItems(orders);
    const driverName = route.driver ? `${route.driver.firstName} ${route.driver.lastName}` : "غير محدد";

    const linesHtml =
      lines.map((l) => `<tr><td>${l.productName}</td><td>${l.quantity} ${l.unit}</td></tr>`).join("") ||
      `<tr><td colspan="2" class="muted">لا توجد طلبات على هذه الجولة بعد.</td></tr>`;

    const stopsHtml = route.deliveries
      .map(
        (d, i) => `<tr><td>${i + 1}</td><td>${d.order.orderNumber}</td><td>${d.order.customer.name}</td><td>${formatDH(d.order.total)}</td></tr>`,
      )
      .join("");

    const bodyHtml = `
      <div class="section-title">ملخص البضائع المطلوب تحميلها</div>
      <table>
        <thead><tr><th>المنتج</th><th>الكمية الإجمالية</th></tr></thead>
        <tbody>${linesHtml}</tbody>
      </table>

      <div class="section-title">الطلبات ضمن هذه الجولة (${route.deliveries.length})</div>
      <table>
        <thead><tr><th>#</th><th>رقم الطلب</th><th>العميل</th><th>المجموع</th></tr></thead>
        <tbody>${stopsHtml}</tbody>
      </table>
    `;

    const html = pdfShell({
      eyebrow: `<span class="badge">السائق: ${driverName}</span>`,
      title: `بون التحميل — ${route.name}`,
      subtitle: `تاريخ الجولة: ${formatArabicDate(route.scheduledDate)}`,
      bodyHtml,
    });

    return this.pdf.renderHtmlToPdf(html);
  }

  // The global prep sheet — every product needed across every driver's
  // route for one day, so the warehouse can pick once instead of once per
  // driver, plus a per-route breakdown for context.
  async renderGlobalRecap(tenantId: string, date: Date): Promise<Buffer> {
    const [start, end] = startAndEndOfDay(date);

    const routes = await this.prisma.deliveryRoute.findMany({
      where: { tenantId, scheduledDate: { gte: start, lte: end } },
      include: {
        driver: true,
        deliveries: { include: { order: { include: { items: { include: { product: true } } } } } },
      },
      orderBy: { name: "asc" },
    });

    const allOrders = routes.flatMap((r) => r.deliveries.map((d) => d.order));
    const lines = aggregateItems(allOrders);

    const linesHtml =
      lines.map((l) => `<tr><td>${l.productName}</td><td>${l.quantity} ${l.unit}</td></tr>`).join("") ||
      `<tr><td colspan="2" class="muted">لا توجد طلبات مجدولة لهذا اليوم.</td></tr>`;

    const byRouteHtml =
      routes
        .map((r) => {
          const driverName = r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : "غير محدد";
          return `<tr><td>${r.name}</td><td>${driverName}</td><td>${r.deliveries.length}</td></tr>`;
        })
        .join("") || `<tr><td colspan="3" class="muted">لا توجد جولات لهذا اليوم.</td></tr>`;

    const bodyHtml = `
      <div class="section-title">الملخص العام للبضائع (${allOrders.length} طلب)</div>
      <table>
        <thead><tr><th>المنتج</th><th>الكمية الإجمالية</th></tr></thead>
        <tbody>${linesHtml}</tbody>
      </table>

      <div class="section-title">التوزيع حسب الجولة</div>
      <table>
        <thead><tr><th>الجولة</th><th>السائق</th><th>عدد الطلبات</th></tr></thead>
        <tbody>${byRouteHtml}</tbody>
      </table>
    `;

    const html = pdfShell({
      eyebrow: "تحضير الطلبات",
      title: "الملخص العام للتحميل",
      subtitle: `التاريخ: ${formatArabicDate(date)}`,
      bodyHtml,
    });

    return this.pdf.renderHtmlToPdf(html);
  }
}
